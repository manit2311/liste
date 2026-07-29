from rest_framework import serializers
from django.db.models import Sum
from .models import Product, ProductImage
from apps.warehouses.models import WarehouseStock


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url']


class WarehouseStockMiniSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = WarehouseStock
        fields = ['id', 'warehouse', 'warehouse_name', 'quantity']


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_stocks = WarehouseStockMiniSerializer(many=True, read_only=True)
    unassigned = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_unassigned(self, obj):
        allocated = obj.warehouse_stocks.aggregate(s=Sum('quantity'))['s'] or 0
        return obj.quantity - allocated