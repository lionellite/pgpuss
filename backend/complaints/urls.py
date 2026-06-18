from django.urls import path
from . import views, api_social, views_callcenter

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    # Mon périmètre (établissements/zones selon rôle)
    path('my-scope/', views.MyScopeView.as_view(), name='my_scope'),
    # Complaints CRUD
    path('', views.ComplaintListView.as_view(), name='complaint_list'),
    path('create/', views.ComplaintCreateView.as_view(), name='complaint_create'),
    path('<uuid:pk>/deposit-media/', views.ComplaintDepositMediaView.as_view(), name='complaint_deposit_media'),
    path('storage-health/', views.StorageHealthView.as_view(), name='storage_health'),
    path('<uuid:pk>/', views.ComplaintDetailView.as_view(), name='complaint_detail'),
    # Public tracking
    path('track/<str:ticket_number>/', views.ComplaintTrackView.as_view(), name='complaint_track'),
    path('track/<str:ticket_number>/request-access-code/', views.ComplaintPublicRequestAccessCodeView.as_view(), name='complaint_public_request_access_code'),
    path('track/<str:ticket_number>/verify-access-code/', views.ComplaintPublicVerifyAccessCodeView.as_view(), name='complaint_public_verify_access_code'),
    path('track/<str:ticket_number>/provide-info/', views.ComplaintPublicProvideInfoView.as_view(), name='complaint_public_provide_info'),

    # Workflow Actions (Bénin)
    path('<uuid:pk>/acknowledge/', views.ComplaintAcknowledgeView.as_view(), name='complaint_acknowledge'),
    path('<uuid:pk>/request-info/', views.ComplaintRequestInfoView.as_view(), name='complaint_request_info'),
    path('<uuid:pk>/provide-info/', views.ComplaintProvideInfoView.as_view(), name='complaint_provide_info'),
    path('<uuid:pk>/qualify/', views.ComplaintQualifyView.as_view(), name='complaint_qualify'),
    path('<uuid:pk>/assign/', views.ComplaintAssignView.as_view(), name='complaint_assign'),
    path('<uuid:pk>/accept-assignment/', views.ComplaintAcceptAssignmentView.as_view(), name='complaint_accept_assignment'),
    path('<uuid:pk>/refuse-assignment/', views.ComplaintRefuseAssignmentView.as_view(), name='complaint_refuse_assignment'),
    path('<uuid:pk>/start-investigation/', views.ComplaintStartInvestigationView.as_view(), name='complaint_start_investigation'),
    path('<uuid:pk>/investigation-log/', views.ComplaintInvestigationLogView.as_view(), name='complaint_investigation_log'),
    path('<uuid:pk>/request-extension/', views.ComplaintRequestExtensionView.as_view(), name='complaint_request_extension'),
    path('<uuid:pk>/resolve/', views.ComplaintResolveView.as_view(), name='complaint_resolve'),
    path('<uuid:pk>/ack-resolution/', views.ComplaintAcknowledgeResolutionView.as_view(), name='complaint_ack_resolution'),
    path('<uuid:pk>/validate-resolution/', views.ComplaintValidateResolutionView.as_view(), name='complaint_validate_resolution'),
    path('<uuid:pk>/reject-resolution/', views.ComplaintRejectResolutionView.as_view(), name='complaint_reject_resolution'),
    path('<uuid:pk>/escalate/', views.ComplaintEscalateView.as_view(), name='complaint_escalate'),
    path('<uuid:pk>/dds-assign-inspector/', views.ComplaintDDSAssignInspectorView.as_view(), name='complaint_dds_assign_inspector'),
    path('<uuid:pk>/dds-investigation/', views.ComplaintDDSInvestigationView.as_view(), name='complaint_dds_investigation'),
    path('<uuid:pk>/notify-parties/', views.ComplaintNotifyPartiesView.as_view(), name='complaint_notify_parties'),
    path('<uuid:pk>/arbitrate/', views.ComplaintArbitrateView.as_view(), name='complaint_arbitrate'),
    path('<uuid:pk>/close/', views.ComplaintCloseView.as_view(), name='complaint_close'),
    path('<uuid:pk>/withdraw/', views.ComplaintWithdrawView.as_view(), name='complaint_withdraw'),
    path('<uuid:pk>/reopen/', views.ComplaintReopenView.as_view(), name='complaint_reopen'),

    # Attachments & History
    path('<uuid:pk>/attachments/', views.ComplaintAttachmentView.as_view(), name='complaint_attachments'),
    path('<uuid:pk>/history/', views.ComplaintHistoryView.as_view(), name='complaint_history'),
    path('<uuid:pk>/documents/<uuid:doc_id>/', views.ComplaintDocumentDetailView.as_view(), name='complaint_document_detail'),
    path('<uuid:pk>/documents/', views.ComplaintDocumentsView.as_view(), name='complaint_documents'),

    # Social & Mobile APIs
    path('webhooks/whatsapp/', api_social.WhatsAppWebhookView.as_view(), name='webhook_whatsapp'),
    path('webhooks/facebook/', api_social.FacebookWebhookView.as_view(), name='webhook_facebook'),

    # Call Center — boîte de réception des plaintes sociales
    path('callcenter/social-inbox/', views_callcenter.SocialComplaintInboxView.as_view(), name='callcenter_social_inbox'),
    path('callcenter/social-inbox/<uuid:pk>/', views_callcenter.SocialComplaintDetailView.as_view(), name='callcenter_social_detail'),
    path('callcenter/social-inbox/<uuid:pk>/complete/', views_callcenter.SocialComplaintCompleteView.as_view(), name='callcenter_social_complete'),
]
