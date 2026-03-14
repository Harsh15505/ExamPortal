
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from core.models import StudentAnswer

def backfill_is_correct():
    answers = StudentAnswer.objects.filter(attempt__status='graded', is_correct__isnull=True).select_related('exam_question', 'exam_question__question')
    updates = []
    count = 0
    for ans in answers:
        correct_ans = ans.exam_question.shuffled_answer or ans.exam_question.question.correct_answer
        ans.is_correct = (ans.answer == correct_ans) if ans.answer else False
        updates.append(ans)
        count += 1
        
        if len(updates) >= 500:
            StudentAnswer.objects.bulk_update(updates, ['is_correct'])
            updates = []
            
    if updates:
        StudentAnswer.objects.bulk_update(updates, ['is_correct'])
        
    print(f"Backfilled {count} answers efficiently.")

if __name__ == "__main__":
    backfill_is_correct()
