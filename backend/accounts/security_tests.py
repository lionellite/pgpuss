from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import uuid

User = get_user_model()

class SecurityTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='password123',
            first_name='User',
            last_name='One',
            role='USAGER'
        )
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='password123',
            first_name='User',
            last_name='Two',
            role='USAGER'
        )

    def test_user_idor_vulnerability(self):
        """Test if user1 can access user2's details"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/auth/users/{self.user2.id}/')
        # DRF returns 404 if the object is filtered out from the queryset
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_privilege_escalation_vulnerability(self):
        """Test if user1 can change their own role to ADMIN_NATIONAL"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.patch(f'/api/auth/users/{self.user1.id}/', {
            'role': 'ADMIN_NATIONAL'
        })
        # This SHOULD NOT change the role
        self.user1.refresh_from_db()
        self.assertNotEqual(self.user1.role, 'ADMIN_NATIONAL')
