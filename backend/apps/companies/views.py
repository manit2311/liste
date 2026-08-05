from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer
from apps.users.permissions import IsSuperAdmin


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by('-created_at')
    serializer_class = CompanySerializer

    def get_permissions(self):
        # Boss can update their own company (for privacy toggle)
        # Only Super Admin can create/delete companies
        if self.action in ['create', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return Company.objects.all().order_by('-created_at')
        if user.company:
            return Company.objects.filter(id=user.company.id)
        return Company.objects.none()

    def partial_update(self, request, *args, **kwargs):
        company = self.get_object()
        user = request.user

        # Boss can only update is_private on their own company
        if user.role != 'super_admin':
            if user.company and user.company.id == company.id:
                allowed_fields = {'is_private'}
                if not set(request.data.keys()).issubset(allowed_fields):
                    return Response(
                        {"detail": "You can only update privacy settings."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                return Response(
                    {"detail": "You can only update your own company."},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().partial_update(request, *args, **kwargs)