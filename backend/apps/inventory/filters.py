import django_filters
from .models import InventoryTransaction


class InventoryTransactionFilter(django_filters.FilterSet):
    # Comma-separated multi-select, e.g. ?transaction_type=in,out
    transaction_type = django_filters.CharFilter(method="filter_types")
    # Comma-separated multi-select, e.g. ?username=manita,admin
    username = django_filters.CharFilter(method="filter_usernames")
    quantity_min = django_filters.NumberFilter(field_name="quantity", lookup_expr="gte")
    quantity_max = django_filters.NumberFilter(field_name="quantity", lookup_expr="lte")
    date_from = django_filters.DateFilter(field_name="transaction_date", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="transaction_date", lookup_expr="date__lte")

    class Meta:
        model = InventoryTransaction
        fields = ["product"]

    def filter_types(self, queryset, name, value):
        types = [t.strip() for t in value.split(",") if t.strip()]
        return queryset.filter(transaction_type__in=types) if types else queryset

    def filter_usernames(self, queryset, name, value):
        usernames = [u.strip() for u in value.split(",") if u.strip()]
        return queryset.filter(user__username__in=usernames) if usernames else queryset