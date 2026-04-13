from django.contrib import admin
from .models import SatisfactionSurvey

@admin.register(SatisfactionSurvey)
class SatisfactionSurveyAdmin(admin.ModelAdmin):
    list_display = ['complaint', 'user', 'rating', 'nps_score', 'created_at']
    list_filter = ['rating']
    readonly_fields = ['created_at']
