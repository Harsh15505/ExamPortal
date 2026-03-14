import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'
import { format, isPast } from 'date-fns'
import StudentAnalyticsChart from '../components/common/StudentAnalyticsChart'

const difficultyIcon = { easy: '🟢', medium: '🟡', hard: '🔴' }

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) loadExams()
  }, [authLoading])

  const loadExams = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await examAPI.getAvailableExams()
      setExams(response.data || response || [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Layout>
      <div className="container-fluid px-4 py-4 page-section">

        {/* Greeting Banner */}
        <div className="dashboard-greeting">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 500 }}>
              {greeting()},
            </p>
            <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              <span style={{ marginLeft: '10px' }}>👋</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              You have <strong style={{ color: 'var(--primary-light)' }}>{exams.length} exam{exams.length !== 1 ? 's' : ''}</strong> available to take.
            </p>
          </div>
        </div>

        {/* Analytics Section (Only for students) */}
        {user?.role === 'student' && <StudentAnalyticsChart />}

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>Available Exams</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click an exam card to view instructions</p>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={loadExams}
            disabled={loading}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {error}
            <button className="btn-close" style={{ marginLeft: 'auto', display: 'block', filter: 'invert(1)' }} onClick={() => setError('')} />
          </div>
        )}

        {loading ? (
          <div className="row g-4 skeleton-container">
            {[1, 2, 3].map((n) => (
              <div key={n} className="col-md-6 col-xl-4">
                <div className="exam-card-skeleton" style={{
                  height: '240px', background: 'var(--bg-surface)',
                  borderRadius: '18px', border: '1px solid var(--border)',
                  padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px',
                  animation: 'pulse 1.5s infinite ease-in-out'
                }}>
                  <div style={{ width: '80px', height: '28px', background: 'var(--border)', borderRadius: '8px' }} />
                  <div style={{ width: '70%', height: '24px', background: 'var(--border)', borderRadius: '4px' }} />
                  <div style={{ width: '90%', height: '16px', background: 'var(--border)', borderRadius: '4px' }} />
                  <div className="d-flex gap-2 mt-auto">
                    <div style={{ width: '60px', height: '20px', background: 'var(--border)', borderRadius: '100px' }} />
                    <div style={{ width: '60px', height: '20px', background: 'var(--border)', borderRadius: '100px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '100px 24px',
            background: 'var(--bg-surface)', border: '1px dashed var(--border)',
            borderRadius: '18px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px', filter: 'grayscale(1)', opacity: 0.6 }}>📭</div>
            <h3 style={{ marginBottom: '12px', fontWeight: 700 }}>No exams available</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
              Your dashboard is empty for now. Once your teacher publishes an exam, it will appear right here!
            </p>
            <button className="btn btn-outline-primary mt-4" onClick={loadExams}>
              Check for updates
            </button>
          </div>
        ) : (
          <div className="row g-4" style={{ animation: 'fadeIn 0.4s ease both' }}>
            {exams.map((exam, i) => {
              const startSoon = new Date(exam.start_time) > new Date()
              return (
                <div key={exam.id} className="col-md-6 col-xl-4" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div
                    className="exam-card h-100"
                    onClick={() => navigate(`/exam/${exam.id}/instructions`)}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{
                        padding: '8px 12px', background: 'var(--primary-glow)',
                        border: '1px solid rgba(79,110,247,0.3)', borderRadius: '8px',
                        fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-light)',
                      }}>
                        {exam.subject_name || 'General'}
                      </div>
                      {startSoon && (
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, padding: '4px 8px',
                          background: 'var(--warning-bg)', color: 'var(--warning)',
                          borderRadius: '6px', border: '1px solid rgba(245,158,11,0.3)',
                        }}>🕐 Upcoming</span>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h4 style={{ marginBottom: '6px', lineHeight: 1.3 }}>{exam.title}</h4>
                      {exam.description && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {exam.description}
                        </p>
                      )}
                    </div>

                    {/* Stats chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="stat-chip">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {exam.duration_minutes} min
                      </span>
                      <span className="stat-chip">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {exam.total_questions} questions
                      </span>
                      <span className="stat-chip">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Pass {exam.pass_mark}%
                      </span>
                      {exam.negative_mark > 0 && (
                        <span className="stat-chip" style={{ color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          -{exam.negative_mark} neg
                        </span>
                      )}
                    </div>

                    {/* Timing */}
                    <div style={{
                      marginTop: 'auto', paddingTop: '12px',
                      borderTop: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Ends {exam.end_time ? format(new Date(exam.end_time), 'MMM d, HH:mm') : '—'}
                      </span>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-light)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        Start Exam
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
