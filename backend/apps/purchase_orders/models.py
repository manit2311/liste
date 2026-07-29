from django.db import models
from apps.suppliers.models import Supplier
from apps.users.models import User
from apps.products.models import Product

class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('in_transit', 'In Transit'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    order_date = models.DateTimeField(auto_now_add=True)
    expected_date = models.DateField(null=True, blank=True)
    warehouse = models.ForeignKey('warehouses.Warehouse', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='purchase_orders'
    )
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')

    class Meta:
        db_table = 'purchase_orders'

    def __str__(self):
        return f'PO #{self.id} - {self.supplier}'
    
class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'purchase_order_items'