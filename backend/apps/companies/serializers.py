from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ['id', 'name', 'slug', 'is_active', 'is_private', 'created_at', 'user_count']

    def get_user_count(self, obj):
        return obj.users.count()