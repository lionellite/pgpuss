from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    # Complaints CRUD
    path('', views.ComplaintListView.as_view(), name='complaint_list'),
    path('create/', views.ComplaintCreateView.as_view(), name='complaint_create'),
    path('<uuid:pk>/', views.ComplaintDetailView.as_view(), name='complaint_detail'),
    # Public tracking
    path('track/<str:ticket_number>/', views.ComplaintTrackView.as_view(), name='complaint_track'),
    # Actions
    path('<uuid:pk>/assign/', views.ComplaintAssignView.as_view(), name='complaint_assign'),
    path('<uuid:pk>/start/', views.ComplaintStartView.as_view(), name='complaint_start'),
    path('<uuid:pk>/resolve/', views.ComplaintResolveView.as_view(), name='complaint_resolve'),
    path('<uuid:pk>/close/', views.ComplaintCloseView.as_view(), name='complaint_close'),
    path('<uuid:pk>/contest/', views.ComplaintContestView.as_view(), name='complaint_contest'),
    path('<uuid:pk>/escalate/', views.ComplaintEscalateView.as_view(), name='complaint_escalate'),
    # Attachments & History
    path('<uuid:pk>/attachments/', views.ComplaintAttachmentView.as_view(), name='complaint_attachments'),
    path('<uuid:pk>/history/', views.ComplaintHistoryView.as_view(), name='complaint_history'),
]
