# Online Examination System - Project Setup Guide

## Project Structure

```
Exam System/
├── backend/              # Django REST API
│   ├── server/          # Django project settings
│   ├── core/            # Core models and APIs
│   ├── users/           # User management app
│   ├── exams/           # Exam management app
│   └── manage.py
├── frontend/            # React Vite frontend
│   ├── src/
│   ├── public/
│   └── vite.config.js
├── .env                 # Development environment vars
├── .env.example         # Example environment template
└── README.md
```

## Database Schema Overview

### Core Tables

1. **users** - Custom user model with roles
   - Roles: admin, teacher, student
   - Auth via JWT tokens

2. **subjects** - Subject/Course management
   - Used by questions and exams

3. **questions** - Question bank (reusable MCQ/TrueFalse)
   - Difficulty: easy, medium, hard
   - Types: MCQ (4 options), TrueFalse
   - Metadata: topic_tag, created_by

4. **exams** - Exam configurations
   - Selection mode: manual or auto
   - Duration, marks, negative_mark, pass_mark
   - Result mode: immediate or review
   - Scheduling: start_time, end_time

5. **exam_questions** - Junction table (exam ↔ questions)
   - Stores shuffled options snapshot
   - Question ordering

6. **exam_attempts** - Student exam attempts
   - Status: in_progress, submitted, graded
   - One attempt per student per exam

7. **student_answers** - Individual question responses
   - Answer, marked_for_review, visited flags

8. **results** - Computed exam results
   - Scores, percentage, pass/fail
   - Status: draft, published (for review mode)

9. **exam_analytics** - Aggregated exam statistics (cache)
   - Total attempts, average score, pass rate, etc.

## Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+
- MySQL 8.0+ (hosted service like Aiven, PlanetScale, Railway, AWS RDS)

### Backend Setup

1. **Navigate to backend:**
   ```powershell
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```powershell
   .\.venv\Scripts\activate
   ```

3. **Configure database credentials:**
   - Copy `.env.example` to `.env`
   - Fill in your MySQL database credentials:
     ```
     DB_HOST=your-database-host.com
     DB_NAME=exam_system
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_PORT=3306
     ```

4. **Run migrations:**
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (admin):**
   ```powershell
   python manage.py createsuperuser
   ```

6. **Run development server:**
   ```powershell
   python manage.py runserver
   ```
   - Admin interface: http://localhost:8000/admin
   - API: http://localhost:8000/api/v1/

### Frontend Setup

1. **Navigate to frontend:**
   ```powershell
   cd frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Configure API endpoint:**
   - Create `.env.local`:
     ```
     VITE_API_URL=http://localhost:8000/api/v1
     ```

4. **Run development server:**
   ```powershell
   npm run dev
   ```
   - Frontend: http://localhost:5173

## API Endpoints (v1)

### Authentication
- `POST /api/v1/auth/token/` - Get JWT tokens
- `POST /api/v1/auth/token/refresh/` - Refresh token

### Users
- `GET /api/v1/users/` - List all users (admin only)
- `POST /api/v1/users/` - Create user (registration)
- `GET /api/v1/users/me/` - Get current user profile
- `GET /api/v1/users/by_role/?role=student` - Filter by role

### Subjects
- `GET /api/v1/subjects/` - List all subjects
- `POST /api/v1/subjects/` - Create subject (teacher/admin)
- `GET /api/v1/subjects/{id}/` - Get subject details
- `PUT /api/v1/subjects/{id}/` - Update subject

### Questions
- `GET /api/v1/questions/` - List questions with filters
- `POST /api/v1/questions/` - Create question (teacher)
- `GET /api/v1/questions/by_subject/?subject_id={id}&difficulty=easy` - Filter questions
- `PUT /api/v1/questions/{id}/` - Update question
- `DELETE /api/v1/questions/{id}/` - Delete question

### Exams
- `GET /api/v1/exams/` - List exams
- `POST /api/v1/exams/` - Create exam (teacher)
- `POST /api/v1/exams/{id}/add_questions/` - Add manual questions
- `POST /api/v1/exams/{id}/auto_select_questions/` - Auto-select by difficulty
- `POST /api/v1/exams/{id}/publish/` - Publish exam
- `GET /api/v1/exams/available/` - Student: exams available to take

### Exam Attempts
- `POST /api/v1/attempts/start_exam/` - Start exam attempt
- `POST /api/v1/attempts/{id}/submit_answer/` - Submit single answer
- `POST /api/v1/attempts/{id}/mark_for_review/` - Toggle review flag
- `POST /api/v1/attempts/{id}/submit_exam/` - Submit entire exam

### Results
- `GET /api/v1/results/` - List results
- `GET /api/v1/results/my_results/` - Student: my results
- `POST /api/v1/results/{id}/publish_result/` - Teacher: publish result (review mode)

### Analytics
- `GET /api/v1/analytics/by_exam/?exam_id={id}` - Get exam analytics

## Database Host Configuration

When you receive MySQL database credentials from your hosting provider:

1. **For Aiven (MySQL):**
   ```
   DB_HOST: your-aiven-instance.h.aivencloud.com
   DB_PORT: 21234 (custom port)
   DB_NAME: your_db_name
   DB_USER: avnadmin
   DB_PASSWORD: your_password
   DB_SSL_CA: /path/to/ca.pem (if provided, support SSL)
   ```

2. **For PlanetScale:**
   ```
   DB_HOST: your-region.connect.psdb.cloud
   DB_PORT: 3306
   DB_NAME: your_db_name
   DB_USER: your_user
   DB_PASSWORD: your_password
   # PlanetScale uses SSL by default
   DB_SSL_VERIFY_CERT: True
   ```

3. **For Railway, AWS RDS, or DigitalOcean:**
   ```
   Replace standard host, port, credentials
   SSL typically optional but can be enabled
   ```

## Key Features Implemented

✅ Custom User model with role-based authentication (Admin/Teacher/Student)
✅ Complete Question Bank with filtering by subject, difficulty, topic
✅ Exam creation with manual and auto question selection
✅ Exam attempt flow with question lifecycle tracking
✅ Auto-evaluation of MCQ/TrueFalse questions
✅ Result modes (immediate & review)
✅ Exam analytics dashboard (cached aggregations)
✅ JWT authentication with CORS
✅ RESTful API structure
✅ Database migrations ready
✅ Admin interface for content management

## Next Steps

1. **Client provides database credentials**
   - Update `.env` with production database details
   - Run migrations on hosted database

2. **Frontend Development**
   - Build React components for exam interface
   - One-question-per-page layout with navigation
   - Timer countdown and auto-submit
   - Answer status indicators (green/yellow/blue/grey)

3. **Teacher Dashboard**
   - Question bank UI
   - Exam creation form
   - Results view
   - Analytics charts (score distribution, topic performance)

4. **Student Interface**
   - Exam listing page
   - Instruction page
   - Exam taking interface
   - Result page

5. **Deployment**
   - Django: Gunicorn + Nginx / Vercel / Heroku
   - React: Vercel / Netlify
   - Database: Managed MySQL hosting (already configured)

## Support for Your Client

Since all migrations and data are cloud-based:
- **No local database setup needed by client**
- **No phpMyAdmin required**
- **Client only needs to:**
  1. Provide database credentials
  2. Run `python manage.py migrate` (one time)
  3. Create admin account
  4. Access web interface

All data is centralized and backed up by the hosting provider.
