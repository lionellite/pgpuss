from rest_framework import serializers
from .models import Region, Establishment, Service


class RegionSerializer(serializers.ModelSerializer):
    establishment_count = serializers.IntegerField(source='establishments.count', read_only=True)

    class Meta:
        model = Region
        fields = ['id', 'name', 'code', 'establishment_count']


class ServiceSerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head.full_name', read_only=True, default=None)

    class Meta:
        model = Service
        fields = ['id', 'name', 'establishment', 'head', 'head_name', 'is_active']


class EstablishmentSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    services = ServiceSerializer(many=True, read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Establishment
        fields = [
            'id', 'name', 'type', 'type_display', 'region', 'region_name',
            'address', 'phone', 'email', 'latitude', 'longitude',
            'is_active', 'services', 'created_at'
        ]


class EstablishmentListSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    service_count = serializers.IntegerField(source='services.count', read_only=True)

    class Meta:
        model = Establishment
        fields = [
            'id', 'name', 'type', 'type_display', 'region', 'region_name',
            'address', 'phone', 'service_count', 'is_active'
        ]
