from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import UserRole
from audit.models import AuditLog
from audit.services import log_audit_event
from complaints.models import Complaint

User = get_user_model()


class AuditLogModelTests(TestCase):
    def test_entries_are_immutable(self):
        log_audit_event(event_type='SYSTEM', action='Test')
        entry = AuditLog.objects.first()
        entry.action = 'Modified'
        with self.assertRaises(PermissionError):
            entry.save()
        with self.assertRaises(PermissionError):
            entry.delete()

    def test_hash_chain_valid(self):
        log_audit_event(event_type='SYSTEM', action='Event 1')
        log_audit_event(event_type='SYSTEM', action='Event 2')
        result = AuditLog.verify_chain()
        self.assertTrue(result['valid'])
        self.assertEqual(result['checked'], 2)

    def test_complaint_creation_creates_audit_entry(self):
        Complaint.objects.create(title='Test', description='Desc')
        self.assertTrue(AuditLog.objects.filter(event_type='COMPLAINT', action='Plainte créée').exists())


class AuditLogAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@test.bj',
            password='AdminPass123!',
            role=UserRole.ADMIN_PLATEFORME,
            first_name='Admin',
            last_name='Test',
        )
        self.cabinet = User.objects.create_user(
            email='cabinet@test.bj',
            password='CabinetPass123!',
            role=UserRole.CABINET,
            first_name='Cabinet',
            last_name='Test',
        )
        self.pfe = User.objects.create_user(
            email='pfe@test.bj',
            password='PfePass123!',
            role=UserRole.PFE,
            first_name='PFE',
            last_name='Test',
        )
        log_audit_event(event_type='SYSTEM', action='Seed audit')

    def test_admin_can_list_audit_logs(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/audit/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json().get('count', len(response.json())), 1)

    def test_cabinet_can_list_audit_logs(self):
        self.client.force_authenticate(user=self.cabinet)
        response = self.client.get('/api/audit/')
        self.assertEqual(response.status_code, 200)

    def test_other_roles_denied(self):
        self.client.force_authenticate(user=self.pfe)
        response = self.client.get('/api/audit/')
        self.assertEqual(response.status_code, 403)

    def test_verify_chain_endpoint(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/audit/verify-chain/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['valid'])
