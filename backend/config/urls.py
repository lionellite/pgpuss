"""
URL configuration for PGP-USS project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/complaints/', include('complaints.urls')),
    path('api/establishments/', include('establishments.urls')),
    path('api/admin/establishments/', include('establishments.admin_urls')),
    path('api/admin/', include('complaints.admin_urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/support/', include('support.urls')),
]

if settings.DEBUG:
    media_url = getattr(settings, 'MEDIA_URL', '/media/')
    media_root = getattr(settings, 'MEDIA_ROOT', None)
    if media_root:
        urlpatterns += static(media_url, document_root=media_root)
