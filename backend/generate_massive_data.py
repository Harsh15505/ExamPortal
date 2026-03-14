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

from core.models import User, Subject, Question, Exam, ExamQuestion, ExamAttempt, StudentAnswer, Result
from core.views import evaluate_exam

print("=" * 60)
print("GENERATING MASSIVE SAMPLE DATA (STUDENTS, EXAMS, RESULTS)")
print("=" * 60)

# Clear old sample data to ensure clean slate for mass gen
print("\n[.] Cleaning previous generations to avoid duplicates...")
ExamAttempt.objects.all().delete()
Exam.objects.all().delete()
Question.objects.all().delete()

# 1. Generate Teachers
print("\n[.] Generating Teachers...")
teachers = []
for i in range(1, 3):
    t, _ = User.objects.get_or_create(
        username=f'teacher_{i}',
        defaults={'email': f'teacher{i}@example.com', 'first_name': 'Prof', 'last_name': f'Smith {i}', 'role': 'teacher'}
    )
    t.set_password('teacherpassword')
    t.save()
    teachers.append(t)
    print(f"  [OK] Created teacher: {t.username}")

# 2. Generate Students
print("\n[.] Generating Students...")
students = []
for i in range(1, 13):
    s, _ = User.objects.get_or_create(
        username=f'student_{i}',
        defaults={'email': f'student{i}@example.com', 'first_name': 'Student', 'last_name': f'Number {i}', 'role': 'student'}
    )
    s.set_password('studentpassword')
    s.save()
    students.append(s)
print(f"  [OK] Generated {len(students)} students")

# 3. Get/Create Subjects
subjects = {
    'Math': Subject.objects.get_or_create(name='Mathematics')[0],
    'Science': Subject.objects.get_or_create(name='Science')[0],
    'English': Subject.objects.get_or_create(name='English')[0]
}

# 4. Generate ~50 Questions per Subject
print("\n[.] Generating ~150 Questions...")
difficulty_choices = ['easy', 'easy', 'medium', 'medium', 'medium', 'hard']
tags = {
    'Math': ['Algebra', 'Geometry', 'Calculus', 'Arithmetic', 'Statistics'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Geology'],
    'English': ['Grammar', 'Literature', 'Vocabulary', 'Comprehension', 'Poetry']
}

all_questions = {'Math': [], 'Science': [], 'English': []}

for subj_name, subject in subjects.items():
    for i in range(1, 51):
        q = Question.objects.create(
            subject=subject,
            question_text=f"Sample {subj_name} Question #{i} - What is the correct answer to this problem?",
            option_a=f"Option A for Q{i}",
            option_b=f"Option B for Q{i}",
            option_c=f"Option C for Q{i}",
            option_d=f"Option D for Q{i}",
            correct_answer=random.choice(['A', 'B', 'C', 'D']),
            difficulty_level=random.choice(difficulty_choices),
            topic_tag=random.choice(tags[subj_name]),
            created_by=teachers[0]
        )
        all_questions[subj_name].append(q)
print(f"  [OK] Generated 50 questions for each subject.")

# 5. Generate Historical Exams
print("\n[.] Generating Historical Exams...")
now = timezone.now()
historical_dates = [
    now - timedelta(days=30),
    now - timedelta(days=24),
    now - timedelta(days=18),
    now - timedelta(days=12),
    now - timedelta(days=6),
    now - timedelta(days=1)
]

exams = []
titles = ["Midterm Assessment Phase 1", "Diagnostic Test", "General Science Review", "Advanced Math Basics", "Literature and Grammar", "Final Mock Exam"]
subjs = ['Math', 'English', 'Science', 'Math', 'English', 'Science']

for i in range(6):
    e = Exam.objects.create(
        title=titles[i],
        subject=subjects[subjs[i]],
        description="A major examination to assess student performance across various topics.",
        duration_minutes=random.choice([30, 45, 60]),
        total_questions=15,
        marks_per_question=2,
        pass_mark=40,
        start_time=historical_dates[i] - timedelta(hours=2),
        end_time=historical_dates[i] + timedelta(days=7),
        created_by=random.choice(teachers),
        is_published=True
    )
    
    # Assign 15 random questions from the designated subject pool
    pool = list(all_questions[subjs[i]])
    random.shuffle(pool)
    for q_idx, q in enumerate(pool[:15]):
        ExamQuestion.objects.create(
            exam=e,
            question=q,
            question_order=q_idx+1,
            shuffled_answer=q.correct_answer # simplify for generation
        )
    exams.append((e, historical_dates[i]))
print(f"  [OK] Generated {len(exams)} exams with 15 questions each.")

# 6. Simulate Student Attempts
print("\n[.] Generating Student Attempts (This might take a second)...")
attempt_count = 0

for student in students:
    # Each student has an inherent "skill level" making the data realistic
    student_skill = random.uniform(0.4, 0.95) 
    
    for (exam, target_date) in exams:
        # Not every student takes every exam (90% attendance)
        if random.random() > 0.9:
            continue
            
        atmpt = ExamAttempt.objects.create(
            exam=exam,
            student=student,
            status='in_progress',
            started_at=target_date
        )
        
        # Variance based on exam difficulty relative to student skill
        exam_perf = student_skill + random.uniform(-0.15, 0.15)
        exam_perf = max(0.1, min(1.0, exam_perf))
        
        for eq in exam.exam_questions.all():
            ans = StudentAnswer.objects.create(attempt=atmpt, exam_question=eq)
            if random.random() <= exam_perf:
                ans.answer = eq.shuffled_answer
            else:
                options = ['A', 'B', 'C', 'D']
                options.remove(eq.shuffled_answer)
                ans.answer = random.choice(options)
            ans.visited = True
            ans.save()
            
        atmpt.status = 'submitted'
        atmpt.submitted_at = target_date + timedelta(minutes=random.randint(10, exam.duration_minutes))
        atmpt.save()
        ExamAttempt.objects.filter(id=atmpt.id).update(started_at=target_date, submitted_at=atmpt.submitted_at)
        
        res = evaluate_exam(str(atmpt.id))
        if res:
            Result.objects.filter(id=res.id).update(created_at=atmpt.submitted_at)
            attempt_count += 1

print("\n" + "=" * 60)
print(f"✅ MASSIVE DATA GENERATION COMPLETE!")
print(f"  - 12 Students, 2 Teachers")
print(f"  - 150 Questions across 3 Subjects")
print(f"  - 6 Historical Exams")
print(f"  - {attempt_count} Graded Exam Attempts Distributed over 30 days")
print("=" * 60)
