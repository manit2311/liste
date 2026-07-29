from django.db import models
from apps.users.models import User

class Notification(models.Model):
    TYPE_CHOICES = [
        ('login', 'User Login'),
        ('low_stock', 'Low Stock'),
        ('edit', 'Edit Alert'),
        ('arrival', 'Items Arrived'),
        ('stock_in', 'Stock In'),
        ('stock_out', 'Stock Out'),
        ('info', 'Info'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="Notification")
    message = models.TextField()
    notif_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'Notification for {self.user.username}'