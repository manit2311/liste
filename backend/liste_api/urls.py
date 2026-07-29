from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.products.urls')),
    path('api/', include('apps.categories.urls')),
    path('api/', include('apps.suppliers.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/', include('apps.orders.urls')),
    path('api/', include('apps.purchase_orders.urls')),
    path('api/', include('apps.warehouses.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.audit.urls')),
    path('api/', include('apps.companies.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)