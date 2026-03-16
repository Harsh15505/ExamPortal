import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'

export default function AdminResults() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [examFilter, setExamFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadInitial()
  }, [])

  const loadInitial = async () => {
    try {
      setLoading(true)
      setError('')
      const [examRes, resultRes] = await Promise.all([examAPI.listExams(), examAPI.getResults()])
      const examData = examRes.data || examRes
      const resultData = resultRes.data || resultRes
      setExams(Array.isArray(examData) ? examData : examData.results || [])
      setResults(Array.isArray(resultData) ? resultData : resultData.results || [])
    } catch (err) {
      console.error('Failed to load admin results:', err)
      setError(err.response?.data?.detail || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const publishResult = async (resultId) => {
    try {
      await examAPI.publishResult(resultId)
      setError({ type: 'success', message: 'Result published successfully!' })
      loadInitial()
    } catch (err) {
      console.error('Publish failed:', err)
      setError({ type: 'danger', message: err.response?.data?.detail || 'Failed to publish result' })
    } finally {
      setTimeout(() => setError(null), 5000)
    }
  }

  const visibleResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    return results.filter((r) => {
      const byStatus = statusFilter === 'all' || r.status === statusFilter
      const byExam = examFilter === 'all' || String(r.exam_id) === String(examFilter)
      const bySearch = !q || (r.student_username || '').toLowerCase().includes(q) || (r.exam_title || '').toLowerCase().includes(q)
      return byStatus && byExam && bySearch
    })
  }, [results, statusFilter, examFilter, search])

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading results...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Result Review Management</h3>
          <button className="btn btn-outline-secondary btn-sm" onClick={loadInitial}>Refresh</button>
        </div>

        {error && (
          <div className={`alert alert-${error.type || 'danger'} d-flex align-items-center justify-content-between`} style={{ marginBottom: '25px', borderRadius: '12px' }}>
            <span>{typeof error === 'string' ? error : error.message}</span>
            <button className="btn-close" style={{ filter: 'invert(1)' }} onClick={() => setError('')} />
          </div>
        )}

        <div className="card mb-4 border-0 shadow-sm" style={{ background: 'var(--bg-elevated)', borderRadius: '18px' }}>
          <div className="card-body p-3">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0" style={{ color: 'var(--text-muted)' }}>🔍</span>
                  <input
                    className="form-control border-start-0"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <select className="form-select form-select-sm" style={{ borderRadius: '8px' }} value={examFilter} onChange={(e) => setExamFilter(e.target.value)}>
                  <option value="all">📊 All Exams</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <select className="form-select form-select-sm" style={{ borderRadius: '8px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">🏷️ All Status</option>
                  <option value="draft">📁 Draft</option>
                  <option value="published">🚀 Published</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {visibleResults.length === 0 ? (
          <div className="alert alert-info">No results found for current filters.</div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Exam</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Score</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>%</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Result</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleResults.map((r) => (
                  <tr key={r.id} className="align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.exam_title}</td>
                    <td style={{ padding: '16px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--primary-light)', fontWeight: 700 }}>
                          {r.student_username?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{r.student_username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {r.score_obtained} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8em' }}>/ {r.max_score}</span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: Number(r.percentage) >= (r.pass_mark || 40) ? 'var(--success)' : 'var(--danger)' }}>
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
                    <td style={{ padding: '16px' }}>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-outline-primary" 
                          onClick={() => navigate(`/results/${r.attempt_id}`)}
                          style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        >
                          View
                        </button>
                        {r.status === 'draft' && (
                          <button className="btn btn-sm btn-success" onClick={() => publishResult(r.id)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                            Publish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
