from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from complaints.models import Complaint, ComplaintStatus, Category
from establishments.models import Establishment, Region

User = get_user_model()

class ComplaintSecurityTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.region = Region.objects.create(name="Littoral")
        self.establishment = Establishment.objects.create(
            name="CNHU",
            region=self.region,
            type="CNHU"
        )

        self.user_usager = User.objects.create_user(
            email='usager@example.com',
            password='password123',
            first_name='Usager',
            last_name='One',
            role='USAGER'
        )
        self.user_hacker = User.objects.create_user(
            email='hacker@example.com',
            password='password123',
            first_name='Hacker',
            last_name='One',
            role='USAGER'
        )

        self.category = Category.objects.create(name="Qualité des soins")

        self.complaint = Complaint.objects.create(
            title="Ma plainte",
            description="Description",
            complainant=self.user_usager,
            category=self.category,
            establishment=self.establishment,
            status=ComplaintStatus.DEPOSEE
        )

    def test_idor_view_complaint_detail(self):
        """Test if a user can view another user's complaint detail"""
        self.client.force_authenticate(user=self.user_hacker)
        response = self.client.get(f'/api/complaints/{self.complaint.id}/')
        # Should be 404 or 403. If get_queryset is restricted, it will be 404.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthorized_resolve_complaint(self):
        """Test if a user can resolve another user's complaint"""
        self.client.force_authenticate(user=self.user_hacker)
        response = self.client.post(f'/api/complaints/{self.complaint.id}/resolve/', {
            'resolution_notes': 'Hacked',
            'corrective_actions': 'None'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.complaint.refresh_from_db()
        self.assertNotEqual(self.complaint.status, ComplaintStatus.RESOLUE)
