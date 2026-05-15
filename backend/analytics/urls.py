from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('public-stats/', views.PublicStatsView.as_view(), name='public_stats'),
    path('satisfaction/', views.SatisfactionCreateView.as_view(), name='satisfaction_create'),
    path('satisfaction/list/', views.SatisfactionListView.as_view(), name='satisfaction_list'),
]
