from django.urls import path
from . import views

urlpatterns = [
    path('regions/', views.RegionListView.as_view(), name='region_list'),
    path('', views.EstablishmentListView.as_view(), name='establishment_list'),
    path('<uuid:pk>/', views.EstablishmentDetailView.as_view(), name='establishment_detail'),
    path('<uuid:establishment_id>/services/', views.ServiceListView.as_view(), name='service_list'),
]
