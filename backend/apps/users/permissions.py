from rest_framework.permissions import BasePermission, SAFE_METHODS


def _is_super_admin(user):
    return bool(user and user.is_authenticated and user.role == "super_admin")


def _is_boss(user):
    return bool(user and user.is_authenticated and (
        user.is_superuser or user.role in ("admin", "super_admin")
    ))


class IsSuperAdmin(BasePermission):
    """Only the platform super admin."""
    def has_permission(self, request, view):
        return _is_super_admin(request.user)


class IsBoss(BasePermission):
    """Boss or super admin."""
    def has_permission(self, request, view):
        return _is_boss(request.user)


class IsBossOrReadOnly(BasePermission):
    """Staff may read; only boss may write."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return _is_boss(request.user)


class IsAuthenticated(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)