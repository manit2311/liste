from django.db import models
from apps.users.models import User


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.TextField()
    device = models.CharField(max_length=100, blank=True, default="")
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='audit_logs'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'

    def __str__(self):
        return f'{self.user} - {self.action[:50]}'