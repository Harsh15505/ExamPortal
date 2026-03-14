from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Avg, Max, Min, Count, F, Q
from .models import (
    User, Subject, Question, Exam, ExamQuestion,
    ExamAttempt, StudentAnswer, Result, ExamAnalytics
)
from .serializers import (
    UserSerializer, UserCreateSerializer, SubjectSerializer,
    QuestionSerializer, ExamSerializer, ExamListSerializer, ExamCreateUpdateSerializer,
    ExamAttemptSerializer, StudentAnswerSerializer,
    ResultSerializer, ResultListSerializer, ExamAnalyticsSerializer
)


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'student')


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsAdminOrTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['admin', 'teacher'])


# User ViewSet
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        if self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy', 'by_role']:
            return [permissions.IsAuthenticated(), IsAdmin()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_role(self, request):
        """Get users by role"""
        role = request.query_params.get('role')
        if not role:
            return Response({'error': 'role parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(role=role)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


# Subject ViewSet
class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdmin()]


# Question ViewSet
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['subject', 'difficulty_level', 'topic_tag', 'question_type']
    search_fields = ['question_text', 'topic_tag']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'by_subject']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdminOrTeacher()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_subject(self, request):
        """Get questions by subject with optional difficulty filter"""
        subject_id = request.query_params.get('subject_id')
        difficulty = request.query_params.get('difficulty')
        
        questions = Question.objects.filter(subject_id=subject_id)
        if difficulty:
            questions = questions.filter(difficulty_level=difficulty)
        
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)


# Exam ViewSet
class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['subject', 'is_published', 'result_mode']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'start_time']

    def get_permissions(self):
        if self.action == 'available':
            return [permissions.IsAuthenticated(), IsStudent()]
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAdminOrTeacher()]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ExamCreateUpdateSerializer
        if self.action == 'list' or self.action == 'available':
            return ExamListSerializer
        return ExamSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_questions(self, request, pk=None):
        """
        Add questions to exam.
        Body: {
            "question_ids": ["uuid1", "uuid2", ...],
            "randomize": true/false
        }
        """
        exam = self.get_object()
        question_ids = request.data.get('question_ids', [])
        randomize = request.data.get('randomize', False)
        
        if not question_ids:
            return Response({'error': 'question_ids required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Clear existing questions
        exam.exam_questions.all().delete()
        
        # Add new questions
        for idx, q_id in enumerate(question_ids):
            try:
                question = Question.objects.get(id=q_id)
                ExamQuestion.objects.create(
                    exam=exam,
                    question=question,
                    question_order=idx + 1
                )
            except Question.DoesNotExist:
                continue
        
        return Response({'status': 'questions added'})
    
    @action(detail=True, methods=['post'])
    def auto_select_questions(self, request, pk=None):
        """
        Auto-select questions by difficulty.
        Exam must have auto_easy, auto_medium, auto_hard set.
        """
        exam = self.get_object()
        
        if exam.selection_mode != 'auto':
            return Response(
                {'error': 'Exam not in auto mode'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        easy_qs = list(
            Question.objects.filter(
                subject=exam.subject,
                difficulty_level='easy'
            ).values_list('id', flat=True)[:exam.auto_easy]
        )
        
        medium_qs = list(
            Question.objects.filter(
                subject=exam.subject,
                difficulty_level='medium'
            ).values_list('id', flat=True)[:exam.auto_medium]
        )
        
        hard_qs = list(
            Question.objects.filter(
                subject=exam.subject,
                difficulty_level='hard'
            ).values_list('id', flat=True)[:exam.auto_hard]
        )
        
        all_qs = easy_qs + medium_qs + hard_qs
        
        # Call add_questions with randomize
        request.data['question_ids'] = all_qs
        request.data['randomize'] = True
        return self.add_questions(request, pk=pk)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get exams available for student — only current/upcoming, not expired"""
        now = timezone.now()
        exams = Exam.objects.filter(
            is_published=True,
            end_time__gt=now
        ).order_by('start_time')
        serializer = ExamSerializer(exams, many=True)
        return Response(serializer.data)


# Exam Attempt ViewSet
class ExamAttemptViewSet(viewsets.ModelViewSet):
    queryset = ExamAttempt.objects.all()
    serializer_class = ExamAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['exam', 'student', 'status']

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsStudent()]

    def get_queryset(self):
        return ExamAttempt.objects.filter(student=self.request.user)
    
    @action(detail=False, methods=['post'])
    def start_exam(self, request):
        """Start a new exam attempt"""
        exam_id = request.data.get('exam_id')
        
        if not exam_id:
            return Response(
                {'error': 'exam_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'error': 'Exam not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if student already has an attempt
        existing = ExamAttempt.objects.filter(
            exam=exam,
            student=request.user,
            status__in=['in_progress', 'submitted']
        ).first()
        
        if existing:
            return Response(
                {'error': 'You already have an active attempt'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create new attempt
        attempt = ExamAttempt.objects.create(
            exam=exam,
            student=request.user
        )
        
        # Create student answers for each question
        for eq in exam.exam_questions.all():
            StudentAnswer.objects.create(
                attempt=attempt,
                exam_question=eq
            )
        
        serializer = ExamAttemptSerializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def submit_answer(self, request, pk=None):
        """Submit answer to a question"""
        attempt = self.get_object()
        
        exam_question_id = request.data.get('exam_question_id')
        answer = request.data.get('answer')
        
        if not exam_question_id:
            return Response(
                {'error': 'exam_question_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            exam_question = ExamQuestion.objects.get(id=exam_question_id)
            student_answer = StudentAnswer.objects.get(
                attempt=attempt,
                exam_question=exam_question
            )
            student_answer.answer = answer
            student_answer.visited = True
            student_answer.save()
            
            serializer = StudentAnswerSerializer(student_answer)
            return Response(serializer.data)
        except (ExamQuestion.DoesNotExist, StudentAnswer.DoesNotExist):
            return Response(
                {'error': 'Answer record not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def mark_for_review(self, request, pk=None):
        """Mark question for review"""
        attempt = self.get_object()
        exam_question_id = request.data.get('exam_question_id')
        
        if not exam_question_id:
            return Response(
                {'error': 'exam_question_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student_answer = StudentAnswer.objects.get(
                attempt=attempt,
                exam_question_id=exam_question_id
            )
            student_answer.is_marked_for_review = not student_answer.is_marked_for_review
            student_answer.save()
            
            serializer = StudentAnswerSerializer(student_answer)
            return Response(serializer.data)
        except StudentAnswer.DoesNotExist:
            return Response(
                {'error': 'Answer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def submit_exam(self, request, pk=None):
        """Submit exam and trigger evaluation"""
        attempt = self.get_object()
        
        if attempt.status != 'in_progress':
            return Response(
                {'error': 'Exam is already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as submitted
        attempt.status = 'submitted'
        attempt.submitted_at = timezone.now()
        attempt.save()
        
        # Evaluate exam synchronously
        evaluate_exam(str(attempt.id))
        
        serializer = ExamAttemptSerializer(attempt)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def clear_attempts(self, request):
        """Clear all attempts for current user (DEBUG only)"""
        deleted_count, _ = ExamAttempt.objects.filter(student=request.user).delete()
        return Response({
            'message': f'Cleared {deleted_count} attempt(s)',
            'deleted_count': deleted_count
        })


# Result ViewSet
class ResultViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'is_pass', 'attempt__exam']
    ordering_fields = ['created_at', 'percentage']

    def get_permissions(self):
        if self.action == 'publish_result':
            return [permissions.IsAuthenticated(), IsAdminOrTeacher()]
        if self.action == 'list':
            return [permissions.IsAuthenticated(), IsAdminOrTeacher()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return ResultListSerializer
        return ResultSerializer

    def get_queryset(self):
        if self.request.user.role in ['admin', 'teacher']:
            return Result.objects.all()
        return Result.objects.filter(attempt__student=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_attempt(self, request):
        """Get result by attempt ID"""
        attempt_id = request.query_params.get('attempt_id')
        if not attempt_id:
            return Response(
                {'error': 'attempt_id query parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = Result.objects.get(attempt_id=attempt_id)
            if request.user.role == 'student' and result.attempt.student_id != request.user.id:
                return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            if request.user.role == 'student' and result.status == 'draft':
                return Response({'error': 'Result under review by teacher'}, status=status.HTTP_403_FORBIDDEN)
            serializer = ResultSerializer(result)
            return Response(serializer.data)
        except Result.DoesNotExist:
            return Response(
                {'error': 'No result found for this attempt'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_results(self, request):
        """Get current user's results"""
        results = Result.objects.filter(attempt__student=request.user)
        serializer = ResultSerializer(results, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def publish_result(self, request, pk=None):
        """Teacher: Publish result (for review mode)"""
        result = self.get_object()
        result.status = 'published'
        result.published_at = timezone.now()
        result.save()
        
        serializer = ResultSerializer(result)
        return Response(serializer.data)


# Analytics ViewSet
class ExamAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExamAnalytics.objects.all()
    serializer_class = ExamAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdminOrTeacher()]
    
    @action(detail=False, methods=['get'])
    def by_exam(self, request):
        """Get analytics for a specific exam"""
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response(
                {'error': 'exam_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        attempts = ExamAttempt.objects.filter(exam=exam)
        results = Result.objects.filter(attempt__exam=exam)

        total_attempts = attempts.count()
        total_submitted = attempts.filter(status__in=['submitted', 'graded']).count()
        pass_count = results.filter(is_pass=True).count()

        aggregates = results.aggregate(
            avg_score=Avg('score_obtained'),
            max_score=Max('score_obtained'),
            min_score=Min('score_obtained'),
            result_count=Count('id')
        )

        average_score = float(aggregates['avg_score'] or 0)
        highest_score = float(aggregates['max_score'] or 0)
        lowest_score = float(aggregates['min_score'] or 0)
        result_count = int(aggregates['result_count'] or 0)
        pass_rate = (pass_count / result_count * 100) if result_count > 0 else 0

        analytics, _ = ExamAnalytics.objects.get_or_create(exam=exam)
        analytics.total_attempts = total_attempts
        analytics.total_submitted = total_submitted
        analytics.average_score = average_score
        analytics.highest_score = highest_score
        analytics.lowest_score = lowest_score
        analytics.pass_count = pass_count
        analytics.pass_rate = pass_rate
        analytics.save()
        
        serializer = ExamAnalyticsSerializer(analytics)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def score_distribution(self, request):
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response({'error': 'exam_id required'}, status=status.HTTP_400_BAD_REQUEST)

        scores = list(Result.objects.filter(attempt__exam_id=exam_id).values_list('percentage', flat=True))
        buckets = {
            '0-20': 0,
            '21-40': 0,
            '41-60': 0,
            '61-80': 0,
            '81-100': 0,
        }

        for score in scores:
            val = float(score or 0)
            if val <= 20:
                buckets['0-20'] += 1
            elif val <= 40:
                buckets['21-40'] += 1
            elif val <= 60:
                buckets['41-60'] += 1
            elif val <= 80:
                buckets['61-80'] += 1
            else:
                buckets['81-100'] += 1

        return Response({'distribution': buckets, 'total': len(scores)})

    @action(detail=False, methods=['get'])
    def topic_performance(self, request):
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response({'error': 'exam_id required'}, status=status.HTTP_400_BAD_REQUEST)

        # Efficient aggregation using Django ORM
        stats = StudentAnswer.objects.filter(
            attempt__exam_id=exam_id,
            attempt__status='graded'
        ).values(
            topic=F('exam_question__question__topic_tag')
        ).annotate(
            total=Count('id'),
            correct_count=Count('id', filter=Q(is_correct=True))
        )
        
        result = []
        for item in stats:
            topic = item['topic'] or 'General'
            total = item['total']
            correct = item['correct_count']
            pct = (correct / total * 100) if total > 0 else 0
            result.append({
                'topic': topic,
                'correct': correct,
                'total': total,
                'percentage': round(pct, 2)
            })

        result.sort(key=lambda x: x['percentage'], reverse=True)
        return Response({'topics': result})

    @action(detail=False, methods=['get'])
    def difficulty_performance(self, request):
        exam_id = request.query_params.get('exam_id')
        if not exam_id:
            return Response({'error': 'exam_id required'}, status=status.HTTP_400_BAD_REQUEST)

        stats = StudentAnswer.objects.filter(
            attempt__exam_id=exam_id,
            attempt__status='graded'
        ).values(
            difficulty=F('exam_question__question__difficulty_level')
        ).annotate(
            total=Count('id'),
            correct_count=Count('id', filter=Q(is_correct=True))
        )

        result = []
        # Maintain order: easy, medium, hard
        lookup = {s['difficulty']: s for s in stats}
        for key in ['easy', 'medium', 'hard']:
            item = lookup.get(key, {'total': 0, 'correct_count': 0})
            total = item['total']
            correct = item['correct_count']
            pct = (correct / total * 100) if total > 0 else 0
            result.append({
                'difficulty': key,
                'correct': correct,
                'total': total,
                'percentage': round(pct, 2)
            })

        return Response({'difficulty': result})


# Placeholder for async evaluation (will use Celery in production)
def evaluate_exam(attempt_id):
    """Evaluate exam and create result"""
    try:
        attempt = ExamAttempt.objects.get(id=attempt_id)
        answers = StudentAnswer.objects.filter(attempt=attempt)
        
        total_correct = 0
        total_wrong = 0
        total_skipped = 0
        
        for ans in answers:
            if not ans.answer:
                total_skipped += 1
            else:
                # Check against the shuffled answer if available, otherwise use correct_answer
                correct_ans = ans.exam_question.shuffled_answer or ans.exam_question.question.correct_answer
                if ans.answer == correct_ans:
                    total_correct += 1
                    ans.is_correct = True
                else:
                    total_wrong += 1
                    ans.is_correct = False
                ans.save()
        
        # Calculate score
        total_questions = answers.count()
        max_score = total_questions * attempt.exam.marks_per_question
        score = (total_correct * attempt.exam.marks_per_question) - (total_wrong * attempt.exam.negative_mark)
        percentage = (score / max_score * 100) if max_score > 0 else 0
        is_pass = percentage >= attempt.exam.pass_mark
        
        # Create result
        result = Result.objects.create(
            attempt=attempt,
            total_correct=total_correct,
            total_wrong=total_wrong,
            total_skipped=total_skipped,
            score_obtained=score,
            max_score=max_score,
            percentage=percentage,
            is_pass=is_pass,
            status='published' if attempt.exam.result_mode == 'immediate' else 'draft'
        )
        
        # Mark attempt as graded
        attempt.status = 'graded'
        attempt.save()
        
        return result
    except ExamAttempt.DoesNotExist:
        pass

