from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer
from apps.users.permissions import IsSuperAdmin


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer

    def get_queryset(self):
        user = self.request.user
        # Super admin sees all companies
        if hasattr(user, 'role') and user.role == 'super_admin':
            return Company.objects.all().order_by('-created_at')
        # Boss/Staff sees only their own company
        if hasattr(user, 'company') and user.company:
            return Company.objects.filter(id=user.company.id)
        return Company.objects.none()

    def get_permissions(self):
        # Anyone authenticated can read (GET)
        # Only Super Admin can create or delete
        # Boss can update their own company (for privacy toggle)
        if self.action in ['create', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        company = self.get_object()
        user = request.user
        # Boss can only update is_private on their own company
        if hasattr(user, 'role') and user.role != 'super_admin':
            if not (user.company and user.company.id == company.id):
                return Response(
                    {"detail": "You can only update your own company."},
                    status=status.HTTP_403_FORBIDDEN
                )
            allowed = {'is_private'}
            if not set(request.data.keys()).issubset(allowed):
                return Response(
                    {"detail": "You can only update privacy settings."},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)