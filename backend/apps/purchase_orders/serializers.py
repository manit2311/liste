from rest_framework import serializers
from django.db import transaction
from .models import PurchaseOrder, PurchaseOrderItem
from apps.inventory.models import InventoryTransaction
from apps.audit.utils import log_action


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    po_number = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    # Workflow: Pending → Approved → In Transit → Received (final).
    # Pending can be Rejected; Rejected can be resubmitted to Pending.
    # Cancel allowed any time before Received; Cancelled can be reopened to Pending.
    ALLOWED_TRANSITIONS = {
        "pending": {"pending", "approved", "rejected", "cancelled"},
        "approved": {"approved", "in_transit", "received", "cancelled"},
        "in_transit": {"in_transit", "received", "cancelled"},
        "received": {"received"},
        "rejected": {"rejected", "pending"},
        "cancelled": {"cancelled", "pending"},
    }

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'supplier', 'supplier_name', 'user', 'username',
            'order_date', 'expected_date', 'warehouse', 'warehouse_name',
            'notes', 'status', 'items', 'total',
        ]
        read_only_fields = ['user']

    def validate_status(self, value):
        if self.instance is not None:
            current = self.instance.status
            allowed = self.ALLOWED_TRANSITIONS.get(current, set())
            if value not in allowed:
                raise serializers.ValidationError(
                    f"Can't change status from '{current}' to '{value}'."
                )
        return value

    def get_po_number(self, obj):
        return f"PO-{obj.id:04d}"

    def get_total(self, obj):
        return sum(item.quantity * item.price for item in obj.items.all())

    def _current_user(self):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user
        return None

    def _add_stock_for_received(self, po):
        user = self._current_user()
        for item in po.items.select_related("product"):
            item.product.quantity += item.quantity
            item.product.save(update_fields=["quantity"])
            InventoryTransaction.objects.create(
                product=item.product,
                user=user,
                transaction_type="in",
                quantity=item.quantity,
                unit_price=item.price,
                remarks=f"PO-{po.id:04d} received",
            )

    def _reverse_stock_for_received(self, po):
        user = self._current_user()
        for item in po.items.select_related("product"):
            item.product.quantity -= item.quantity
            item.product.save(update_fields=["quantity"])
            InventoryTransaction.objects.create(
                product=item.product,
                user=user,
                transaction_type="adjustment",
                quantity=-item.quantity,
                unit_price=item.price,
                remarks=f"PO-{po.id:04d} un-received — stock reversed",
            )

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        po = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item_data)

        if po.status == "received":
            self._add_stock_for_received(po)

        log_action(self._current_user(),
                   f"Created PO-{po.id:04d} (status: {po.status})",
                   self.context.get("request"))

        return po

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        old_status = instance.status
        new_status = validated_data.get('status', old_status)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if old_status != new_status:
            log_action(self._current_user(),
                       f"PO-{instance.id:04d}: status {old_status} → {new_status}",
                       self.context.get("request"))

        if items_data is not None:
            # If this PO already contributed stock, reverse it before replacing items
            if old_status == "received":
                self._reverse_stock_for_received(instance)
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item_data)
            # Re-apply stock if it's still (or newly) received
            if new_status == "received":
                self._add_stock_for_received(instance)
        else:
            # Items unchanged — only react to a status transition
            if old_status != "received" and new_status == "received":
                self._add_stock_for_received(instance)
            elif old_status == "received" and new_status != "received":
                self._reverse_stock_for_received(instance)

        return instance