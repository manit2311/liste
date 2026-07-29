from rest_framework import serializers
from django.db import transaction
from .models import InventoryTransaction

class InventoryTransactionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'product', 'product_name', 'user', 'username',
            'transaction_type', 'quantity', 'unit_price', 'total', 'remarks', 'transaction_date',
        ]
        read_only_fields = ['user']

    def get_total(self, obj):
        if obj.unit_price is None:
            return None
        return abs(obj.quantity) * obj.unit_price

    def validate(self, data):
        transaction_type = data.get("transaction_type")
        quantity = data.get("quantity")

        if transaction_type in ("in", "out", "return") and quantity is not None and quantity < 0:
            raise serializers.ValidationError(
                "Quantity must be positive for stock in / out / return entries."
            )

        if transaction_type == "out":
            product = data.get("product")
            if product and quantity and quantity > product.quantity:
                raise serializers.ValidationError(
                    f"{product.name} only has {product.quantity} in stock."
                )

        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user

        if validated_data.get("unit_price") is None:
            validated_data["unit_price"] = validated_data["product"].price

        entry = InventoryTransaction.objects.create(**validated_data)

        product = entry.product
        if entry.transaction_type in ("in", "return"):
            product.quantity += entry.quantity
        elif entry.transaction_type == "out":
            product.quantity -= entry.quantity
        elif entry.transaction_type == "adjustment":
            product.quantity += entry.quantity

        product.save(update_fields=["quantity"])
        return entry