from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from complaints.models import Complaint

User = get_user_model()

class ComplaintSecurityTest(TestCase):
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
        self.complaint2 = Complaint.objects.create(
            title='Complaint by User 2',
            description='Private details',
            complainant=self.user2
        )

    def test_complaint_idor_vulnerability(self):
        """Test if user1 can access user2's complaint details"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/complaints/{self.complaint2.id}/')
        # This should be 404 as the complaint is not in the user's queryset
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, "IDOR Vulnerability: User 1 can access User 2's complaint")
