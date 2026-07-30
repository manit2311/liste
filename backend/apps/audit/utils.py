from .models import AuditLog


def _detect_device(request):
    if request is None:
        return ""
    ua = request.META.get("HTTP_USER_AGENT", "")

    if "Windows" in ua:
        os_name = "Windows"
    elif "iPhone" in ua:
        os_name = "iPhone"
    elif "iPad" in ua:
        os_name = "iPad"
    elif "Android" in ua:
        os_name = "Android"
    elif "Mac OS" in ua or "Macintosh" in ua:
        os_name = "Mac"
    elif "Linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown"

    if "Edg/" in ua or "Edge/" in ua:
        browser = "Edge"
    elif "OPR/" in ua or "Opera" in ua:
        browser = "Opera"
    elif "Chrome/" in ua:
        browser = "Chrome"
    elif "Firefox/" in ua:
        browser = "Firefox"
    elif "Safari/" in ua:
        browser = "Safari"
    else:
        browser = "Unknown"

    return f"{os_name} · {browser}"


def log_action(user, action, request=None):
    """Write one permanent audit entry with device info and company."""
    company = getattr(user, 'company', None) if user else None
    AuditLog.objects.create(
        user=user if getattr(user, "is_authenticated", False) else None,
        action=action,
        device=_detect_device(request),
        company=company,
    )