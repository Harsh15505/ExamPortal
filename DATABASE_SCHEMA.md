# Database Schema - Online Examination System

## Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (UUID, PK)   │
│ username (STR)  │
│ email           │
│ password_hash   │
│ first_name      │
│ last_name       │
│ role (ENUM)     │ ◄──── Values: admin, teacher, student
│ is_active       │
│ created_at      │
│ updated_at      │
└─────────────────┘
        ▲
        │ (created_by)
        │
┌─────────────────────────────────────────────────────────────────────┐
│                       SUBJECTS                                       │
├─────────────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                       │
│ name (STR, UNIQUE)                                                  │
│ description (TEXT)                                                  │
│ created_at                                                          │
│ updated_at                                                          │
└─────────────────────────────────────────────────────────────────────┘
        ▲                                              ▲
        │ (subject_id)                                │ (subject_id)
        │                                              │
┌─────────────────────────────────────┐  ┌──────────────────────────┐
│        QUESTIONS                    │  │      EXAMS               │
├─────────────────────────────────────┤  ├──────────────────────────┤
│ id (UUID, PK)                       │  │ id (UUID, PK)            │
│ subject_id (FK)                     │  │ subject_id (FK)          │
│ question_text (TEXT)                │  │ title (STR)              │
│ question_type (ENUM)                │  │ description (TEXT)       │
│   - mcq                             │  │ duration_minutes (INT)   │
│   - true_false                      │  │ total_questions (INT)    │
│ option_a, option_b, ...             │  │ marks_per_question (FL)  │
│ option_d (STR, nullable for T/F)    │  │ negative_mark (FL)       │
│ correct_answer (STR)                │  │ pass_mark (FL)           │
│ difficulty_level (ENUM)             │  │ start_time (DATETIME)    │
│   - easy                            │  │ end_time (DATETIME)      │
│   - medium                          │  │ result_mode (ENUM)       │
│   - hard                            │  │   - immediate            │
│ topic_tag (STR, indexed)            │  │   - review               │
│ created_by (FK to Users)            │  │ selection_mode (ENUM)    │
│ created_at                          │  │   - manual               │
│ updated_at                          │  │   - auto                 │
│                                     │  │ auto_easy (INT)          │
│ [Index: subject + difficulty]       │  │ auto_medium (INT)        │
│ [Index: topic_tag]                  │  │ auto_hard (INT)          │
└─────────────────────────────────────┘  │ created_by (FK)          │
        ▲                                  │ is_published (BOOL)      │
        │                                  │ created_at               │
        │ (question_id)                    │ updated_at               │
        │                                  │                          │
        │                                  │ [Unique: title + sub]    │
        │                                  └──────────────────────────┘
        │                                              ▲
        │                                              │ (exam_id)
        │                                              │
        ├──────────────────┬───────────────────────────┤
        │                  │                           │
        │          ┌──────────────────────────────────────────┐
        │          │      EXAM_QUESTIONS                      │
        │          ├──────────────────────────────────────────┤
        │          │ id (UUID, PK)                            │
        │          │ exam_id (FK) ──────────┐                 │
        │          │ question_id (FK) ──────┘                 │
        │          │ question_order (INT)                     │
        │          │ shuffled_option_a (STR)                  │
        │          │ shuffled_option_b (STR)  [Options stored │
        │          │ shuffled_option_c (STR)   to preserve    │
        │          │ shuffled_option_d (STR)   order against  │
        │          │ shuffled_answer (STR)     bank changes]  │
        │          │                                          │
        │          │ [Unique: exam + question]                │
        │          │ [Ordered by: question_order]             │
        │          └──────────────────────────────────────────┘
        │                            ▲
        │                            │ (exam_question_id)
        │                            │
        └────────────────────────────┘

                   ┌──────────────────────────────────┐
                   │      EXAM_ATTEMPTS               │
                   ├──────────────────────────────────┤
                   │ id (UUID, PK)                    │
                   │ exam_id (FK)                     │
                   │ student_id (FK to Users)         │
                   │ status (ENUM)                    │
                   │   - in_progress                  │
                   │   - submitted                    │
                   │   - graded                       │
                   │ started_at (DATETIME)            │
                   │ submitted_at (DATETIME, null)    │
                   │ last_question_visited (INT)      │
                   │                                  │
                   │ [Unique: exam + student]         │
                   │ (One attempt per student/exam)   │
                   └──────────────────────────────────┘
                                   ▲
                                   │
                              (attempt_id)
                                   │
                   ┌───────────────┴──────────────────┐
                   │                                  │
        ┌──────────────────────────────┐  ┌──────────────────────────┐
        │      STUDENT_ANSWERS         │  │      RESULTS             │
        ├──────────────────────────────┤  ├──────────────────────────┤
        │ id (UUID, PK)                │  │ id (UUID, PK)            │
        │ attempt_id (FK)              │  │ attempt_id (FK, UNIQUE)  │
        │ exam_question_id (FK)        │  │ total_correct (INT)      │
        │ answer (STR, nullable)       │  │ total_wrong (INT)        │
        │ is_marked_for_review (BOOL)  │  │ total_skipped (INT)      │
        │ visited (BOOL)               │  │ score_obtained (FL)      │
        │ answered_at (DATETIME)       │  │ max_score (FL)           │
        │                              │  │ percentage (FL)          │
        │ [Unique: attempt +           │  │ is_pass (BOOL)           │
        │          exam_question]      │  │ status (ENUM)            │
        └──────────────────────────────┘  │   - draft                │
                                           │   - published            │
                                           │ published_at (DATETIME)  │
                                           │ created_at               │
                                           │ updated_at               │
                                           │                          │
                                           │ [1-to-1 with attempt]    │
                                           └──────────────────────────┘

        ┌──────────────────────────────┐
        │    EXAM_ANALYTICS            │
        ├──────────────────────────────┤
        │ id (UUID, PK)                │
        │ exam_id (FK, UNIQUE)         │
        │ total_attempts (INT)         │
        │ total_submitted (INT)        │
        │ average_score (FL)           │
        │ highest_score (FL)           │
        │ lowest_score (FL)            │
        │ pass_count (INT)             │
        │ pass_rate (FL) [percentage]  │
        │ updated_at (DATETIME)        │
        │                              │
        │ [1-to-1 with exam, cached]   │
        └──────────────────────────────┘
```

---

## Table Definitions

### 1. users
**Custom Django User Model with Role-Based Access**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY, AUTO | DRF primary key |
| username | VARCHAR(150) | UNIQUE, NOT NULL | For authentication |
| email | VARCHAR(254) | | |
| password | VARCHAR(128) | | Hashed |
| first_name | VARCHAR(150) | | |
| last_name | VARCHAR(150) | | |
| role | ENUM | 'admin', 'teacher', 'student' | DEFAULT: 'student' |
| is_active | BOOLEAN | | DEFAULT: True |
| created_at | TIMESTAMP | AUTO_NOW_ADD | |
| updated_at | TIMESTAMP | AUTO_NOW | |

**Indexes:**
- PRIMARY: id
- UNIQUE: username, email
- Regular: role, is_active

---

### 2. subjects
**Subjects/Courses for organizing exams and questions**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Subject name |
| description | TEXT | NULL | Optional |
| created_at | TIMESTAMP | AUTO_NOW_ADD | |
| updated_at | TIMESTAMP | AUTO_NOW | |

---

### 3. questions
**Question Bank - Reusable across multiple exams**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| subject_id | UUID | FK → subjects | NOT NULL |
| question_text | TEXT | NOT NULL | Question content |
| question_type | ENUM | 'mcq', 'true_false' | DEFAULT: 'mcq' |
| option_a | VARCHAR(500) | NULL | For MCQ |
| option_b | VARCHAR(500) | NULL | For MCQ |
| option_c | VARCHAR(500) | NULL | For MCQ |
| option_d | VARCHAR(500) | NULL | For MCQ (can be null for T/F) |
| correct_answer | VARCHAR(10) | NOT NULL | 'a', 'b', 'c', 'd' or 'true', 'false' |
| difficulty_level | ENUM | 'easy', 'medium', 'hard' | NOT NULL |
| topic_tag | VARCHAR(100) | INDEXED | For filtering |
| created_by | UUID | FK → users, NULL | Teacher who created |
| created_at | TIMESTAMP | AUTO_NOW_ADD | |
| updated_at | TIMESTAMP | AUTO_NOW | |

**Indexes:**
- PRIMARY: id
- COMPOSITE: (subject_id, difficulty_level)
- REGULAR: topic_tag

---

### 4. exams
**Exam Configurations**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| title | VARCHAR(255) | NOT NULL | |
| subject_id | UUID | FK → subjects | NOT NULL |
| description | TEXT | NULL | Instructions/rules |
| duration_minutes | INT | NOT NULL, 1-480 | Exam duration |
| total_questions | INT | NOT NULL, ≥1 | Number of questions |
| marks_per_question | FLOAT | NOT NULL, ≥0.1 | Marks for each Q |
| negative_mark | FLOAT | DEFAULT: 0, ≥0 | Penalty for wrong |
| pass_mark | FLOAT | DEFAULT: 40, 0-100 | Passing percentage |
| start_time | DATETIME | NOT NULL | When exam becomes available |
| end_time | DATETIME | NOT NULL | When exam closes |
| result_mode | ENUM | 'immediate', 'review' | DEFAULT: 'immediate' |
| selection_mode | ENUM | 'manual', 'auto' | DEFAULT: 'manual' |
| auto_easy | INT | DEFAULT: 0, ≥0 | If auto mode |
| auto_medium | INT | DEFAULT: 0, ≥0 | If auto mode |
| auto_hard | INT | DEFAULT: 0, ≥0 | If auto mode |
| created_by | UUID | FK → users, NULL | Teacher |
| is_published | BOOLEAN | DEFAULT: False | Visible to students? |
| created_at | TIMESTAMP | AUTO_NOW_ADD | |
| updated_at | TIMESTAMP | AUTO_NOW | |

**Indexes:**
- PRIMARY: id
- UNIQUE: (title, subject_id)
- REGULAR: (subject_id, is_published), (created_by), (start_time, end_time)

---

### 5. exam_questions
**Junction Table: Exam ↔ Questions with Randomization Snapshots**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| exam_id | UUID | FK → exams | NOT NULL |
| question_id | UUID | FK → questions | NOT NULL |
| question_order | INT | NOT NULL | Position in exam (1, 2, 3...) |
| shuffled_option_a | VARCHAR(500) | NULL | Randomized option order (snapshot) |
| shuffled_option_b | VARCHAR(500) | NULL | Stored at exam creation |
| shuffled_option_c | VARCHAR(500) | NULL | Prevents changes to question bank |
| shuffled_option_d | VARCHAR(500) | NULL | affecting ongoing/past attempts |
| shuffled_answer | VARCHAR(10) | NULL | Correct answer after shuffling |

**Indexes:**
- PRIMARY: id
- UNIQUE: (exam_id, question_id)
- REGULAR: (exam_id, question_order) SORTED

---

### 6. exam_attempts
**Student Exam Attempt Sessions**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| exam_id | UUID | FK → exams | NOT NULL |
| student_id | UUID | FK → users | NOT NULL |
| status | ENUM | 'in_progress', 'submitted', 'graded' | DEFAULT: 'in_progress' |
| started_at | TIMESTAMP | AUTO_NOW_ADD | When student began |
| submitted_at | DATETIME | NULL | When student submitted |
| last_question_visited | INT | DEFAULT: 0 | For resume functionality |

**Indexes:**
- PRIMARY: id
- UNIQUE: (exam_id, student_id) ← **IMPORTANT: One attempt per student per exam**
- REGULAR: (student_id), (exam_id, status)

---

### 7. student_answers
**Individual Question Responses**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| attempt_id | UUID | FK → exam_attempts | NOT NULL |
| exam_question_id | UUID | FK → exam_questions | NOT NULL |
| answer | VARCHAR(10) | NULL | Student's response ('a', 'b', 'c', 'd', 'true', 'false') |
| is_marked_for_review | BOOLEAN | DEFAULT: False | Yellow indicator flag |
| visited | BOOLEAN | DEFAULT: False | Blue indicator flag |
| answered_at | TIMESTAMP | AUTO_NOW | Last modified |

**Indexes:**
- PRIMARY: id
- UNIQUE: (attempt_id, exam_question_id)

---

### 8. results
**Computed Exam Results (Post-Submission)**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| attempt_id | UUID | FK → exam_attempts, UNIQUE | 1-to-1 relation |
| total_correct | INT | DEFAULT: 0 | Number of right answers |
| total_wrong | INT | DEFAULT: 0 | Number of wrong answers |
| total_skipped | INT | DEFAULT: 0 | Number of unanswered |
| score_obtained | FLOAT | DEFAULT: 0 | Calculated score |
| max_score | FLOAT | DEFAULT: 0 | Max possible score |
| percentage | FLOAT | DEFAULT: 0 | (score/max) * 100 |
| is_pass | BOOLEAN | DEFAULT: False | percentage ≥ pass_mark |
| status | ENUM | 'draft', 'published' | DEFAULT: 'draft' for review mode |
| published_at | DATETIME | NULL | When teacher published (review mode) |
| created_at | TIMESTAMP | AUTO_NOW_ADD | |
| updated_at | TIMESTAMP | AUTO_NOW | |

**Indexes:**
- PRIMARY: id
- UNIQUE: attempt_id
- REGULAR: status, is_pass

---

### 9. exam_analytics (Cached Stats)
**Aggregated Exam Statistics**

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PRIMARY KEY | |
| exam_id | UUID | FK → exams, UNIQUE | 1-to-1 relation |
| total_attempts | INT | DEFAULT: 0 | Count of all attempts |
| total_submitted | INT | DEFAULT: 0 | Count of submitted attempts |
| average_score | FLOAT | DEFAULT: 0 | AVG(score_obtained) |
| highest_score | FLOAT | DEFAULT: 0 | MAX(score_obtained) |
| lowest_score | FLOAT | DEFAULT: 0 | MIN(score_obtained) |
| pass_count | INT | DEFAULT: 0 | COUNT WHERE is_pass=True |
| pass_rate | FLOAT | DEFAULT: 0 | (pass_count / total_submitted) * 100 |
| updated_at | TIMESTAMP | AUTO_NOW | When stats recalculated |

**Notes:** This table is updated whenever a result is published. Can be recalculated via a management command if needed.

---

## Data Flow Diagram

### Exam Creation Flow
```
Teacher
  ↓
POST /exams/ → Create Exam (draft)
  ↓
POST /exams/{id}/add_questions/ → Add questions manually
            OR
POST /exams/{id}/auto_select_questions/ → Auto-select by difficulty
  ↓
ExamQuestion records created with shuffled options stored
  ↓
PUT /exams/{id}/ with is_published=True
  ↓
Exam visible to students
```

### Exam Taking Flow
```
Student
  ↓
GET /exams/available/ → See available exams
  ↓
POST /attempts/start_exam/ → Create ExamAttempt + StudentAnswer records (all null)
  ↓
Read questions, answer one-by-one
  ↓
POST /attempts/{id}/submit_answer/ → Update StudentAnswer.answer field
  ↓
POST /attempts/{id}/mark_for_review/ → Toggle StudentAnswer.is_marked_for_review
  ↓
POST /attempts/{id}/submit_exam/
  ↓
Backend:
  1. ExamAttempt.status = 'submitted'
  2. Evaluate all StudentAnswer records
  3. Create Result record with calculated scores
  4. If exam.result_mode='immediate' → Result.status='published'
     If exam.result_mode='review' → Result.status='draft'
  5. ExamAttempt.status = 'graded'
  ↓
GET /results/my_results/ → Student sees result (published only if immediate mode)
```

### Review Mode Flow (Teacher)
```
Teacher
  ↓
GET /results/?status=draft → See unpublished results
  ↓
Optionally review student answers and remarks
  ↓
POST /results/{id}/publish_result/ → Result.status='published', published_at=now()
  ↓
Student
  ↓
Sees published result on GET /results/my_results/
```

---

## SQL Execution Order (For Initial Migrations)

1. `users` table (custom user)
2. `subjects` table
3. `questions` table (fk → subjects, users)
4. `exams` table (fk → subjects, users)
5. `exam_questions` table (fk → exams, questions)
6. `exam_attempts` table (fk → exams, users)
7. `student_answers` table (fk → exam_attempts, exam_questions)
8. `results` table (fk → exam_attempts)
9. `exam_analytics` table (fk → exams)

---

## Foreign Keys Summary

| Table | Points To | Relationship | Notes |
|-------|-----------|--------------|-------|
| questions | users | N-1 | created_by |
| questions | subjects | N-1 | subject_id |
| exams | users | N-1 | created_by |
| exams | subjects | N-1 | subject_id |
| exam_questions | exams | N-1 | exam_id |
| exam_questions | questions | N-1 | question_id |
| exam_attempts | exams | N-1 | exam_id |
| exam_attempts | users | N-1 | student_id |
| student_answers | exam_attempts | N-1 | attempt_id |
| student_answers | exam_questions | N-1 | exam_question_id |
| results | exam_attempts | 1-1 | attempt_id (unique) |
| exam_analytics | exams | 1-1 | exam_id (unique) |

---

## Sample Data Model (Example)

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "student1",
    "email": "student1@university.edu",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "is_active": true
  },
  
  "subject": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Data Structures",
    "description": "Learn fundamental data structures"
  },
  
  "question": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "subject_id": "550e8400-e29b-41d4-a716-446655440001",
    "question_text": "What is the time complexity of binary search?",
    "question_type": "mcq",
    "option_a": "O(n)",
    "option_b": "O(log n)",
    "option_c": "O(n²)",
    "option_d": "O(1)",
    "correct_answer": "b",
    "difficulty_level": "medium",
    "topic_tag": "Searching",
    "created_by": "550e8400-e29b-41d4-a716-446655440000"
  },

  "exam": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "title": "Data Structures Midterm",
    "subject_id": "550e8400-e29b-41d4-a716-446655440001",
    "duration_minutes": 120,
    "total_questions": 50,
    "marks_per_question": 2,
    "negative_mark": 0.5,
    "pass_mark": 40,
    "start_time": "2026-03-14T10:00:00Z",
    "end_time": "2026-03-14T12:00:00Z",
    "result_mode": "immediate",
    "selection_mode": "auto",
    "auto_easy": 10,
    "auto_medium": 25,
    "auto_hard": 15,
    "is_published": true
  },

  "exam_attempt": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "exam_id": "550e8400-e29b-41d4-a716-446655440003",
    "student_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "graded",
    "started_at": "2026-03-14T10:05:00Z",
    "submitted_at": "2026-03-14T11:50:00Z"
  },

  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "attempt_id": "550e8400-e29b-41d4-a716-446655440004",
    "total_correct": 35,
    "total_wrong": 10,
    "total_skipped": 5,
    "score_obtained": 69.5,
    "max_score": 100,
    "percentage": 69.5,
    "is_pass": true,
    "status": "published"
  }
}
```

---

## Performance Considerations

1. **Indexing Strategy**
   - Primary keys on all tables
   - Foreign key indexes for fast joins
   - Composite index on (subject, difficulty) for question filtering
   - Unique constraints prevent duplicate attempts

2. **Query Optimization**
   - Use `select_related()` for ForeignKeys
   - Use `prefetch_related()` for reverse ForeignKeys
   - Pagination on list endpoints (default 20 items)
   - Cache exam_analytics and refresh on result publish

3. **Partitioning (Optional, Large Scale)**
   - Partition `student_answers` and `results` by exam_id
   - Partition `exam_attempts` by created_at (monthly)

4. **Backup Strategy**
   - Daily backups by managed MySQL provider
   - Point-in-time recovery enabled
   - Test restore procedures monthly

---

## Migration Notes

When connecting to client's hosted MySQL:

```bash
# 1. Update .env with DB credentials
# 2. Run migrations
python manage.py migrate

# 3. Create superuser
python manage.py createsuperuser

# 4. Load sample subjects (if needed)
python manage.py shell < scripts/load_subjects.py

# 5. Check status
python manage.py dbshell
SHOW TABLES;
```

All table names use `db_table` metadata to ensure consistent naming across environments.
