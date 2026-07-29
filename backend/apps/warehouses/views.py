from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Warehouse, WarehouseStock
from .serializers import WarehouseSerializer
from apps.core.mixins import CompanyScopedMixin
from apps.users.permissions import IsBossOrReadOnly


class WarehouseViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsBossOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'location']

    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        warehouse = self.get_object()
        entries = WarehouseStock.objects.filter(
            warehouse=warehouse
        ).select_related('product').order_by('product__name')
        data = [
            {
                "product_id": e.product.id,
                "name": e.product.name,
                "sku": e.product.sku,
                "quantity": e.quantity,
                "total": e.product.quantity,
                "reorder_point": e.product.reorder_point,
            }
            for e in entries
        ]
        return Response({
            "warehouse": warehouse.name,
            "capacity": warehouse.capacity,
            "total_units": sum(e.quantity for e in entries),
            "products": data,
        })