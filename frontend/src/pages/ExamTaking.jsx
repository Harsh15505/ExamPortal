import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'

export default function ExamTaking() {
  const { id: examId } = useParams()
  const navigate = useNavigate()
  const examLoadedRef = useRef(false)
  const timerRef = useRef(null)
  const submittingRef = useRef(false)
  
  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(null)
  const [answers, setAnswers] = useState({})
  const [markedForReview, setMarkedForReview] = useState(new Set())
  const [visited, setVisited] = useState(new Set())

  // Load exam and start attempt
  useEffect(() => {
    if (!examLoadedRef.current) {
      examLoadedRef.current = true
      loadExam()
    }
  }, [examId])

  // Stable auto-submit handler (no confirm dialog for auto-submit)
  const autoSubmitExam = useCallback(async (attemptId) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const submitResponse = await examAPI.submitExam(attemptId)
      const submittedAttempt = submitResponse.data || submitResponse
      navigate(`/results/${submittedAttempt.id}`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit exam')
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [navigate])

  // Timer countdown — stable single interval
  useEffect(() => {
    if (timeLeft === null) return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, []) // run once when timeLeft is first set

  // Watch for timer hitting 0 to trigger auto-submit
  const attemptRef = useRef(null)
  useEffect(() => { attemptRef.current = attempt }, [attempt])
  useEffect(() => {
    if (timeLeft === 0 && attemptRef.current) {
      autoSubmitExam(attemptRef.current.id)
    }
  }, [timeLeft, autoSubmitExam])

  const loadExam = async () => {
    try {
      setLoading(true)
      setError('')
      
      const examResponse = await examAPI.getExam(examId)
      const examData = examResponse.data || examResponse
      setExam(examData)
      
      // Start exam attempt
      const attemptResponse = await examAPI.startExam(examId)
      const attemptData = attemptResponse.data || attemptResponse
      setAttempt(attemptData)
      
      // Initialize timer
      setTimeLeft(examData.duration_minutes * 60)
      
      // Initialize answers
      const initialAnswers = {}
      const initialReview = new Set()
      const initialVisited = new Set([0])
      
      attemptData.answers?.forEach((sa, idx) => {
        if (sa.answer) {
          initialAnswers[sa.exam_question.id] = sa.answer
        }
        if (sa.is_marked_for_review) {
          initialReview.add(idx)
        }
      })
      
      setAnswers(initialAnswers)
      setMarkedForReview(initialReview)
      setVisited(initialVisited)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg || 'Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = attempt?.answers?.[currentQuestionIndex]
  const totalQuestions = attempt?.answers?.length || 0

  const handleAnswerChange = (option) => {
    const examQId = currentQuestion.exam_question.id
    setAnswers(prev => ({
      ...prev,
      [examQId]: option
    }))
    
    // Submit answer to server
    submitAnswer(examQId, option)
  }

  const submitAnswer = async (examQId, option) => {
    try {
      await examAPI.submitAnswer(attempt.id, examQId, option)
    } catch (err) {
      console.error('Failed to submit answer:', err)
    }
  }

  const handleMarkForReview = async () => {
    const isCurrentlyMarked = markedForReview.has(currentQuestionIndex)
    
    try {
      if (isCurrentlyMarked) {
        setMarkedForReview(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentQuestionIndex)
          return newSet
        })
      } else {
        setMarkedForReview(prev => new Set([...prev, currentQuestionIndex]))
      }
      
      await examAPI.markForReview(attempt.id, currentQuestion.exam_question.id)
    } catch (err) {
      console.error('Failed to mark for review:', err)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setVisited(prev => new Set([...prev, currentQuestionIndex + 1]))
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleGoToQuestion = (index) => {
    setVisited(prev => new Set([...prev, index]))
    setCurrentQuestionIndex(index)
  }

  const handleSubmitExam = async () => {
    if (submittingRef.current) return
    
    // Only manual submit shows a confirmation dialog
    if (!window.confirm('Are you sure you want to submit the exam? You cannot change answers after submission.')) {
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    try {
      const submitResponse = await examAPI.submitExam(attempt.id)
      const submittedAttempt = submitResponse.data || submitResponse
      navigate(`/results/${submittedAttempt.id}`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit exam')
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const getQuestionStatus = (index) => {
    if (answers[attempt?.answers?.[index]?.exam_question?.id]) return 'answered'
    if (markedForReview.has(index)) return 'review'
    if (visited.has(index)) return 'visited'
    return 'pending'
  }

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const timerClass = timeLeft <= 60 ? 'timer-danger' : timeLeft <= 300 ? 'timer-warning' : 'timer-normal'

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '16px' }}>
        <div className="spinner-border" style={{ width: '42px', height: '42px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Starting your exam...</p>
      </div>
    </Layout>
  )

  if (error) return (
    <Layout>
      <div className="container mt-5" style={{ maxWidth: '560px' }}>
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>← Back to Exams</button>
      </div>
    </Layout>
  )

  const navStatusClass = { answered: 'qnav-answered', review: 'qnav-review', visited: 'qnav-visited', pending: 'qnav-pending' }

  return (
    <Layout>
      {/* Sticky Exam Header */}
      <div className="exam-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700 }}>{exam?.title}</h5>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Progress */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Progress
              </div>
              <div style={{
                width: '120px', height: '6px', background: 'var(--bg-elevated)',
                borderRadius: '3px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${(Object.keys(answers).length / totalQuestions) * 100}%`,
                  background: 'linear-gradient(90deg, var(--primary), #7c3aed)',
                  transition: 'width 0.3s ease', borderRadius: '3px',
                }} />
              </div>
            </div>
            {/* Timer */}
            <div style={{
              padding: '8px 16px',
              background: timeLeft <= 60 ? 'var(--danger-bg)' : timeLeft <= 300 ? 'var(--warning-bg)' : 'var(--bg-elevated)',
              border: `1px solid ${timeLeft <= 60 ? 'rgba(239,68,68,0.3)' : timeLeft <= 300 ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
              borderRadius: '10px',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 600, letterSpacing: '0.05em' }}>TIME LEFT</div>
              <div className={timerClass} style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {formatTime(timeLeft || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', padding: '24px 16px', gap: '24px' }}>
        {/* Question Panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentQuestion && (
            <div style={{ animation: 'fadeIn 0.25s ease both' }}>
              {/* Question Card */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '28px', marginBottom: '16px',
              }}>
                {/* Question meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                    background: 'var(--primary-glow)', color: 'var(--primary-light)',
                    border: '1px solid rgba(79,110,247,0.3)',
                  }}>Q{currentQuestionIndex + 1}</span>
                  {(() => {
                    const diff = currentQuestion.exam_question.question.difficulty_level
                    const dc = { easy: { bg: 'var(--success-bg)', color: 'var(--success)', border: 'rgba(34,197,94,0.3)' }, medium: { bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'rgba(245,158,11,0.3)' }, hard: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: 'rgba(239,68,68,0.3)' } }
                    const c = dc[diff] || dc.medium
                    return (
                      <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: 'capitalize' }}>{diff}</span>
                    )
                  })()}
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    +{exam?.marks_per_question} mark{exam?.marks_per_question !== 1 ? 's' : ''}
                    {exam?.negative_mark > 0 && <> · <span style={{ color: 'var(--danger)' }}>-{exam.negative_mark}</span></>}
                  </span>
                </div>

                {/* Question text */}
                <h4 style={{ fontWeight: 600, lineHeight: 1.5, marginBottom: '24px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {currentQuestion.exam_question.question.question_text}
                </h4>

                {/* Options */}
                <div>
                  {currentQuestion.exam_question.question.question_type === 'mcq' ? (
                    ['a', 'b', 'c', 'd'].map(opt => {
                      const optionText = currentQuestion.exam_question.question[`option_${opt}`]
                      if (!optionText) return null
                      const isSelected = answers[currentQuestion.exam_question.id] === opt.toUpperCase()
                      return (
                        <div
                          key={opt}
                          className={`option-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleAnswerChange(opt.toUpperCase())}
                        >
                          <div className="option-letter">{opt.toUpperCase()}</div>
                          <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', flex: 1 }}>
                            {optionText}
                          </span>
                          {isSelected && (
                            <svg width="16" height="16" style={{ color: 'var(--primary)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    ['true', 'false'].map(opt => {
                      const val = opt === 'true' ? 'T' : 'F'
                      const isSelected = answers[currentQuestion.exam_question.id] === val
                      return (
                        <div
                          key={opt}
                          className={`option-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleAnswerChange(val)}
                        >
                          <div className="option-letter">{val}</div>
                          <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', textTransform: 'capitalize', flex: 1 }}>
                            {opt}
                          </span>
                          {isSelected && (
                            <svg width="16" height="16" style={{ color: 'var(--primary)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Action Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn btn-sm ${markedForReview.has(currentQuestionIndex) ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={handleMarkForReview}
                    style={{ fontSize: '0.8rem' }}
                  >
                    🔖 {markedForReview.has(currentQuestionIndex) ? 'Marked' : 'Mark for Review'}
                  </button>
                  {answers[currentQuestion.exam_question.id] && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setAnswers(prev => {
                        const n = { ...prev }
                        delete n[currentQuestion.exam_question.id]
                        return n
                      })}
                      style={{ fontSize: '0.8rem' }}
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >← Prev</button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleNext}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                  >Next →</button>
                  <button
                    className="btn btn-success"
                    onClick={handleSubmitExam}
                    disabled={submitting}
                    style={{ padding: '8px 20px', fontWeight: 600 }}
                  >
                    {submitting ? '⏳ Submitting...' : '✓ Submit Exam'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigator Sidebar */}
        <div style={{ width: '220px', flexShrink: 0 }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '18px', position: 'sticky', top: '120px',
          }}>
            <h6 style={{ marginBottom: '14px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Question Navigator
            </h6>

            {/* Summary bar */}
            <div style={{ marginBottom: '14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="stat-chip" style={{ fontSize: '0.7rem', color: 'var(--success)' }}>✓ {Object.keys(answers).length}</span>
              <span className="stat-chip" style={{ fontSize: '0.7rem', color: 'var(--warning)' }}>🔖 {markedForReview.size}</span>
              <span className="stat-chip" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>— {totalQuestions - Object.keys(answers).length}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginBottom: '16px' }}>
              {attempt?.answers?.map((_, index) => {
                const status = getQuestionStatus(index)
                const isCurrent = index === currentQuestionIndex
                return (
                  <button
                    key={index}
                    className={`qnav-btn ${navStatusClass[status]} ${isCurrent ? 'current' : ''}`}
                    onClick={() => handleGoToQuestion(index)}
                    title={`Question ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { cls: 'qnav-answered', label: 'Answered' },
                { cls: 'qnav-review',   label: 'Marked' },
                { cls: 'qnav-visited',  label: 'Visited' },
                { cls: 'qnav-pending',  label: 'Not visited' },
              ].map(({ cls, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className={`qnav-btn ${cls}`} style={{ width: '20px', height: '20px', fontSize: '0', borderRadius: '5px', pointerEvents: 'none' }} />
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

