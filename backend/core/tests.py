from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Subject, Exam, ExamAttempt, Result


class ResultVisibilityAndRolePermissionTests(APITestCase):
	def setUp(self):
		user_model = get_user_model()

		self.admin = user_model.objects.create_user(
			username='admin_user',
			password='pass1234',
			role='admin',
		)
		self.teacher = user_model.objects.create_user(
			username='teacher_user',
			password='pass1234',
			role='teacher',
		)
		self.student_one = user_model.objects.create_user(
			username='student_one',
			password='pass1234',
			role='student',
		)
		self.student_two = user_model.objects.create_user(
			username='student_two',
			password='pass1234',
			role='student',
		)

		self.subject = Subject.objects.create(name='Mathematics')
		now = timezone.now()

		self.exam = Exam.objects.create(
			title='Algebra Midterm',
			subject=self.subject,
			duration_minutes=30,
			total_questions=10,
			marks_per_question=1,
			negative_mark=0,
			pass_mark=40,
			start_time=now,
			end_time=now + timezone.timedelta(hours=2),
			result_mode='review',
			selection_mode='manual',
			created_by=self.teacher,
			is_published=True,
		)

		self.attempt_one = ExamAttempt.objects.create(
			exam=self.exam,
			student=self.student_one,
			status='graded',
		)
		self.result_draft = Result.objects.create(
			attempt=self.attempt_one,
			total_correct=6,
			total_wrong=2,
			total_skipped=2,
			score_obtained=6,
			max_score=10,
			percentage=60,
			is_pass=True,
			status='draft',
		)

		self.attempt_two = ExamAttempt.objects.create(
			exam=self.exam,
			student=self.student_two,
			status='graded',
		)
		self.result_published = Result.objects.create(
			attempt=self.attempt_two,
			total_correct=4,
			total_wrong=4,
			total_skipped=2,
			score_obtained=4,
			max_score=10,
			percentage=40,
			is_pass=True,
			status='published',
		)

	def _auth(self, user):
		self.client.force_authenticate(user=user)

	def test_student_cannot_list_all_results(self):
		self._auth(self.student_one)

		response = self.client.get('/api/v1/results/')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_admin_can_list_results(self):
		self._auth(self.admin)

		response = self.client.get('/api/v1/results/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		results = response.data.get('results', response.data)
		self.assertEqual(len(results), 2)

	def test_teacher_can_list_results(self):
		self._auth(self.teacher)

		response = self.client.get('/api/v1/results/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		results = response.data.get('results', response.data)
		self.assertEqual(len(results), 2)

	def test_student_cannot_view_draft_result_even_if_own_attempt(self):
		self._auth(self.student_one)

		response = self.client.get(
			'/api/v1/results/by_attempt/',
			{'attempt_id': str(self.attempt_one.id)},
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertIn('under review', str(response.data).lower())

	def test_student_cannot_view_other_students_result(self):
		self._auth(self.student_one)

		response = self.client.get(
			'/api/v1/results/by_attempt/',
			{'attempt_id': str(self.attempt_two.id)},
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_student_can_view_own_published_result(self):
		self.result_draft.status = 'published'
		self.result_draft.save(update_fields=['status'])
		self._auth(self.student_one)

		response = self.client.get(
			'/api/v1/results/by_attempt/',
			{'attempt_id': str(self.attempt_one.id)},
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['attempt_id'], str(self.attempt_one.id))

	def test_teacher_can_publish_draft_result(self):
		self._auth(self.teacher)

		response = self.client.post(f'/api/v1/results/{self.result_draft.id}/publish_result/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.result_draft.refresh_from_db()
		self.assertEqual(self.result_draft.status, 'published')

	def test_student_cannot_publish_result(self):
		self._auth(self.student_one)

		response = self.client.post(f'/api/v1/results/{self.result_draft.id}/publish_result/')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
