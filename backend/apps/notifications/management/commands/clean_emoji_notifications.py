import re

from django.core.management.base import BaseCommand

from apps.notifications.models import Notification

# Covers every emoji range used across the app's old notification messages:
# arrows (up/down), warning triangle, person, package, key, plus the
# variation-selector byte (U+FE0F) that often trails emoji like "⚠️".
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F300-\U0001FAFF"  # pictographs (📦 👤 🔑 etc.)
    "\U00002600-\U000027BF"  # misc symbols & dingbats (⚠ etc.)
    "\U00002190-\U000021FF"  # arrows (↓ ↑ etc.)
    "\uFE0F"                 # variation selector-16
    "]+",
    flags=re.UNICODE,
)


class Command(BaseCommand):
    help = "Strip leftover emoji characters from existing Notification.message rows."

    def handle(self, *args, **options):
        updated = 0
        for n in Notification.objects.all():
            cleaned = EMOJI_PATTERN.sub("", n.message).strip()
            if cleaned != n.message:
                n.message = cleaned
                n.save(update_fields=["message"])
                updated += 1
        self.stdout.write(self.style.SUCCESS(f"Cleaned {updated} notification(s)."))