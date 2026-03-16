# 🎓 ExamPortal: Advanced Online Examination System

[![React](https://img.shields.io/badge/Frontend-React%2019-blue?logo=react)](https://react.dev/)
[![Django](https://img.shields.io/badge/Backend-Django%206.0-green?logo=django)](https://www.djangoproject.com/)

ExamPortal is a robust, university-grade web application designed to streamline the online examination process. It provides a seamless experience for students to take exams, for teachers to manage question banks and evaluate performance, and for administrators to oversee the academic structure.

---

## 🌟 Key Features

### 👨‍🎓 Student Experience
- **Dynamic Dashboard**: View available exams with real-time status updates.
- **Intelligent Exam Interface**: One-question-at-a-time focus, interactive navigation panel, and real-time countdown timer.
- **Instant/Deferred Results**: View detailed score breakdowns, percentages, and pass/fail status.
- **Answer Review**: Revisit submitted answers after the exam is published.

### 👩‍🏫 Teacher Capabilities
- **Question Bank Management**: Centralized repository for MCQ and True/False questions by subject, difficulty, and topic.
- **Flexible Exam Creation**: Manual selection or parameter-defined auto-selection.
- **Result & Analytics**: Comprehensive results lists, performance reports, and one-click publishing.

### 🔐 Administrator Oversight
- **User Management**: Unified interface to manage student, teacher, and admin accounts.
- **Academic Setup**: Define and manage subjects and institutional metadata.

---

## 🔑 Accessing the System

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `demo_admin` | `Admin@123` |
| **Math Teacher** | `teacher_math` | `Teacher@123` |
| **CS Teacher** | `teacher_cs` | `Teacher@123` |
| **Science Teacher** | `teacher_science` | `Teacher@123` |
| **English Teacher** | `teacher_eng` | `Teacher@123` |
| **Students (1-10)** | `student_01` to `student_10` | `Student@123` |

> [!NOTE]
> The system has been freshly populated with realistic data for these accounts, including completed exams and historical results.

---

## 🛠️ Technical Stack

- **Frontend**: React 19, Vite, Bootstrap 5, Axios, Recharts.
- **Backend**: Django 6.0, Django REST Framework (DRF), JWT Authentication.
- **Database**: MySQL (Optimized for Aiven/AWS/PlanetScale).

---

## 🚀 Installation & Setup

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate: .\.venv\Scripts\activate (Win) or source .venv/bin/activate (Unix)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚢 Deployment
1. **Frontend**: Run `npm run build` in `/frontend`. Output in `/dist`.
2. **Backend**: Set `DEBUG=False` and configure `ALLOWED_HOSTS`. Use a production server like Gunicorn.
