from rest_framework import serializers
from .models import Order, OrderItem
from django.db import transaction
from django.db.models import Sum
from apps.inventory.models import InventoryTransaction
from apps.audit.utils import log_action


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price", "subtotal"]

    def get_subtotal(self, obj):
        return obj.quantity * obj.unit_price


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    subtotal = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    invoice_number = serializers.CharField(required=False, allow_blank=True)

    ALLOWED_TRANSITIONS = {
        "pending": {"pending", "processing", "cancelled"},
        "processing": {"processing", "shipped", "cancelled"},
        "shipped": {"shipped", "delivered", "cancelled"},
        "delivered": {"delivered"},
        "cancelled": {"cancelled", "pending"},
    }

    class Meta:
        model = Order
        fields = [
            "id", "invoice_number", "customer_name", "date", "status",
            "payment_method", "discount_type", "discount_value",
            "shipping_address", "notes", "items", "subtotal", "total",
        ]

    def validate_status(self, value):
        if self.instance is not None:
            current = self.instance.status
            allowed = self.ALLOWED_TRANSITIONS.get(current, set())
            if value not in allowed:
                raise serializers.ValidationError(
                    f"Can't change status from '{current}' to '{value}'."
                )
        return value

    def get_subtotal(self, obj):
        return sum(
            item.quantity * item.unit_price
            for item in obj.items.all()
        )

    def get_total(self, obj):
        subtotal = self.get_subtotal(obj)
        if obj.discount_type == "percent":
            discount = subtotal * (obj.discount_value / 100)
        else:
            discount = obj.discount_value
        return max(subtotal - discount, 0)

    def _generate_invoice_number(self):
        """Generate invoice number scoped to the company — each company starts from INV-0001."""
        company = None
        user = self._current_user()
        if user:
            company = getattr(user, 'company', None)

        if company:
            last = Order.objects.select_for_update().filter(
                company=company
            ).order_by("-id").first()
            count = Order.objects.filter(company=company).count()
            next_num = count + 1
        else:
            count = Order.objects.count()
            next_num = count + 1

        return f"INV-{next_num:04d}"

    def _current_user(self):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user
        return None

    def _rebalance_allocations(self, product):
        """If total stock drops below what's allocated to warehouses,
        trim the excess — 'In-Store'-type warehouses first (sales leave the store)."""
        allocated = product.warehouse_stocks.aggregate(s=Sum('quantity'))['s'] or 0
        excess = allocated - product.quantity
        if excess <= 0:
            return
        stocks = list(product.warehouse_stocks.select_related('warehouse'))
        stocks.sort(key=lambda ws: (0 if 'store' in ws.warehouse.name.lower() else 1, ws.id))
        for ws in stocks:
            if excess <= 0:
                break
            take = min(ws.quantity, excess)
            ws.quantity -= take
            excess -= take
            if ws.quantity == 0:
                ws.delete()
            else:
                ws.save()

    def _restore_stock(self, order, reason):
        user = self._current_user()
        for item in order.items.select_related("product"):
            item.product.quantity += item.quantity
            item.product.save(update_fields=["quantity"])
            InventoryTransaction.objects.create(
                product=item.product,
                user=user,
                transaction_type="return",
                quantity=item.quantity,
                unit_price=item.unit_price,
                remarks=f"Order {order.invoice_number} {reason}",
            )

    def _deduct_stock(self, order, reason):
        user = self._current_user()
        for item in order.items.select_related("product"):
            if item.quantity > item.product.quantity:
                raise serializers.ValidationError(
                    f"{item.product.name} only has {item.product.quantity} items left."
                )
        for item in order.items.select_related("product"):
            item.product.quantity -= item.quantity
            item.product.save(update_fields=["quantity"])
            self._rebalance_allocations(item.product)
            InventoryTransaction.objects.create(
                product=item.product,
                user=user,
                transaction_type="out",
                quantity=item.quantity,
                unit_price=item.unit_price,
                remarks=f"Order {order.invoice_number} {reason}",
            )

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")

        if not validated_data.get("invoice_number"):
            validated_data["invoice_number"] = self._generate_invoice_number()

        order = Order.objects.create(**validated_data)
        user = self._current_user()

        # Stock is only taken once an order is actually delivered.
        # Creating an order as Pending/Processing/Shipped/Cancelled reserves nothing yet.
        holds_stock = order.status == "delivered"

        for item_data in items_data:
            product = item_data["product"]

            if holds_stock and item_data["quantity"] > product.quantity:
                raise serializers.ValidationError(
                    f"{product.name} only has {product.quantity} items left."
                )

            OrderItem.objects.create(order=order, **item_data)

            if holds_stock:
                product.quantity -= item_data["quantity"]
                product.save(update_fields=["quantity"])
                self._rebalance_allocations(product)
                InventoryTransaction.objects.create(
                    product=product,
                    user=user,
                    transaction_type="out",
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    remarks=f"Order {order.invoice_number} created as delivered",
                )

        log_action(user,
                   f"Created order {order.invoice_number} (status: {order.status})",
                   self.context.get("request"))

        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        old_status = instance.status
        new_status = validated_data.get("status", old_status)
        stock_currently_held = old_status == "delivered"

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if old_status != new_status:
            log_action(self._current_user(),
                       f"Order {instance.invoice_number}: status {old_status} → {new_status}",
                       self.context.get("request"))
        else:
            log_action(self._current_user(),
                       f"Edited order {instance.invoice_number}",
                       self.context.get("request"))

        if items_data is not None:
            # give back stock for the items being replaced, but only if it was actually taken
            if stock_currently_held:
                self._restore_stock(instance, "edited — previous items reversed")
            instance.items.all().delete()

            # re-deduct stock for the new set of items, only if the order is (still/now) delivered
            still_holds_stock = new_status == "delivered"
            for item_data in items_data:
                product = item_data["product"]
                if still_holds_stock and item_data["quantity"] > product.quantity:
                    raise serializers.ValidationError(
                        f"{product.name} only has {product.quantity} items left."
                    )
                OrderItem.objects.create(order=instance, **item_data)
                if still_holds_stock:
                    product.quantity -= item_data["quantity"]
                    product.save(update_fields=["quantity"])
                    self._rebalance_allocations(product)
                    InventoryTransaction.objects.create(
                        product=product,
                        user=self._current_user(),
                        transaction_type="out",
                        quantity=item_data["quantity"],
                        unit_price=item_data["unit_price"],
                        remarks=f"Order {instance.invoice_number} edited — new items applied",
                    )
        else:
            # Status-only change (the inline status dropdown) — react only to entering/leaving "delivered"
            if not stock_currently_held and new_status == "delivered":
                self._deduct_stock(instance, "delivered — stock taken")
            elif stock_currently_held and new_status != "delivered":
                self._restore_stock(instance, "un-delivered — stock restored")

        return instance