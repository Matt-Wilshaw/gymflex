from datetime import datetime, timedelta

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Session


class AuthAndSessionsApiTests(APITestCase):
	def setUp(self):
		self.trainer = User.objects.create_user(
			username="trainer",
			password="pw12345",
			is_staff=True,
		)
		self.user = User.objects.create_user(
			username="alice",
			password="pw12345",
		)

		future_dt = datetime.now() + timedelta(days=1)
		self.session = Session.objects.create(
			trainer=self.trainer,
			activity_type="yoga",
			date=future_dt.date(),
			time=future_dt.time().replace(second=0, microsecond=0),
			capacity=10,
			duration_minutes=60,
		)

	def authenticate_as_user(self):
		res = self.client.post(
			"/api/token/",
			{"username": "alice", "password": "pw12345"},
			format="json",
		)
		self.assertEqual(res.status_code, 200)
		self.assertIn("access", res.data)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

	def test_token_obtain_pair_returns_tokens(self):
		res = self.client.post(
			"/api/token/",
			{"username": "alice", "password": "pw12345"},
			format="json",
		)
		self.assertEqual(res.status_code, 200)
		self.assertIn("access", res.data)
		self.assertIn("refresh", res.data)

	def test_sessions_list_requires_auth(self):
		res = self.client.get("/api/sessions/")
		self.assertEqual(res.status_code, 401)

	def test_sessions_list_returns_200_when_authenticated(self):
		self.authenticate_as_user()
		res = self.client.get("/api/sessions/")
		self.assertEqual(res.status_code, 200)
		self.assertIsInstance(res.data, list)

	def test_book_endpoint_toggles_booking(self):
		self.authenticate_as_user()

		self.assertEqual(self.session.attendees.count(), 0)

		res1 = self.client.post(f"/api/sessions/{self.session.id}/book/")
		self.assertEqual(res1.status_code, 200)
		self.assertEqual(res1.data.get("status"), "Booked")
		self.session.refresh_from_db()
		self.assertEqual(self.session.attendees.count(), 1)

		res2 = self.client.post(f"/api/sessions/{self.session.id}/book/")
		self.assertEqual(res2.status_code, 200)
		self.assertEqual(res2.data.get("status"), "Unbooked")
		self.session.refresh_from_db()
		self.assertEqual(self.session.attendees.count(), 0)
