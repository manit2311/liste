from rest_framework import viewsets
from .models import Company
from .serializers import CompanySerializer
from apps.users.permissions import IsSuperAdmin


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer
    permission_classes = [IsSuperAdmin]