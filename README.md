# 🎓 ExamPortal: Advanced Online Examination System

[![React](https://img.shields.io/badge/Frontend-React%2019-blue?logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Backend-Django%206.0-green?logo=django)](https://www.djangoproject.com/)

ExamPortal is a robust, university-grade web application designed to streamline the online examination process. It provides a seamless experience for students to take exams, for teachers to manage question banks and evaluate performance, and for administrators to oversee the academic structure.

---

## 🌟 Key Features

### 👨‍🎓 Student Experience
- **Dynamic Dashboard**: View available exams with real-time status updates.
- **Intelligent Exam Interface**: 
  - One-question-at-a-time focus to reduce cognitive load.
  - Interactive navigation panel with status color codes (Answered, Marked for Review, Pending).
  - Real-time countdown timer with automated submission on expiration.
- **Instant/Deferred Results**: View detailed score breakdowns, percentages, and pass/fail status.
- **Answer Review**: Revisit submitted answers after the exam is published.

### 👩‍🏫 Teacher Capabilities
- **Question Bank Management**: 
  - Centralized repository for MCQ and True/False questions.
  - Categorization by subject, difficulty level (Easy, Medium, Hard), and topic tags.
- **Flexible Exam Creation**:
  - **Manual Selection**: Hand-pick specific questions from the bank.
  - **Auto-Selection**: Define parameters and let the system randomly select questions.
  - **Customizable Rules**: Configure duration, marks, negative marking, and passing thresholds.
- **Result & Analytics**:
  - Comprehensive results lists with filtering by student or exam.
  - One-click publishing of results.
  - Detailed student performance reports.

### 🔐 Administrator Oversight
- **User Management**: Unified interface to manage student, teacher, and admin accounts.
- **Academic Setup**: Define and manage subjects and institutional metadata.
- **System Analytics**: High-level overview of system activity and student performance.

---

## 🛠️ Technical Stack

- **Frontend**: React 19, Vite, Bootstrap 5, Axios, Recharts (Analytics).
- **Backend**: Django 6.0, Django REST Framework (DRF), JWT Authentication.
- **Database**: MySQL (Optimized for hosted services like Aiven, AWS RDS, or PlanetScale).
- **Styling**: Vanilla CSS (Custom tokens and modern design systems).

---

## 🚀 Getting Started

### Prerequisites
- **Python**: 3.12+ 
- **Node.js**: 18+
- **MySQL**: 8.0+

### 1. Backend Installation
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .\.venv\Scripts\activate # Windows

# Install dependencies
pip install -r requirements.txt

# Configure Environment
# Create .env based on .env.example with your database credentials
python manage.py migrate

# Start Server
python manage.py runserver
```

### 2. Frontend Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Development Server
npm run dev
```

---

## 🔑 Accessing the System

| Account Type | Credentials (Username | Password) |
| :--- | :--- |
| **Administrator** | `demo_admin` | `Admin@123` |
| **Teacher** | `demo_teacher` | `Teacher@123` |
| **Student** | `demo_student` | `Student@123` |

---

## 🛡️ Security Features
- **Stateless Authentication**: Powered by JWT (JSON Web Tokens).
- **RBAC (Role-Based Access Control)**: Granular permissions at the API level.
- **Anti-Cheating Mechanisms**:
  - Randomized question order.
  - Shuffled options stored at the point of exam creation.
  - One-attempt-per-exam restriction.
  - Automated session termination on timeout.

---

## 🚢 Deployment
To prepare for production:
1.  **Frontend**: Run `npm run build` in the `/frontend` directory. The production-ready files will be in `/dist`.
2.  **Backend**: Set `DEBUG=False` in `settings.py` and configure `ALLOWED_HOSTS`. Use a production server like Gunicorn/Nginx.
