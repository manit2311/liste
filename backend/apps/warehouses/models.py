from django.db import models
from apps.users.models import User


class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    location = models.TextField(blank=True, null=True)
    capacity = models.IntegerField(null=True, blank=True)
    manager = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='managed_warehouses'
    )
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='warehouses'
    )

    class Meta:
        db_table = 'warehouses'

    def __str__(self):
        return self.name


class WarehouseStock(models.Model):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name='stocks')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='warehouse_stocks')
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'warehouse_stocks'
        unique_together = ('warehouse', 'product')

    def __str__(self):
        return f'{self.product.name} @ {self.warehouse.name}: {self.quantity}'