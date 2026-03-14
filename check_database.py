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
print("DATABASE STATUS CHECK")
print("=" * 60)

# Check existing exams
exams = Exam.objects.all()
print(f"\n✓ Total exams in database: {exams.count()}")
for exam in exams:
    try:
        questions = ExamQuestion.objects.filter(exam=exam).count()
        total_marks = exam.total_questions * exam.marks_per_question if exam.total_questions else 0
        print(f"  - {exam.title}")
        print(f"    Duration: {exam.duration_minutes} mins | Questions: {exam.total_questions} ({questions} linked)")
        print(f"    Total Marks: {total_marks:.0f} | Pass: {exam.pass_mark}%")
        print(f"    Published: {'✓ Yes' if exam.is_published else '✗ No'}")
    except Exception as e:
        print(f"  - {exam.title} (Error reading: {str(e)})")

# Check questions
questions = Question.objects.all()
print(f"\n✓ Total questions in database: {questions.count()}")

# Check subjects  
subjects = Subject.objects.all()
print(f"\n✓ Total subjects: {subjects.count()}")
for subject in subjects:
    qs = Question.objects.filter(subject=subject).count()
    print(f"  - {subject.name} ({qs} questions)")

print("\n" + "=" * 60)
print("SYSTEM STATUS")
print("=" * 60)
print(f"✅ Backend ready: {exams.count() > 0}")
print(f"✅ Questions available: {questions.count() > 0}")
print(f"✅ Database connection: OK\n")
