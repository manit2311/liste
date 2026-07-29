from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import PurchaseOrder, PurchaseOrderItem
from .serializers import PurchaseOrderSerializer, PurchaseOrderItemSerializer
from apps.inventory.models import InventoryTransaction
from apps.core.mixins import CompanyScopedMixin
from apps.users.permissions import IsBoss


class PurchaseOrderViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related(
        'supplier', 'user'
    ).prefetch_related('items').all().order_by('-order_date')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsBoss]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['status', 'supplier']

    def perform_destroy(self, instance):
        if instance.status == "received":
            user = self.request.user if self.request.user.is_authenticated else None
            for item in instance.items.select_related("product"):
                item.product.quantity -= item.quantity
                item.product.save(update_fields=["quantity"])
                InventoryTransaction.objects.create(
                    product=item.product,
                    user=user,
                    transaction_type="adjustment",
                    quantity=-item.quantity,
                    unit_price=item.price,
                    remarks=f"PO-{instance.id:04d} deleted — stock reversed",
                    company=instance.company,
                )
        instance.delete()


class PurchaseOrderItemViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = PurchaseOrderItem.objects.select_related(
        'purchase_order', 'product'
    ).all()
    serializer_class = PurchaseOrderItemSerializer
    permission_classes = [IsBoss]