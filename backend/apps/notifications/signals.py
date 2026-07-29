from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.inventory.models import InventoryTransaction
from apps.products.models import Product
from .utils import notify_admins, notify_staff


@receiver(post_save, sender=InventoryTransaction)
def stock_movement_alert(sender, instance, created, **kwargs):
    if not created:
        return
    product = instance.product
    remarks = (instance.remarks or "")

    if instance.transaction_type == "in":
        if "received" in remarks.lower():
            notify_staff("Items arrived",
                         f"📦 {product.name} +{instance.quantity} — {remarks}",
                         "arrival")
        else:
            notify_staff("Stock in",
                         f"⬆️ {product.name} +{instance.quantity}",
                         "stock_in")
    elif instance.transaction_type == "out":
        notify_staff("Stock out",
                     f"⬇️ {product.name} −{instance.quantity} — {remarks}",
                     "stock_out")

    # Low stock check — notify everyone
    product.refresh_from_db()
    if product.quantity <= product.reorder_point:
        notify_staff("Low stock alert",
                     f"⚠️ {product.name} is low: only {product.quantity} left "
                     f"(reorder point: {product.reorder_point})",
                     "low_stock")


@receiver(post_save, sender=Product)
def product_edit_alert(sender, instance, created, update_fields=None, **kwargs):
    if created:
        return
    if update_fields and set(update_fields) == {"quantity"}:
        return
    if update_fields and set(update_fields) == {"is_active"}:
        return
    # Only boss gets product edit alerts
    notify_admins("Product edited",
                  f"✏️ {instance.name} was updated",
                  "edit")