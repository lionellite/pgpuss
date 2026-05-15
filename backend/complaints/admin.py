from django.contrib import admin
from .models import Category, Complaint, Attachment, ComplaintHistory, Escalation


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'icon', 'order']
    list_filter = ['parent']
    search_fields = ['name']


class AttachmentInline(admin.TabularInline):
    model = Attachment
    extra = 0
    readonly_fields = ['uploaded_at']


class HistoryInline(admin.TabularInline):
    model = ComplaintHistory
    extra = 0
    readonly_fields = ['timestamp', 'action', 'old_status', 'new_status', 'actor']


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'title', 'status', 'priority', 'channel', 'establishment', 'created_at']
    list_filter = ['status', 'priority', 'channel', 'category', 'establishment']
    search_fields = ['ticket_number', 'title', 'description']
    readonly_fields = ['ticket_number', 'created_at', 'updated_at']
    inlines = [AttachmentInline, HistoryInline]


@admin.register(Escalation)
class EscalationAdmin(admin.ModelAdmin):
    list_display = ['complaint', 'from_user', 'to_user', 'escalated_at']
    readonly_fields = ['escalated_at']
