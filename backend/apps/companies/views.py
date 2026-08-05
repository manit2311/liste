from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Company
from .serializers import CompanySerializer
from apps.users.permissions import IsSuperAdmin


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        # Super admin sees all companies
        if user.role == 'super_admin':
            return Company.objects.all().order_by('-created_at')
        # Boss/Staff sees only their own company
        if user.company:
            return Company.objects.filter(id=user.company.id)
        return Company.objects.none()