from rest_framework import serializers
from .models import (
    User, Subject, Question, Exam, ExamQuestion,
    ExamAttempt, StudentAnswer, Result, ExamAnalytics
)


# User Serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role']

    def validate_role(self, value):
        request = self.context.get('request')

        # Public registration can only create students.
        if not request or not request.user.is_authenticated:
            return 'student'

        # Non-admin users cannot create privileged roles.
        if request.user.role != 'admin' and value in ['teacher', 'admin']:
            raise serializers.ValidationError('Only admin can create teacher or admin users.')

        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


# Subject Serializers
class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# Question Serializers
class QuestionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'subject', 'subject_name', 'question_text', 'question_type',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'difficulty_level', 'topic_tag',
            'created_by', 'created_by_username', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else "System"


class QuestionBankFilterSerializer(serializers.Serializer):
    subject_id = serializers.UUIDField(required=False)
    difficulty_level = serializers.CharField(required=False)
    topic_tag = serializers.CharField(required=False)
    question_type = serializers.CharField(required=False)


# Exam Serializers
class ExamQuestionSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question = QuestionSerializer(read_only=True)
    
    class Meta:
        model = ExamQuestion
        fields = [
            'id', 'exam', 'question', 'question_text', 'question_order',
            'shuffled_option_a', 'shuffled_option_b',
            'shuffled_option_c', 'shuffled_option_d', 'shuffled_answer'
        ]
        read_only_fields = ['id', 'shuffled_answer']


class ExamSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_questions = ExamQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'subject', 'subject_name', 'description',
            'duration_minutes', 'total_questions', 'marks_per_question',
            'negative_mark', 'pass_mark', 'start_time', 'end_time',
            'result_mode', 'selection_mode', 'auto_easy', 'auto_medium', 'auto_hard',
            'created_by', 'created_by_username', 'is_published',
            'exam_questions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else "System"


class ExamListSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'subject', 'subject_name', 'description',
            'duration_minutes', 'total_questions', 'marks_per_question',
            'pass_mark', 'start_time', 'end_time', 'is_published', 'created_by_username'
        ]

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else "System"


class ExamCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = [
            'title', 'subject', 'description', 'duration_minutes', 'total_questions',
            'marks_per_question', 'negative_mark', 'pass_mark', 'start_time', 'end_time',
            'result_mode', 'selection_mode', 'auto_easy', 'auto_medium', 'auto_hard', 'is_published'
        ]


# Exam Attempt Serializers
class StudentAnswerSerializer(serializers.ModelSerializer):
    exam_question = ExamQuestionSerializer(read_only=True)
    
    class Meta:
        model = StudentAnswer
        fields = [
            'id', 'attempt', 'exam_question', 'answer',
            'is_marked_for_review', 'visited', 'answered_at'
        ]
        read_only_fields = ['id', 'answered_at']


class ExamAttemptSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    answers = StudentAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'exam_title', 'student', 'student_username',
            'status', 'started_at', 'submitted_at', 'last_question_visited', 'answers'
        ]
        read_only_fields = ['id', 'started_at', 'student']


# Result Serializers
class ResultSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='attempt.student.username', read_only=True)
    exam_title = serializers.CharField(source='attempt.exam.title', read_only=True)
    attempt_id = serializers.CharField(source='attempt.id', read_only=True)
    exam_id = serializers.CharField(source='attempt.exam.id', read_only=True)
    
    class Meta:
        model = Result
        fields = [
            'id', 'attempt_id', 'exam_id', 'exam_title', 'student_username',
            'total_correct', 'total_wrong', 'total_skipped',
            'score_obtained', 'max_score', 'percentage', 'is_pass',
            'status', 'published_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ResultListSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='attempt.student.username', read_only=True)
    exam_title = serializers.CharField(source='attempt.exam.title', read_only=True)
    exam_id = serializers.CharField(source='attempt.exam.id', read_only=True)
    
    class Meta:
        model = Result
        fields = [
            'id', 'exam_id', 'exam_title', 'student_username',
            'score_obtained', 'max_score', 'percentage', 'is_pass',
            'status', 'created_at'
        ]


# Analytics Serializers
class ExamAnalyticsSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    
    class Meta:
        model = ExamAnalytics
        fields = [
            'id', 'exam', 'exam_title', 'total_attempts', 'total_submitted',
            'average_score', 'highest_score', 'lowest_score',
            'pass_count', 'pass_rate', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']
