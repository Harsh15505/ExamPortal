import { useParams, useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Results() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedQuestion, setExpandedQuestion] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => { loadResults() }, [attemptId])

  const loadResults = async () => {
    try {
      setLoading(true)
      setError('')
      const resultResponse = await examAPI.getResult(attemptId)
      setResult(resultResponse.data || resultResponse)
      const attemptResponse = await examAPI.getAttempt(attemptId)
      setAttempt(attemptResponse.data || attemptResponse)
    } catch (err) {
      console.error('Failed to load results:', err)
      setError({ type: 'danger', message: err.response?.data?.detail || err.message || 'Failed to load results' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '16px' }}>
        <div className="spinner-border" style={{ width: '42px', height: '42px' }} role="status" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your results...</p>
      </div>
    </Layout>
  )

  if (error) return (
    <Layout>
      <div className="container mt-5" style={{ maxWidth: '560px' }}>
        <div className="alert alert-danger d-flex align-items-center justify-content-between" style={{ borderRadius: '12px', padding: '16px 20px' }}>
          <span>{error.message || error}</span>
          <button className="btn-close" style={{ filter: 'invert(1)' }} onClick={() => setError(null)} />
        </div>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/')}>← Back to Home</button>
      </div>
    </Layout>
  )

  const isPass = result?.is_pass
  const percentage = parseFloat(result?.percentage || 0).toFixed(1)
  const marksPerQ = result?.max_score && attempt?.answers?.length
    ? (result.max_score / attempt.answers.length).toFixed(1) : '—'

  const statCards = [
    { icon: '✅', label: 'Correct', value: result?.total_correct ?? 0, color: 'var(--success)', bg: 'var(--success-bg)' },
    { icon: '❌', label: 'Wrong',   value: result?.total_wrong   ?? 0, color: 'var(--danger)',  bg: 'var(--danger-bg)' },
    { icon: '⏭️', label: 'Skipped', value: result?.total_skipped ?? 0, color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { icon: '📊', label: 'Score',   value: `${result?.score_obtained ?? 0}/${result?.max_score ?? 0}`, color: 'var(--primary-light)', bg: 'var(--primary-glow)' },
  ]
  
  const generatePDF = async () => {
    if (!reportRef.current) return
    setIsExporting(true)
    try {
      // Temporarily expand all questions for the PDF
      const currentExpanded = expandedQuestion
      setExpandedQuestion('all') 
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f1117' // Match our dark theme
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`Exam_Result_${attempt?.student?.username || 'Student'}_${attempt?.exam?.title || 'Report'}.pdf`)
      
      // Restore state
      setExpandedQuestion(currentExpanded)
    } catch (err) {
      console.error('Failed to generate PDF', err)
      setError({ type: 'danger', message: "Failed to generate PDF report. Please try again." })
    } finally {
      setIsExporting(false)
      setTimeout(() => setError(null), 5000)
    }
}

  return (
    <Layout>
      <div className="container py-5 page-section" style={{ maxWidth: '800px' }} ref={reportRef}>

        {/* Score Hero */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '40px 32px', textAlign: 'center', marginBottom: '24px',
        }}>
          {/* Pass/Fail badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '100px', marginBottom: '24px',
            background: isPass ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${isPass ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: isPass ? 'var(--success)' : 'var(--danger)',
            fontWeight: 700, fontSize: '0.9rem',
          }}>
            {isPass ? '🏆 Passed' : '📝 Failed'}
          </div>

          {/* Score circle */}
          <div className={`score-circle ${isPass ? 'pass' : 'fail'}`} style={{ marginBottom: '16px' }}>
            {percentage}
            <small>%</small>
          </div>

          <h3 style={{ marginBottom: '6px', fontWeight: 700 }}>
            {isPass ? 'Congratulations! 🎉' : 'Better luck next time'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            You scored <strong style={{ color: 'var(--text-primary)' }}>{result?.score_obtained}</strong> out of <strong style={{ color: 'var(--text-primary)' }}>{result?.max_score}</strong> marks
          </p>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {statCards.map(s => (
              <div key={s.label} style={{
                padding: '12px 20px', borderRadius: '12px',
                background: s.bg, border: `1px solid ${s.color}30`,
                minWidth: '90px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer Review */}
        {attempt && (
          <div>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Answer Review
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attempt.answers?.map((answer, index) => {
                const question = answer.exam_question.question
                // Use shuffled_answer when available (correct for this attempt), fallback to original
                const correctAnswer = answer.exam_question.shuffled_answer || question.correct_answer
                const isCorrect = answer.answer === correctAnswer
                const isOpen = expandedQuestion === 'all' || expandedQuestion === index

                const statusColor = isCorrect ? 'var(--success)' : answer.answer ? 'var(--danger)' : 'var(--warning)'
                const statusBg    = isCorrect ? 'var(--success-bg)' : answer.answer ? 'var(--danger-bg)' : 'var(--warning-bg)'
                const statusLabel = isCorrect ? '✓ Correct' : answer.answer ? '✗ Wrong' : '— Skipped'

                return (
                  <div key={index} style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: '12px', overflow: 'hidden',
                  }}>
                    <button
                      style={{
                        width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                        background: isOpen ? 'var(--bg-elevated)' : 'transparent',
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '16px 20px', transition: 'background 0.2s ease',
                      }}
                      onClick={() => setExpandedQuestion(isOpen ? null : index)}
                    >
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem',
                        fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px',
                        background: statusBg, color: statusColor,
                        border: `1px solid ${statusColor}40`,
                      }}>
                        {statusLabel}
                      </span>
                      <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        <strong>Q{index + 1}.</strong> {question.question_text}
                      </span>
                      <svg
                        width="14" height="14"
                        style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '4px', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>

                    {isOpen && (
                      <div style={{
                        padding: '16px 20px', borderTop: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                      }}>
                        {/* Your answer */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Your Answer</div>
                          {answer.answer ? (
                            <div style={{
                              padding: '12px 16px', borderRadius: '10px',
                              background: isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)',
                              border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                              color: isCorrect ? 'var(--success)' : 'var(--danger)',
                              fontSize: '0.875rem',
                            }}>
                              <strong>{answer.answer}.</strong>{' '}
                              {question[`option_${answer.answer.toLowerCase()}`] || answer.answer}
                            </div>
                          ) : (
                            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--warning-bg)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--warning)', fontSize: '0.875rem' }}>
                              <em>No answer — question was skipped</em>
                            </div>
                          )}
                        </div>

                        {/* Correct answer — only shown for wrong/skipped */}
                        {!isCorrect && (
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Correct Answer</div>
                            <div style={{
                              padding: '12px 16px', borderRadius: '10px',
                              background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.3)',
                              color: 'var(--success)', fontSize: '0.875rem',
                            }}>
                              <strong>{correctAnswer}.</strong>{' '}
                              {question[`option_${correctAnswer.toLowerCase()}`] || correctAnswer}
                            </div>
                          </div>
                        )}

                        {/* Meta badges */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{
                            padding: '3px 9px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize',
                            background: { easy: 'var(--success-bg)', medium: 'var(--warning-bg)', hard: 'var(--danger-bg)' }[question.difficulty_level] || 'var(--bg-base)',
                            color:      { easy: 'var(--success)',    medium: 'var(--warning)',    hard: 'var(--danger)'    }[question.difficulty_level] || 'var(--text-secondary)',
                          }}>
                            {question.difficulty_level}
                          </span>
                          <span style={{ padding: '3px 9px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            {marksPerQ} mark{marksPerQ !== '1.0' ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }} data-html2canvas-ignore>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            ← Back to Exams
          </button>
          <button className="btn btn-outline-secondary" onClick={generatePDF} disabled={isExporting}>
            {isExporting ? 'Generating PDF...' : '📄 Download PDF Report'}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => window.print()}>
            🖨️ Print Results
          </button>
        </div>
      </div>
    </Layout>
  )
}
