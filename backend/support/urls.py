from django.urls import path
from . import views

urlpatterns = [
    path('report/', views.PlatformReportCreateView.as_view(), name='support_create'),
    path('reports/', views.PlatformReportListView.as_view(), name='support_list'),
    path('reports/<uuid:pk>/', views.PlatformReportDetailView.as_view(), name='support_detail'),
]
