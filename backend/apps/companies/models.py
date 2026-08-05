from django.db import models


class Company(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    is_private = models.BooleanField(default=False)  # Boss can hide data from Super Admin
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'companies'

    def __str__(self):
        return self.name