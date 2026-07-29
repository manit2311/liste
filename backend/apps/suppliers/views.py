from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from .models import Supplier
from .serializers import SupplierSerializer
from apps.core.mixins import CompanyScopedMixin
from apps.users.permissions import IsBossOrReadOnly


class SupplierViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsBossOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def destroy(self, request, *args, **kwargs):
        supplier = self.get_object()
        if supplier.products.exists():
            return Response(
                {"error": "Cannot delete supplier because it has products."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)