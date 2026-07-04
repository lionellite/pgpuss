from django.contrib import admin
from .models import Region, ZoneSanitaire, Establishment, Service


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code']
    search_fields = ['name', 'code']


@admin.register(ZoneSanitaire)
class ZoneSanitaireAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'region', 'is_active']
    list_filter = ['region', 'is_active']
    # search_fields requis pour autocomplete_fields dans UserAdmin
    search_fields = ['name', 'code', 'communes']
    ordering = ['region__name', 'name']


@admin.register(Establishment)
class EstablishmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'region', 'zone_sanitaire', 'phone', 'is_active']
    list_filter = ['type', 'region', 'zone_sanitaire', 'is_active']
    # search_fields requis pour autocomplete_fields dans UserAdmin
    search_fields = ['name', 'address']
    ordering = ['name']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'establishment', 'head', 'is_active']
    list_filter = ['establishment', 'is_active']
    search_fields = ['name']

