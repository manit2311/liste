from rest_framework.routers import DefaultRouter
from .views import InventoryTransactionViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryTransactionViewSet)
urlpatterns = router.urls