import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'

export default function ExamInstructions() {
  const { id: examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => { loadExam() }, [examId])

  const loadExam = async () => {
    try {
      setLoading(true)
      const response = await examAPI.getExam(examId)
      setExam(response.data || response)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load exam instructions')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '16px' }}>
        <div className="spinner-border" style={{ width: '42px', height: '42px' }} role="status" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading instructions...</p>
      </div>
    </Layout>
  )

  if (error) return (
    <Layout>
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>← Back to Exams</button>
      </div>
    </Layout>
  )

  const stats = [
    { icon: '⏱️', label: 'Duration', value: `${exam?.duration_minutes} minutes` },
    { icon: '📋', label: 'Questions', value: exam?.total_questions },
    { icon: '🎯', label: 'Pass Mark', value: `${exam?.pass_mark}%` },
    { icon: '⭐', label: 'Marks / Q', value: exam?.marks_per_question },
    ...(exam?.negative_mark > 0 ? [{ icon: '⚠️', label: 'Negative Mark', value: `-${exam.negative_mark}` }] : []),
  ]

  const rules = [
    { icon: '📑', text: 'One question displayed at a time. Navigate freely with the panel.' },
    { icon: '⏰', text: 'Timer starts immediately when you click Start Exam.' },
    { icon: '🚫', text: 'Do not refresh or close the page during the exam.' },
    { icon: '🤖', text: 'Exam auto-submits when time expires — no action needed.' },
    { icon: '🔖', text: 'Mark questions for review and revisit them before submitting.' },
    { icon: '🔒', text: 'Only one attempt is allowed per exam.' },
  ]

  return (
    <Layout>
      <div className="container py-5 page-section" style={{ maxWidth: '760px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px', fontSize: '0.85rem' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Exams
        </button>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'inline-block', padding: '5px 12px',
            background: 'var(--primary-glow)', border: '1px solid rgba(79,110,247,0.3)',
            borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600,
            color: 'var(--primary-light)', marginBottom: '12px',
          }}>
            {exam?.subject_name || 'Exam'}
          </div>
          <h2 style={{ marginBottom: '8px' }}>{exam?.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {exam?.description || 'Please read the instructions carefully before starting the exam.'}
          </p>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px', marginBottom: '28px',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                {s.label}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Rules */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '24px', marginBottom: '24px',
        }}>
          <h5 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Important Rules
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{r.icon}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement + CTA */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '24px',
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '20px' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'var(--primary)', width: '16px', height: '16px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              I have read and understood all the instructions above. I am ready to start the exam.
            </span>
          </label>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/exam/${examId}`)}
              disabled={!agreed}
              style={{ flex: 1 }}
            >
              🚀 Start Exam
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
          {!agreed && (
            <p style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Please agree to the instructions above to continue.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
