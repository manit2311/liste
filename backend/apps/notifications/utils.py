from django.db.models import Q
from apps.users.models import User
from .models import Notification


def notify_admins(title, message, notif_type="info"):
    """Send notification to all bosses/admins only."""
    admins = User.objects.filter(
        Q(is_superuser=True) | Q(role__in=["admin", "super_admin"])
    ).distinct()
    Notification.objects.bulk_create([
        Notification(user=a, title=title, message=message, notif_type=notif_type)
        for a in admins
    ])


def notify_staff(title, message, notif_type="info"):
    """Send notification to ALL users (boss + staff)."""
    users = User.objects.filter(is_active=True)
    Notification.objects.bulk_create([
        Notification(user=u, title=title, message=message, notif_type=notif_type)
        for u in users
    ])