from django.db import models


class Supplier(models.Model):
    name = models.CharField(max_length=100)
    contact_person = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True, null=True)
    lead_days = models.IntegerField(default=7)
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='suppliers'
    )

    class Meta:
        db_table = 'suppliers'

    def __str__(self):
        return self.name