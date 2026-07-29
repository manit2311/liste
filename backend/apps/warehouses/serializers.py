from rest_framework import serializers
from .models import Warehouse

class WarehouseSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.username', read_only=True, default=None)

    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'location', 'capacity', 'manager', 'manager_name']