// src/api/questions.js
import client from './client';

export const questionAPI = {
  listQuestions: (params) => client.get('/questions/', { params }),
  getQuestion: (id) => client.get(`/questions/${id}/`),
  createQuestion: (data) => client.post('/questions/', data),
  updateQuestion: (id, data) => client.put(`/questions/${id}/`, data),
  deleteQuestion: (id) => client.delete(`/questions/${id}/`),
  
  filterBySubject: (subjectId, difficulty) =>
    client.get('/questions/by_subject/', {
      params: { subject_id: subjectId, difficulty },
    }),
};
