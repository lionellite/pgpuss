from django.urls import path
from . import views, api_social

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    # Complaints CRUD
    path('', views.ComplaintListView.as_view(), name='complaint_list'),
    path('create/', views.ComplaintCreateView.as_view(), name='complaint_create'),
    path('<uuid:pk>/', views.ComplaintDetailView.as_view(), name='complaint_detail'),
    # Public tracking
    path('track/<str:ticket_number>/', views.ComplaintTrackView.as_view(), name='complaint_track'),

    # Workflow Actions (Bénin)
    path('<uuid:pk>/acknowledge/', views.ComplaintAcknowledgeView.as_view(), name='complaint_acknowledge'),
    path('<uuid:pk>/qualify/', views.ComplaintQualifyView.as_view(), name='complaint_qualify'),
    path('<uuid:pk>/assign/', views.ComplaintAssignView.as_view(), name='complaint_assign'),
    path('<uuid:pk>/start-investigation/', views.ComplaintStartInvestigationView.as_view(), name='complaint_start_investigation'),
    path('<uuid:pk>/resolve/', views.ComplaintResolveView.as_view(), name='complaint_resolve'),
    path('<uuid:pk>/escalate/', views.ComplaintEscalateView.as_view(), name='complaint_escalate'),
    path('<uuid:pk>/arbitrate/', views.ComplaintArbitrateView.as_view(), name='complaint_arbitrate'),
    path('<uuid:pk>/close/', views.ComplaintCloseView.as_view(), name='complaint_close'),

    # Attachments & History
    path('<uuid:pk>/attachments/', views.ComplaintAttachmentView.as_view(), name='complaint_attachments'),
    path('<uuid:pk>/history/', views.ComplaintHistoryView.as_view(), name='complaint_history'),

    # Social & Mobile APIs
    path('webhooks/whatsapp/', api_social.WhatsAppWebhookView.as_view(), name='webhook_whatsapp'),
    path('webhooks/facebook/', api_social.FacebookWebhookView.as_view(), name='webhook_facebook'),
    path('mobile/my-complaints/', api_social.MobileAPIView.as_view(), name='mobile_complaints'),
]
