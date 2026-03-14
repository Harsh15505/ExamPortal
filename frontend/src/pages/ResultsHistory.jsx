import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'

export default function ResultsHistory() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await examAPI.getMyResults()
      const data = response.data || response
      setResults(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      console.error('Failed to load result history:', err)
      setError(err.response?.data?.detail || 'Failed to load exam history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading history...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Exam History</h3>
          <button className="btn btn-outline-secondary btn-sm" onClick={loadHistory}>Refresh</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {results.length === 0 ? (
          <div className="alert alert-info" style={{ borderRadius: '12px' }}>No exam history available yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Exam Title</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Score</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>%</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Result</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{r.exam_title}</div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      <strong>{r.score_obtained}</strong> / {r.max_score}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, color: r.is_pass ? 'var(--success)' : 'var(--danger)' }}>
                      {Number(r.percentage || 0).toFixed(1)}%
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge" style={{ 
                        background: r.is_pass ? 'var(--success-bg)' : 'var(--danger-bg)',
                        color: r.is_pass ? 'var(--success)' : 'var(--danger)',
                        border: '1px solid transparent',
                        padding: '6px 10px', fontWeight: 600
                      }}>
                        {r.is_pass ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge" style={{ 
                        background: r.status === 'published' ? 'var(--info-bg)' : 'var(--warning-bg)',
                        color: r.status === 'published' ? 'var(--info)' : 'var(--warning)',
                        padding: '6px 10px', fontWeight: 600, textTransform: 'capitalize'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/results/${r.id}`)}
                        disabled={r.status !== 'published'}
                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <button className="btn btn-primary px-4" onClick={() => navigate('/')}>← Back to Dashboard</button>
        </div>
      </div>
    </Layout>
  )
}
