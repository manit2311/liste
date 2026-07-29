from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.users.permissions import IsBoss
from apps.core.mixins import CompanyScopedMixin


class AuditLogViewSet(CompanyScopedMixin, viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsBoss]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['action', 'user__username']