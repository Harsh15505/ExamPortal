#!/usr/bin/env python
import os
import sys
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, r'd:\Exam System\backend')
os.chdir(r'd:\Exam System\backend')
django.setup()

from core.models import User, Exam, ExamAttempt, StudentAnswer, Result
from core.views import evaluate_exam

print("=" * 60)
print("GENERATING SAMPLE STUDENT ATTEMPTS & RESULTS")
print("=" * 60)

# 1. Ensure a student exists
student, _ = User.objects.get_or_create(
    username='demo_student',
    defaults={'email': 'student@example.com', 'first_name': 'Demo', 'last_name': 'Student', 'role': 'student'}
)
if not student.check_password('studentpassword'):
    student.set_password('studentpassword')
    student.save()
print(f"[OK] Found/Created student: {student.username}")

# 2. Get all published exams
exams = Exam.objects.filter(is_published=True)
if not exams.exists():
    print("❌ No published exams found. Please run create_sample_exams.py first.")
    sys.exit(1)

# Clear existing attempts for clean graphs
ExamAttempt.objects.filter(student=student).delete()
print("[OK] Cleared existing attempts for clean slate")

# 3. Create historical attempts
now = timezone.now()
days_ago_list = [10, 7, 5, 2]  # Simulate exams taken over the last 10 days
score_trend = [
    [0.4, 0.7],  # 10 days ago: 40-70% accuracy
    [0.6, 0.8],  # 7 days ago: 60-80% accuracy
    [0.7, 0.9],  # 5 days ago: 70-90% accuracy
    [0.8, 1.0],  # 2 days ago: 80-100% accuracy 
]

created_count = 0

for i, exam in enumerate(exams):
    if i >= len(days_ago_list):
        break
        
    hist_date = now - timedelta(days=days_ago_list[i])
    accuracy_range = score_trend[i]
    
    # Create Attempt
    attempt = ExamAttempt.objects.create(
        exam=exam,
        student=student,
        status='in_progress',
        started_at=hist_date
    )
    
    # Answer questions based on targeted accuracy
    target_accuracy = random.uniform(accuracy_range[0], accuracy_range[1])
    qs = exam.exam_questions.all()
    
    for eq in qs:
        # 1. Create StudentAnswer
        ans = StudentAnswer.objects.create(attempt=attempt, exam_question=eq)
        
        # 2. Decide if they get it right
        if random.random() <= target_accuracy:
            correct_val = eq.shuffled_answer or eq.question.correct_answer
            ans.answer = correct_val
        else:
            options = ['A', 'B', 'C', 'D']
            correct_val = eq.shuffled_answer or eq.question.correct_answer
            options.remove(correct_val)
            ans.answer = random.choice(options)
            
        ans.visited = True
        ans.save()
    
    # Manually submit at the historical date
    attempt.status = 'submitted'
    attempt.submitted_at = hist_date + timedelta(minutes=random.randint(5, exam.duration_minutes))
    # We must save here before using update() to bypass auto_now
    attempt.save()
    ExamAttempt.objects.filter(id=attempt.id).update(started_at=hist_date, submitted_at=attempt.submitted_at)
    
    # Evaluate
    result = evaluate_exam(str(attempt.id))
    if result:
        # Override result creation time for chart sorting
        Result.objects.filter(id=result.id).update(created_at=attempt.submitted_at)
        print(f"  → Set score for '{exam.title}' on {attempt.submitted_at.strftime('%Y-%m-%d')} ({result.percentage}%)")
        created_count += 1

print("\n" + "=" * 60)
print(f"[OK] Generated {created_count} historical attempts for student '{student.username}'")
print("[OK] The Analytics graphs will now have beautiful data!")
print("=" * 60)
