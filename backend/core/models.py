from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

# Custom User Model
class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


# Subject Model
class Subject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subjects'
        ordering = ['name']
    
    def __str__(self):
        return self.name


# Question Bank Model
class Question(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    QUESTION_TYPE_CHOICES = [
        ('mcq', 'Multiple Choice Question'),
        ('true_false', 'True/False'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPE_CHOICES, default='mcq')
    
    # Options for MCQ
    option_a = models.CharField(max_length=500, blank=True, null=True)
    option_b = models.CharField(max_length=500, blank=True, null=True)
    option_c = models.CharField(max_length=500, blank=True, null=True)
    option_d = models.CharField(max_length=500, blank=True, null=True)
    
    # Correct answer: a, b, c, d for MCQ or true/false for T/F
    correct_answer = models.CharField(max_length=10)
    
    # Metadata
    difficulty_level = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    topic_tag = models.CharField(max_length=100, db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'questions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['subject', 'difficulty_level']),
            models.Index(fields=['topic_tag']),
        ]
    
    def __str__(self):
        return f"{self.question_text[:50]}... ({self.difficulty_level})"


# Exam Model
class Exam(models.Model):
    RESULT_MODE_CHOICES = [
        ('immediate', 'Immediate'),
        ('review', 'Review'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exams')
    description = models.TextField(blank=True, null=True)
    
    # Exam Configuration
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(480)])
    total_questions = models.IntegerField(validators=[MinValueValidator(1)])
    marks_per_question = models.FloatField(validators=[MinValueValidator(0.1)])
    negative_mark = models.FloatField(default=0, validators=[MinValueValidator(0)])
    pass_mark = models.FloatField(default=40, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Scheduling
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    # Result Mode: immediate or review
    result_mode = models.CharField(max_length=10, choices=RESULT_MODE_CHOICES, default='immediate')
    
    # Question Selection Mode
    selection_mode = models.CharField(
        max_length=10,
        choices=[('manual', 'Manual'), ('auto', 'Auto')],
        default='manual'
    )
    
    # Auto mode configuration (if selection_mode = auto)
    auto_easy = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    auto_medium = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    auto_hard = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_exams')
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exams'
        ordering = ['-created_at']
        unique_together = ['title', 'subject']
    
    def __str__(self):
        return self.title


# ExamQuestion Model (linking questions to exams with ordering and randomization)
class ExamQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='exam_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    # Order and randomization snapshot
    question_order = models.IntegerField()
    
    # Store shuffled options at exam creation time for consistency
    shuffled_option_a = models.CharField(max_length=500, blank=True, null=True)
    shuffled_option_b = models.CharField(max_length=500, blank=True, null=True)
    shuffled_option_c = models.CharField(max_length=500, blank=True, null=True)
    shuffled_option_d = models.CharField(max_length=500, blank=True, null=True)
    shuffled_answer = models.CharField(max_length=10, blank=True, null=True)
    
    class Meta:
        db_table = 'exam_questions'
        unique_together = ['exam', 'question']
        ordering = ['question_order']
    
    def __str__(self):
        return f"{self.exam.title} - Q{self.question_order}"


# Exam Attempt Model
class ExamAttempt(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_attempts')
    
    # Attempt lifecycle
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    # Session tracking
    last_question_visited = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'exam_attempts'
        unique_together = ['exam', 'student']
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.student.username} - {self.exam.title}"


# Student Answer Model
class StudentAnswer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='answers')
    exam_question = models.ForeignKey(ExamQuestion, on_delete=models.CASCADE)
    
    # Student's response
    answer = models.CharField(max_length=10, blank=True, null=True)
    is_correct = models.BooleanField(null=True, blank=True, db_index=True)
    is_marked_for_review = models.BooleanField(default=False)
    visited = models.BooleanField(default=False)
    
    # Metadata
    answered_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_answers'
        unique_together = ['attempt', 'exam_question']
    
    def __str__(self):
        return f"{self.attempt.student.username} - Q{self.exam_question.question_order}"


# Result Model
class Result(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.OneToOneField(ExamAttempt, on_delete=models.CASCADE, related_name='result')
    
    # Scores
    total_correct = models.IntegerField(default=0)
    total_wrong = models.IntegerField(default=0)
    total_skipped = models.IntegerField(default=0)
    score_obtained = models.FloatField(default=0)
    max_score = models.FloatField(default=0)
    percentage = models.FloatField(default=0)
    
    # Pass/Fail
    is_pass = models.BooleanField(default=False)
    
    # Review Status (for review mode exams)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'results'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.attempt.student.username} - {self.percentage}%"


# Analysis Dashboard Model (for caching stats)
class ExamAnalytics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.OneToOneField(Exam, on_delete=models.CASCADE, related_name='analytics')
    
    # Statistics
    total_attempts = models.IntegerField(default=0)
    total_submitted = models.IntegerField(default=0)
    average_score = models.FloatField(default=0)
    highest_score = models.FloatField(default=0)
    lowest_score = models.FloatField(default=0)
    pass_count = models.IntegerField(default=0)
    pass_rate = models.FloatField(default=0)  # Percentage
    
    # Last updated
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exam_analytics'
    
    def __str__(self):
        return f"Analytics - {self.exam.title}"
