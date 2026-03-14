#!/usr/bin/env python
import os
import sys
import django
import random
from datetime import timedelta
from django.utils import timezone

# Add backend to path
sys.path.insert(0, r'd:\Exam System\backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
os.chdir(r'd:\Exam System\backend')
django.setup()

from core.models import User, Subject, Question, Exam, ExamQuestion, ExamAttempt, StudentAnswer, Result
from django.contrib.auth import get_user_model

User = get_user_model()

def populate():
    print("Populating massive test data...")
    
    # 1. Create Teachers
    teachers = []
    for i in range(1, 3):
        username = f'teacher_{i}'
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@example.com',
                'role': 'teacher',
                'first_name': f'Teacher_{i}',
                'last_name': 'Surname'
            }
        )
        if created:
            user.set_password('Teacher@123')
            user.save()
        teachers.append(user)
    print(f"✓ Created/Found {len(teachers)} teachers")

    # 2. Create Students
    students = []
    for i in range(1, 13):
        username = f'student_{i}'
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f'{username}@example.com',
                'role': 'student',
                'first_name': f'Student_{i}',
                'last_name': 'Surname'
            }
        )
        if created:
            user.set_password('Student@123')
            user.save()
        students.append(user)
    print(f"✓ Created/Found {len(students)} students")

    # 3. Create Subjects
    subject_names = ["Python Programming", "Web Development", "Database Systems", "Machine Learning", "Cloud Computing"]
    subjects = []
    for name in subject_names:
        sub, _ = Subject.objects.get_or_create(name=name)
        subjects.append(sub)
    print(f"✓ Created/Found {len(subjects)} subjects")

    # 4. Create Questions (50 per subject)
    for sub in subjects:
        for i in range(1, 51):
            q_text = f"Question {i} for {sub.name}: What is the purpose of {random.choice(['X', 'Y', 'Z'])}?"
            Question.objects.get_or_create(
                text=q_text,
                subject=sub,
                defaults={
                    'option_a': f'Option A for {i}',
                    'option_b': f'Option B for {i}',
                    'option_c': f'Option C for {i}',
                    'option_d': f'Option D for {i}',
                    'correct_option': random.choice(['A', 'B', 'C', 'D']),
                    'difficulty': random.choice(['easy', 'medium', 'hard']),
                    'topic_tag': f'Topic_{random.randint(1, 5)}',
                    'created_by': random.choice(teachers)
                }
            )
    print(f"✓ Created hundreds of questions")

    # 5. Create Exams (5-6 historic tests)
    exams = []
    for i in range(1, 7):
        sub = random.choice(subjects)
        exam, created = Exam.objects.get_or_create(
            title=f"{sub.name} Final {2020 + i}",
            defaults={
                'description': f'Historical final exam for {sub.name}',
                'subject': sub,
                'created_by': random.choice(teachers),
                'duration': 60,
                'total_marks': 100,
                'pass_marks': 40,
                'is_published': True,
                'start_time': timezone.now() - timedelta(days=365 * (7-i)),
                'end_time': timezone.now() - timedelta(days=365 * (7-i) - 1)
            }
        )
        if created:
            # Add 10 questions to each exam (to keep it fast but representative)
            qs = Question.objects.filter(subject=sub).order_by('?')[:10]
            for idx, q in enumerate(qs):
                ExamQuestion.objects.create(
                    exam=exam,
                    question=q,
                    question_order=idx + 1,
                    marks=10
                )
        exams.append(exam)
    print(f"✓ Created {len(exams)} historical exams")

    # 6. Create Attempts & Results for Students
    for student in students:
        # Each student takes 3-4 random historical exams
        taken_exams = random.sample(exams, random.randint(3, 4))
        for exam in taken_exams:
            # Check if already attempted
            if ExamAttempt.objects.filter(student=student, exam=exam).exists():
                continue
                
            attempt = ExamAttempt.objects.create(
                student=student,
                exam=exam,
                status='graded',
                submitted_at=exam.end_time - timedelta(minutes=10)
            )
            
            # Create Answers
            exam_qs = ExamQuestion.objects.filter(exam=exam)
            correct_count = random.randint(3, 10)
            
            for idx, eq in enumerate(exam_qs):
                is_correct = idx < correct_count
                answer = eq.question.correct_option if is_correct else random.choice(['A', 'B', 'C', 'D'])
                StudentAnswer.objects.create(
                    attempt=attempt,
                    exam_question=eq,
                    answer=answer,
                    is_correct=is_correct,
                    visited=True
                )
            
            # Create Result
            score = correct_count * 10
            percentage = (score / 100) * 100
            Result.objects.create(
                attempt=attempt,
                total_correct=correct_count,
                total_wrong=10 - correct_count,
                total_skipped=0,
                score_obtained=score,
                max_score=100,
                percentage=percentage,
                is_pass=percentage >= exam.pass_marks,
                status='published'
            )
    print(f"✓ Generated results for all students")

if __name__ == "__main__":
    populate()
    print("Done!")
