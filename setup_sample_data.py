#!/usr/bin/env python
import os
import sys
import django

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
print("CURRENT DATABASE STATUS")
print("=" * 60)

# Check existing exams
exams = Exam.objects.all()
print(f"\n✓ Total exams in database: {exams.count()}")
for exam in exams:
    print(f"  - {exam.title} ({exam.duration} mins, {exam.total_marks} marks)")

# Check questions
questions = Question.objects.all()
print(f"\n✓ Total questions in database: {questions.count()}")

# Check subjects
subjects = Subject.objects.all()
print(f"\n✓ Total subjects: {subjects.count()}")
for subject in subjects:
    print(f"  - {subject.name}")

# If no exams, create sample data
if exams.count() == 0:
    print("\n" + "=" * 60)
    print("CREATING SAMPLE DATA...")
    print("=" * 60)
    
    # Create subjects if they don't exist
    math_subject, _ = Subject.objects.get_or_create(
        name="Mathematics",
        defaults={"description": "Mathematics and Numerical Analysis"}
    )
    
    science_subject, _ = Subject.objects.get_or_create(
        name="Science",
        defaults={"description": "General Science including Physics, Chemistry, Biology"}
    )
    
    english_subject, _ = Subject.objects.get_or_create(
        name="English",
        defaults={"description": "English Language and Literature"}
    )
    
    print(f"\n✓ Created/Found {Subject.objects.count()} subjects")
    
    # Create sample questions for each subject
    questions_data = [
        {
            "subject": math_subject,
            "text": "What is 2 + 2?",
            "option_a": "3",
            "option_b": "4",
            "option_c": "5",
            "option_d": "6",
            "correct_option": "B",
            "difficulty": "EASY",
            "topic_tag": "Arithmetic"
        },
        {
            "subject": math_subject,
            "text": "What is the square root of 144?",
            "option_a": "10",
            "option_b": "11",
            "option_c": "12",
            "option_d": "13",
            "correct_option": "C",
            "difficulty": "EASY",
            "topic_tag": "Square Roots"
        },
        {
            "subject": math_subject,
            "text": "What is 15% of 200?",
            "option_a": "20",
            "option_b": "25",
            "option_c": "30",
            "option_d": "35",
            "correct_option": "C",
            "difficulty": "EASY",
            "topic_tag": "Percentages"
        },
        {
            "subject": science_subject,
            "text": "What is the chemical symbol for Gold?",
            "option_a": "Go",
            "option_b": "Gd",
            "option_c": "Au",
            "option_d": "Ag",
            "correct_option": "C",
            "difficulty": "MEDIUM",
            "topic_tag": "Chemistry"
        },
        {
            "subject": science_subject,
            "text": "What is the speed of light?",
            "option_a": "300,000 km/s",
            "option_b": "150,000 km/s",
            "option_c": "450,000 km/s",
            "option_d": "600,000 km/s",
            "correct_option": "A",
            "difficulty": "MEDIUM",
            "topic_tag": "Physics"
        },
        {
            "subject": science_subject,
            "text": "What is the process by which plants make food?",
            "option_a": "Respiration",
            "option_b": "Photosynthesis",
            "option_c": "Fermentation",
            "option_d": "Digestion",
            "correct_option": "B",
            "difficulty": "EASY",
            "topic_tag": "Biology"
        },
        {
            "subject": english_subject,
            "text": "What is the past tense of 'run'?",
            "option_a": "Ran",
            "option_b": "Runned",
            "option_c": "Running",
            "option_d": "Runs",
            "correct_option": "A",
            "difficulty": "EASY",
            "topic_tag": "Grammar"
        },
        {
            "subject": english_subject,
            "text": "Which of these is a metaphor?",
            "option_a": "The sun is like a ball",
            "option_b": "The sun is a golden ball",
            "option_c": "The sun is bright",
            "option_d": "The sun is very hot",
            "correct_option": "B",
            "difficulty": "MEDIUM",
            "topic_tag": "Literature"
        },
    ]
    
    created_questions = []
    for q_data in questions_data:
        question, created = Question.objects.get_or_create(
            text=q_data["text"],
            defaults={k: v for k, v in q_data.items() if k != "text"}
        )
        if created:
            created_questions.append(question)
    
    print(f"✓ Created {len(created_questions)} sample questions")
    
    # Get teacher user
    try:
        teacher = User.objects.get(username='admin')
    except User.DoesNotExist:
        print("ERROR: Teacher user 'admin' not found!")
        import sys
        sys.exit(1)
    
    # Create sample exams
    exam1, created1 = Exam.objects.get_or_create(
        title="Math Quiz 2026",
        defaults={
            "description": "Basic Mathematics Quiz covering arithmetic, percentages, and roots",
            "created_by": teacher,
            "duration": 15,
            "total_marks": 30,
            "pass_marks": 15,
            "is_published": True
        }
    )
    
    exam2, created2 = Exam.objects.get_or_create(
        title="Science Final Exam",
        defaults={
            "description": "General Science exam covering Physics, Chemistry, and Biology",
            "created_by": teacher,
            "duration": 30,
            "total_marks": 50,
            "pass_marks": 25,
            "is_published": True
        }
    )
    
    exam3, created3 = Exam.objects.get_or_create(
        title="English Language Test",
        defaults={
            "description": "Grammar and Literature test",
            "created_by": teacher,
            "duration": 20,
            "total_marks": 40,
            "pass_marks": 20,
            "is_published": True
        }
    )
    
    print(f"✓ Created sample exams")
    
    # Add questions to exams
    if created1:
        # Math exam - add math questions
        math_questions = Question.objects.filter(subject=math_subject)
        for q in math_questions[:3]:
            ExamQuestion.objects.get_or_create(
                exam=exam1,
                question=q,
                defaults={"marks": 10}
            )
        print(f"  - Added {min(3, math_questions.count())} questions to Math Quiz")
    
    if created2:
        # Science exam - add science questions
        science_questions = Question.objects.filter(subject=science_subject)
        for q in science_questions[:3]:
            ExamQuestion.objects.get_or_create(
                exam=exam2,
                question=q,
                defaults={"marks": 10}
            )
        print(f"  - Added {min(3, science_questions.count())} questions to Science Exam")
    
    if created3:
        # English exam - add english questions
        english_questions = Question.objects.filter(subject=english_subject)
        for q in english_questions[:2]:
            ExamQuestion.objects.get_or_create(
                exam=exam3,
                question=q,
                defaults={"marks": 10}
            )
        print(f"  - Added {min(2, english_questions.count())} questions to English Test")

# Final status
print("\n" + "=" * 60)
print("FINAL STATUS")
print("=" * 60)
exams = Exam.objects.all()
print(f"\n✅ Total exams available: {exams.count()}")
for exam in exams:
    exam_questions = ExamQuestion.objects.filter(exam=exam).count()
    print(f"   - {exam.title}")
    print(f"     Duration: {exam.duration} mins | Marks: {exam.total_marks} | Questions: {exam_questions}")

print(f"\n✅ Total questions in database: {Question.objects.count()}")
print(f"✅ System is ready for testing!\n")
