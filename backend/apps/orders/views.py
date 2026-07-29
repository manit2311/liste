from rest_framework import viewsets, filters
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order
from .serializers import OrderSerializer
from apps.core.mixins import CompanyScopedMixin


class OrderViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = Order.objects.prefetch_related('items__product').all().order_by('-id')
    serializer_class = OrderSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['status']
    search_fields = ['invoice_number', 'customer_name']

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get('status')
        keyword = self.request.query_params.get('search')
        if status and status != 'all':
            qs = qs.filter(status=status)
        if keyword:
            qs = qs.filter(
                Q(invoice_number__icontains=keyword) |
                Q(customer_name__icontains=keyword)
            )
        return qs