from django.db import models
from apps.categories.models import Category
from apps.suppliers.models import Supplier


class Product(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=100, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=0)
    reorder_point = models.IntegerField(default=5)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='products'
    )
    create_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'products'
        # SKU unique per company (two companies can share a SKU)
        unique_together = [['sku', 'company']]

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.TextField()

    class Meta:
        db_table = 'product_images'