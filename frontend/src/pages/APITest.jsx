import { useState } from 'react'
import client from '../api/client'

export default function APITest() {
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)
    
    try {
      console.log('Making raw API call...')
      const token = localStorage.getItem('access_token')
      console.log('Token exists:', !!token)
      
      const res = await client.get('/exams/available/')
      console.log('Full response object:', res)
      console.log('Response.data:', res.data)
      
      setResponse({
        status: res.status,
        data: res.data,
        dataType: typeof res.data,
        isArray: Array.isArray(res.data),
        length: res.data?.length,
      })
    } catch (err) {
      console.error('Full error:', err)
      setError({
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Test</h2>
      <button onClick={testAPI} disabled={loading}>
        {loading ? 'Loading...' : 'Test API'}
      </button>
      
      {error && (
        <div style={{ color: 'red', marginTop: '20px', whiteSpace: 'pre-wrap' }}>
          <strong>ERROR:</strong>
          {JSON.stringify(error, null, 2)}
        </div>
      )}
      
      {response && (
        <div style={{ color: 'green', marginTop: '20px', whiteSpace: 'pre-wrap' }}>
          <strong>SUCCESS:</strong>
          {JSON.stringify(response, null, 2)}
        </div>
      )}
    </div>
  )
}
