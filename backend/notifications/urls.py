from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('<uuid:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification_read'),
    path('read-all/', views.NotificationMarkAllReadView.as_view(), name='notification_read_all'),
    path('unread-count/', views.UnreadCountView.as_view(), name='notification_unread_count'),
]
