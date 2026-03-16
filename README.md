# Online Examination System 🚀

A comprehensive, university-grade online examination platform built with **Django REST Framework** and **React 19**.

## ✨ Recent Improvements & Bug Fixes
- **Backend Stability**: Resolved critical `500 Internal Server Error` on exam initialization.
- **Question Logic**: Implemented automated option shuffling and correct answer mapping for secure exam delivery.
- **Improved UI**: Upgraded the teacher's question linking interface to a modern, centered modal overlay.
- **Result Management**: Fixed navigation and data fetching for student reports; teachers/admins can now view detailed attempt reviews.
- **Permissions**: Refined role-based access control for subjects, exams, and results.

---

## 🔑 Testing Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `demo_admin` | `Admin@123` |
| **Teacher** | `demo_teacher` | `Teacher@123` |
| **Students** | `demo_student`, `student_1`, `student_2` | `Student@123` |

---

## 🚀 Quick Start

### 1. Backend Setup (Django)
```bash
cd backend
python -m venv .venv
# Activate venv: ..\.venv\Scripts\activate (Windows) or source .venv/bin/activate (Linux/Mac)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Visit: [http://localhost:5173/](http://localhost:5173/)

---

## 📋 Testing Checklist

### 1. Admin Workflow
- Log in as `demo_admin` and create a new **Subject**.

### 2. Teacher Workflow
- Log in as `demo_teacher`.
- Create **Questions** for the new subject.
- Create an **Exam**, pick questions using the new **Questions** modal, and set it to **Public**.

### 3. Student Workflow
- Log in as a student (e.g., `demo_student`).
- Start the exam (Verify: No 500 errors).
- Submit the exam and view your result history.

### 4. Review Workflow
- Log in as Teacher/Admin.
- Go to **Results Review**, publish the result, and click **View** to see the student's detailed report.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Bootstrap 5, Recharts, Axios.
- **Backend**: Django 6.0, Django REST Framework, JWT Auth.
- **Database**: MySQL (Compatible with Aiven, PlanetScale, Railway, AWS RDS).

---

## 🚢 Deployment
Run `npm run build` in the `frontend` directory to generate the production-ready `dist/` folder. For the backend, set `DEBUG=False` and use a production-grade WSGI server like Gunicorn.
