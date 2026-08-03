from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, ProductImage
from .serializers import ProductSerializer, ProductImageSerializer
from apps.warehouses.models import Warehouse, WarehouseStock
from apps.audit.utils import log_action
from apps.core.mixins import CompanyScopedMixin


def _unassigned(product):
    allocated = product.warehouse_stocks.aggregate(s=Sum('quantity'))['s'] or 0
    return product.quantity - allocated


class ProductViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = Product.objects.select_related(
    'supplier'
    ).prefetch_related('images', 'warehouse_stocks__warehouse')
    serializer_class = ProductSerializer
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'sku', 'description']
    filterset_fields = ['supplier']
    ordering_fields = ['name', 'price', 'quantity', 'create_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get("status")
        if status == "archived":
            return queryset.filter(is_active=False)
        queryset = queryset.filter(is_active=True)
        if status == "low":
            queryset = queryset.filter(quantity__lte=5)
        elif status == "active":
            queryset = queryset.filter(quantity__gt=5)
        return queryset

    def perform_create(self, serializer):
        company = self.get_company()
        serializer.save(company=company)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        products = self.get_queryset().filter(quantity__lte=5)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save(update_fields=["is_active"])
        log_action(request.user, f"Archived product '{product.name}'", request)
        return Response({"status": "archived"})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        product = Product.objects.get(pk=pk)
        product.is_active = True
        product.save(update_fields=["is_active"])
        log_action(request.user, f"Restored product '{product.name}'", request)
        return Response({"status": "restored"})

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        product = self.get_object()
        qty = request.data.get('quantity')
        try:
            qty = int(qty)
        except (TypeError, ValueError):
            return Response({"detail": "Quantity must be a number."}, status=400)
        if qty <= 0:
            return Response({"detail": "Quantity must be greater than 0."}, status=400)
        free = _unassigned(product)
        if qty > free:
            return Response({"detail": f"Only {free} unassigned units available."}, status=400)
        try:
            target = Warehouse.objects.get(
                id=request.data.get('warehouse'),
                company=self.get_company()
            )
        except Warehouse.DoesNotExist:
            return Response({"detail": "Warehouse not found."}, status=400)
        ws, _ = WarehouseStock.objects.get_or_create(product=product, warehouse=target)
        ws.quantity += qty
        ws.save()
        log_action(request.user, f"Assigned {qty} × '{product.name}' to {target.name}", request)
        return Response({"status": "ok"})

    @action(detail=True, methods=['post'])
    def transfer_stock(self, request, pk=None):
        product = self.get_object()
        qty = request.data.get('quantity')
        try:
            qty = int(qty)
        except (TypeError, ValueError):
            return Response({"detail": "Quantity must be a number."}, status=400)
        if qty <= 0:
            return Response({"detail": "Quantity must be greater than 0."}, status=400)
        company = self.get_company()
        try:
            source = Warehouse.objects.get(id=request.data.get('from_warehouse'), company=company)
            target = Warehouse.objects.get(id=request.data.get('to_warehouse'), company=company)
        except Warehouse.DoesNotExist:
            return Response({"detail": "Warehouse not found."}, status=400)
        if source.id == target.id:
            return Response({"detail": "Source and destination are the same."}, status=400)
        try:
            src = WarehouseStock.objects.get(product=product, warehouse=source)
        except WarehouseStock.DoesNotExist:
            return Response({"detail": f"No stock in {source.name}."}, status=400)
        if qty > src.quantity:
            return Response({"detail": f"Only {src.quantity} in {source.name}."}, status=400)
        dst, _ = WarehouseStock.objects.get_or_create(product=product, warehouse=target)
        src.quantity -= qty
        dst.quantity += qty
        dst.save()
        if src.quantity == 0:
            src.delete()
        else:
            src.save()
        log_action(request.user,
                   f"Transferred {qty} × '{product.name}' from {source.name} to {target.name}",
                   request)
        return Response({"status": "ok"})

    @action(detail=True, methods=['post'])
    def unassign(self, request, pk=None):
        product = self.get_object()
        qty = request.data.get('quantity')
        try:
            qty = int(qty)
        except (TypeError, ValueError):
            return Response({"detail": "Quantity must be a number."}, status=400)
        if qty <= 0:
            return Response({"detail": "Quantity must be greater than 0."}, status=400)
        try:
            source = Warehouse.objects.get(
                id=request.data.get('warehouse'),
                company=self.get_company()
            )
            src = WarehouseStock.objects.get(product=product, warehouse=source)
        except (Warehouse.DoesNotExist, WarehouseStock.DoesNotExist):
            return Response({"detail": "No stock in that warehouse."}, status=400)
        if qty > src.quantity:
            return Response({"detail": f"Only {src.quantity} available."}, status=400)
        src.quantity -= qty
        if src.quantity == 0:
            src.delete()
        else:
            src.save()
        log_action(request.user,
                   f"Unassigned {qty} × '{product.name}' from {source.name}",
                   request)
        return Response({"status": "ok"})


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.select_related('product').all()
    serializer_class = ProductImageSerializer