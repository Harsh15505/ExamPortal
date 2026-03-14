#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, r'd:\Exam System\backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
os.chdir(r'd:\Exam System\backend')
django.setup()

from core.models import Subject, Question, Exam, ExamQuestion
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 60)
print("FIXING EXAMS - ADDING QUESTIONS")
print("=" * 60)

# Get or create teacher
try:
    teacher = User.objects.get(username='admin')
    print(f"\n✓ Found teacher: {teacher.username}")
except:
    print("✗ Teacher user 'admin' not found!")
    sys.exit(1)

# Get all exams
exams = Exam.objects.all()
questions = Question.objects.all()

print(f"✓ Found {exams.count()} exams")
print(f"✓ Found {questions.count()} questions")

# For each exam without questions, add questions
for exam in exams:
    linked_count = ExamQuestion.objects.filter(exam=exam).count()
    if linked_count == 0 and questions.count() > 0:
        # Link up to total_questions 
        available_questions = questions[:exam.total_questions] if exam.total_questions else questions
        for idx, question in enumerate(available_questions):
            try:
                ExamQuestion.objects.get_or_create(
                    exam=exam,
                    question=question,
                    defaults={'question_order': idx + 1}
                )
            except Exception as e:
                print(f"    Error linking: {e}")
        
        linked_now = ExamQuestion.objects.filter(exam=exam).count()
        print(f"  - {exam.title}: Linked {linked_now} questions")

# Verify final state
print("\n" + "=" * 60)
print("FINAL STATE")
print("=" * 60)

for exam in Exam.objects.all():
    linked = ExamQuestion.objects.filter(exam=exam).count()
    print(f"✓ {exam.title}")
    print(f"  - Published: {'Yes' if exam.is_published else 'No'}")
    print(f"  - Duration: {exam.duration_minutes} mins")
    print(f"  - Questions: {linked} linked")
    print(f"  - Pass Mark: {exam.pass_mark}%\n")

print("✅ Database is ready!\n")
