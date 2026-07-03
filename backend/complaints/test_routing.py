from django.test import TestCase

from accounts.models import User, UserRole
from complaints.models import Complaint
from complaints.routing import apply_complaint_routing
from establishments.models import Establishment, EstablishmentType, Region


class ComplaintRoutingTests(TestCase):
    def setUp(self):
        self.region = Region.objects.create(name='Littoral', code='LI')
        self.establishment = Establishment.objects.create(
            name='CHU Test',
            type=EstablishmentType.CHU,
            region=self.region,
        )
        self.pfe = User.objects.create_user(
            email='pfe@test.bj',
            password='TestPass123!',
            role=UserRole.PFE,
            establishment=self.establishment,
            first_name='PFE',
            last_name='Test',
        )

    def test_known_establishment_routes_to_pfe(self):
        complaint = Complaint.objects.create(
            title='Test',
            description='Desc',
            establishment=self.establishment,
        )
        route = apply_complaint_routing(complaint, skip_history=True)
        complaint.refresh_from_db()
        self.assertEqual(route, 'pfe')
        self.assertFalse(complaint.pending_call_center_completion)

    def test_manual_establishment_routes_to_call_center(self):
        complaint = Complaint.objects.create(
            title='Test',
            description='Desc',
            establishment_name_manual='Centre inconnu',
        )
        route = apply_complaint_routing(complaint, skip_history=True)
        complaint.refresh_from_db()
        self.assertEqual(route, 'call_center')
        self.assertTrue(complaint.pending_call_center_completion)
