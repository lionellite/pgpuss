from django.urls import path

from . import views

urlpatterns = [
    path('', views.AuditLogListView.as_view(), name='audit_log_list'),
    path('verify-chain/', views.AuditChainVerifyView.as_view(), name='audit_chain_verify'),
    path('<uuid:pk>/', views.AuditLogDetailView.as_view(), name='audit_log_detail'),
]
