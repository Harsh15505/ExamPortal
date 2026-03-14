// src/api/exams.js
import client from './client';

export const examAPI = {
  // Users
  listUsers: (params) => client.get('/users/', { params }),
  createUser: (data) => client.post('/users/', data),
  updateUser: (id, data) => client.put(`/users/${id}/`, data),
  deleteUser: (id) => client.delete(`/users/${id}/`),

  // Exams
  listExams: (params) => client.get('/exams/', { params }),
  getExam: (id) => client.get(`/exams/${id}/`),
  createExam: (data) => client.post('/exams/', data),
  updateExam: (id, data) => client.put(`/exams/${id}/`, data),
  deleteExam: (id) => client.delete(`/exams/${id}/`),
  
  // Questions
  listQuestions: (params) => client.get('/questions/', { params }),
  getQuestion: (id) => client.get(`/questions/${id}/`),
  createQuestion: (data) => client.post('/questions/', data),
  updateQuestion: (id, data) => client.put(`/questions/${id}/`, data),
  deleteQuestion: (id) => client.delete(`/questions/${id}/`),
  
  // Subjects
  listSubjects: (params) => client.get('/subjects/', { params }),
  createSubject: (data) => client.post('/subjects/', data),
  updateSubject: (id, data) => client.put(`/subjects/${id}/`, data),
  deleteSubject: (id) => client.delete(`/subjects/${id}/`),
  
  // Question Management
  addQuestions: (examId, questionIds) =>
    client.post(`/exams/${examId}/add_questions/`, { question_ids: questionIds }),

  autoSelectQuestions: (examId) =>
    client.post(`/exams/${examId}/auto_select_questions/`),

  getAvailableExams: () => client.get('/exams/available/'),

  // Attempts
  startExam: (examId) =>
    client.post('/attempts/start_exam/', { exam_id: examId }),

  clearAttempts: () =>
    client.post('/attempts/clear_attempts/'),

  getAttempt: (id) => client.get(`/attempts/${id}/`),
  
  submitAnswer: (attemptId, examQuestionId, answer) =>
    client.post(`/attempts/${attemptId}/submit_answer/`, {
      exam_question_id: examQuestionId,
      answer,
    }),

  markForReview: (attemptId, examQuestionId) =>
    client.post(`/attempts/${attemptId}/mark_for_review/`, {
      exam_question_id: examQuestionId,
    }),

  submitExam: (attemptId) =>
    client.post(`/attempts/${attemptId}/submit_exam/`),

  // Results
  getResults: (params) => client.get('/results/', { params }),
  getResult: (attemptId) => client.get('/results/by_attempt/', { params: { attempt_id: attemptId } }),
  getMyResults: () => client.get('/results/my_results/'),
  publishResult: (id) => client.post(`/results/${id}/publish_result/`),

  // Analytics
  getAnalytics: (examId) =>
    client.get('/analytics/by_exam/', { params: { exam_id: examId } }),
  getScoreDistribution: (examId) =>
    client.get('/analytics/score_distribution/', { params: { exam_id: examId } }),
  getTopicPerformance: (examId) =>
    client.get('/analytics/topic_performance/', { params: { exam_id: examId } }),
  getDifficultyPerformance: (examId) =>
    client.get('/analytics/difficulty_performance/', { params: { exam_id: examId } }),
};
