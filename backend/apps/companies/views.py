from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Company
from .serializers import CompanySerializer
from apps.users.permissions import IsSuperAdmin
from apps.core.mixins import CompanyScopedMixin


class CompanyViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer

    def get_permissions(self):
        """
        Super Admin — full access (create, edit, delete, list all)
        Boss/Staff — read only, sees only their own company
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]