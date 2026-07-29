from rest_framework import viewsets, filters
from .models import Category
from .serializers import CategorySerializer
from apps.core.mixins import CompanyScopedMixin
from apps.users.permissions import IsBossOrReadOnly


class CategoryViewSet(CompanyScopedMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsBossOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']