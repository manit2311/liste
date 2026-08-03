from django.db.models import Q
from apps.users.models import User
from .models import Notification


def notify_admins(title, message, notif_type="info", company=None):
    """Send notification to bosses/admins of a specific company + super admins."""
    qs = User.objects.filter(
        Q(role__in=["admin", "super_admin"]) | Q(is_superuser=True)
    )
    if company:
        # Only admins of this company + super admins (no company)
        qs = qs.filter(Q(company=company) | Q(company__isnull=True))
    qs = qs.filter(is_active=True).distinct()
    Notification.objects.bulk_create([
        Notification(user=u, title=title, message=message,
                     notif_type=notif_type, company=company)
        for u in qs
    ])


def notify_staff(title, message, notif_type="info", company=None):
    """Send notification to ALL active users of a specific company + super admins."""
    if company:
        # Users of this company + super admins (no company)
        qs = User.objects.filter(
            Q(company=company) | Q(company__isnull=True, role="super_admin")
        ).filter(is_active=True)
    else:
        qs = User.objects.filter(is_active=True)
    Notification.objects.bulk_create([
        Notification(user=u, title=title, message=message,
                     notif_type=notif_type, company=company)
        for u in qs
    ])