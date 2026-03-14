import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import StudentLogin from './pages/StudentLogin'
import TeacherLogin from './pages/TeacherLogin'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ExamInstructions from './pages/ExamInstructions'
import ExamTaking from './pages/ExamTaking'
import Results from './pages/Results'
import ResultsHistory from './pages/ResultsHistory'
import ManageQuestions from './pages/ManageQuestions'
import ManageExams from './pages/ManageExams'
import AdminAnalytics from './pages/AdminAnalytics'
import ManageUsers from './pages/ManageUsers'
import ManageSubjects from './pages/ManageSubjects'
import AdminResults from './pages/AdminResults'
import APITest from './pages/APITest'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/teacher" element={<TeacherLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageExams />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exam/:id" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ExamTaking />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exam/:id/instructions" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ExamInstructions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ResultsHistory />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results/:attemptId" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Results />
                </ProtectedRoute>
              } 
            />

            {/* Teacher Routes */}
            <Route 
              path="/teacher/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageExams />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/questions" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageQuestions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/exams" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageExams />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/results" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <AdminResults />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/subjects" 
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <ManageSubjects />
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes (Restricted) */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } 
            />
            
            {/* Debug/Test Routes */}
            <Route 
              path="/test/api" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <APITest />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all */}
            <Route path="*" element={<div className="container mt-5"><h2>Page Not Found</h2></div>} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )
}

export default App
