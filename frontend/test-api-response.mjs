// Test what examAPI.getAvailableExams returns
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

// Create axios instance
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock token from admin user
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzA5MDU2NDUzLCJpYXQiOjE3MDkwNTI4NTMsImp0aSI6IjAwZjhjYTk4OTI2NzQ0MGY4YTg4ZWMyM2ZiODFkOGRjIiwidXNlcl9pZCI6IjQ0Nzg1ODExLWNlMWUtNDc4OC05ODMyLWJjMmQ2ZDYxMGRjZiJ9.5zI4VVn5z1234567890';

// Add token to requests
client.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${mockToken}`;
  return config;
});

// Test the API
(async () => {
  try {
    console.log('Making request to /exams/available/...');
    const response = await client.get('/exams/available/');
    
    console.log('\n=== FULL RESPONSE OBJECT ===');
    console.log('response.data type:', typeof response.data);
    console.log('Array.isArray(response.data):', Array.isArray(response.data));
    console.log('response.data length:', response.data?.length);
    console.log('First item:', response.data?.[0]);
    
    console.log('\n=== WHAT TO USE IN FRONTEND ===');
    console.log('Should use: response.data (the array)');
    console.log('Length:', response.data.length);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
  }
})();
