from rest_framework import serializers
from .models import Supplier

class SupplierSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "contact_person",
            "country",
            "phone",
            "email",
            "address",
            "lead_days",
            "product_count",
        ]

    def get_product_count(self, obj):
        return obj.products.count()