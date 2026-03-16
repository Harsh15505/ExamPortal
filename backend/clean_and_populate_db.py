import os
import django
import random
from datetime import timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from core.models import Subject, Question, Exam, ExamQuestion, ExamAttempt, StudentAnswer, Result
from django.contrib.auth import get_user_model
User = get_user_model()

def clean_db():
    print("🧹 Cleaning database...")
    Result.objects.all().delete()
    StudentAnswer.objects.all().delete()
    ExamAttempt.objects.all().delete()
    ExamQuestion.objects.all().delete()
    Exam.objects.all().delete()
    Question.objects.all().delete()
    Subject.objects.all().delete()
    User.objects.all().delete()
    print("✅ Database cleaned.")

def create_users():
    print("👤 Creating users...")
    # Admin root
    User.objects.create_superuser(username='admin', email='admin@examportal.com', password='Admin@123')
    
    # 1 Demo Admin
    demo_admin = User.objects.create_user(
        username='demo_admin', email='demo_admin@examportal.com', password='Admin@123',
        role='admin', first_name='Admin', last_name='User'
    )
    
    # 4 Teachers
    teachers = []
    teacher_data = [
        ('teacher_math', 'Math', 'Isaac', 'Newton'),
        ('teacher_cs', 'CS', 'Ada', 'Lovelace'),
        ('teacher_science', 'Science', 'Marie', 'Curie'),
        ('teacher_eng', 'English', 'William', 'Shakespeare'),
    ]
    for username, sub, first, last in teacher_data:
        t = User.objects.create_user(
            username=username, email=f'{username}@examportal.com', password='Teacher@123',
            role='teacher', first_name=first, last_name=last
        )
        teachers.append(t)
        
    # 10 Students
    students = []
    for i in range(1, 11):
        username = f'student_{i:02d}'
        s = User.objects.create_user(
            username=username, email=f'{username}@student.com', password='Student@123',
            role='student', first_name='Student', last_name=f'{i:02d}'
        )
        students.append(s)
    
    print(f"✅ Created Users.")
    return demo_admin, teachers, students

def populate_data(demo_admin, teachers, students):
    print("📚 Populating subjects and questions...")
    
    # Mathematics
    math = Subject.objects.create(name='Mathematics', description="Advanced Mathematical Concepts")
    math_teacher = teachers[0]
    math_q_data = [
        ("What is 15 * 12?", "c", ["160", "170", "180", "190"], "easy", "Arithmetic"),
        ("What is the square root of 225?", "b", ["13", "15", "17", "20"], "easy", "Basic Math"),
        ("Solve for x: 2x + 7 = 15", "b", ["2", "4", "6", "8"], "easy", "Algebra"),
        ("What is the value of Sin(90)?", "a", ["1", "0", "0.5", "undefined"], "medium", "Trigonometry"),
        ("Who is the father of Geometry?", "b", ["Pythagoras", "Euclid", "Newton", "Leibniz"], "medium", "History"),
    ]
    math_qs = []
    for text, ans, opts, diff, tag in math_q_data:
        q = Question.objects.create(
            subject=math, question_text=text, question_type='mcq',
            option_a=opts[0], option_b=opts[1], option_c=opts[2], option_d=opts[3],
            correct_answer=ans, difficulty_level=diff, topic_tag=tag, created_by=math_teacher
        )
        math_qs.append(q)
        
    # Computer Science
    cs = Subject.objects.create(name='Computer Science', description="Modern Computing and Programming")
    cs_teacher = teachers[1]
    cs_q_data = [
        ("What does CPU stand for?", "a", ["Central Processing Unit", "Computer Power Utlity", "Central Processor Unit", "None"], "easy", "Hardware"),
        ("Which of these is a Python keyword?", "c", ["function", "method", "def", "create"], "easy", "Python"),
        ("What is the time complexity of Binary Search?", "b", ["O(n)", "O(log n)", "O(n^2)", "O(1)"], "medium", "Algorithms"),
        ("Which language is used for web styling?", "c", ["HTML", "JS", "CSS", "Python"], "easy", "Web"),
        ("What is 1011 in decimal?", "b", ["9", "11", "13", "15"], "medium", "Binary"),
    ]
    cs_qs = []
    for text, ans, opts, diff, tag in cs_q_data:
        q = Question.objects.create(
            subject=cs, question_text=text, question_type='mcq',
            option_a=opts[0], option_b=opts[1], option_c=opts[2], option_d=opts[3],
            correct_answer=ans, difficulty_level=diff, topic_tag=tag, created_by=cs_teacher
        )
        cs_qs.append(q)

    # Exams
    exam_data = [
        (math, math_qs, math_teacher, "Math Final Exam"),
        (cs, cs_qs, cs_teacher, "CS Fundamentals Certification")
    ]
    
    for sub, qs, teacher, title in exam_data:
        print(f"💠 Creating Exam: {title}")
        exam = Exam.objects.create(
            title=title, subject=sub, created_by=teacher,
            duration_minutes=30, total_questions=len(qs),
            marks_per_question=20.0, pass_mark=40.0,
            start_time=timezone.now() - timedelta(days=5),
            end_time=timezone.now() + timedelta(days=365),
            is_published=True
        )
        
        eq_instances = []
        for i, q in enumerate(qs):
            eq = ExamQuestion.objects.create(
                exam=exam, question=q, question_order=i+1,
                shuffled_option_a=q.option_a, shuffled_option_b=q.option_b, 
                shuffled_option_c=q.option_c, shuffled_option_d=q.option_d,
                shuffled_answer=q.correct_answer
            )
            eq_instances.append(eq)
            
        # Attempts and Results
        print(f"📝 Generating history for {title}...")
        for student in students[:8]:
            attempt = ExamAttempt.objects.create(
                exam=exam, student=student, status='graded',
                # started_at is auto_now_add, so we can only set it during create if we use a custom save or just let it be now
                submitted_at=timezone.now() - timedelta(days=1)
            )
            
            # Simulated answers
            score = 0
            for eq in eq_instances:
                is_correct = random.random() > 0.2
                ans = eq.shuffled_answer if is_correct else "x"
                StudentAnswer.objects.create(
                    attempt=attempt, exam_question=eq, answer=ans,
                    is_correct=is_correct, visited=True
                )
                if is_correct: score += 20
            
            attempt.score = score # Note: score exists on ExamAttempt? Let's check.
            # wait, I'll check if ExamAttempt has a score field.
            attempt.save()
            
            max_score = len(qs) * 20
            Result.objects.create(
                attempt=attempt,
                total_correct=score // 20,
                total_wrong=(max_score - score) // 20,
                score_obtained=score,
                max_score=max_score,
                percentage=(score / max_score) * 100,
                is_pass=(score >= exam.pass_mark),
                status='published',
                published_at=timezone.now()
            )

    print("✅ Data population complete.")

if __name__ == "__main__":
    try:
        clean_db()
        demo_admin, teachers, students = create_users()
        populate_data(demo_admin, teachers, students)
        print("\n🚀 SUCCESS! Database is clean and realistically populated.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\n❌ Error: {e}")
