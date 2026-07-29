from rest_framework import viewsets, filters
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import InventoryTransaction
from .serializers import InventoryTransactionSerializer
from apps.core.mixins import CompanyScopedMixin
from rest_framework.permissions import IsAuthenticated


class InventoryTransactionViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.select_related(
        'product', 'user'
    ).all().order_by('-transaction_date')
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['transaction_type']
    search_fields = ['product__name', 'remarks']

    def get_queryset(self):
        qs = super().get_queryset()
        type_filter = self.request.query_params.get('type')
        keyword = self.request.query_params.get('search')
        if type_filter and type_filter != 'all':
            qs = qs.filter(transaction_type=type_filter)
        if keyword:
            qs = qs.filter(
                Q(product__name__icontains=keyword) |
                Q(remarks__icontains=keyword)
            )
        return qs