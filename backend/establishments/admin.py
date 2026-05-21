from django.contrib import admin
from .models import Region, ZoneSanitaire, Establishment, Service


@admin.register(ZoneSanitaire)
class ZoneSanitaireAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'region', 'is_active']
    list_filter = ['region', 'is_active']
    search_fields = ['name', 'communes']
    ordering = ['region', 'name']


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']
    search_fields = ['name']


@admin.register(Establishment)
class EstablishmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'region', 'zone_sanitaire', 'phone', 'is_active']
    list_filter = ['type', 'region', 'zone_sanitaire', 'is_active']
    search_fields = ['name', 'address']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'establishment', 'head', 'is_active']
    list_filter = ['establishment', 'is_active']
    search_fields = ['name']
