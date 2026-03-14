import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'

const toLocalDateTimeInput = (date) => {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const getDefaultTimes = () => {
  const start = new Date()
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return {
    start_time: toLocalDateTimeInput(start),
    end_time: toLocalDateTimeInput(end)
  }
}

export default function ManageExams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [selectedExam, setSelectedExam] = useState(null)
  const [linkExam, setLinkExam] = useState(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [allQuestions, setAllQuestions] = useState([])
  const [linkSearch, setLinkSearch] = useState('')
  const [linkDifficulty, setLinkDifficulty] = useState('all')
  const [linkType, setLinkType] = useState('all')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([])
  const [linkSaving, setLinkSaving] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)
  const defaultTimes = getDefaultTimes()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    duration_minutes: 60,
    total_questions: 10,
    marks_per_question: 1,
    negative_mark: 0.25,
    pass_mark: 50,
    start_time: defaultTimes.start_time,
    end_time: defaultTimes.end_time,
    result_mode: 'immediate',
    selection_mode: 'manual',
    auto_easy: 0,
    auto_medium: 0,
    auto_hard: 0,
    is_published: false
  })

  useEffect(() => {
    loadExams()
    loadSubjects()
  }, [])

  const loadExams = async () => {
    try {
      setLoading(true)
      const response = await examAPI.listExams()
      const data = response.data || response
      setExams(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      console.error('Error loading exams:', err)
      setError('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      const response = await examAPI.listSubjects()
      const data = response.data || response
      setSubjects(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      console.error('Error loading subjects:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    const intFields = ['duration_minutes', 'total_questions', 'auto_easy', 'auto_medium', 'auto_hard']
    const floatFields = ['marks_per_question', 'negative_mark', 'pass_mark']

    let parsedValue = value
    if (intFields.includes(name)) {
      parsedValue = value === '' ? '' : parseInt(value, 10)
    } else if (floatFields.includes(name)) {
      parsedValue = value === '' ? '' : parseFloat(value)
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parsedValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    if (!formData.title || !formData.subject || !formData.start_time || !formData.end_time) {
      alert('Please fill in required fields')
      return
    }

    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      alert('End time must be after start time')
      return
    }

    if (formData.selection_mode === 'auto') {
      const totalAuto = (formData.auto_easy || 0) + (formData.auto_medium || 0) + (formData.auto_hard || 0)
      if (totalAuto <= 0) {
        alert('For auto mode, at least one of easy/medium/hard count must be greater than 0')
        return
      }
      if (totalAuto !== formData.total_questions) {
        alert('In auto mode, total questions must equal easy + medium + hard counts')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString()
      }

      if (selectedExam) {
        await examAPI.updateExam(selectedExam.id, payload)
        setError({ type: 'success', message: 'Exam updated successfully!' })
      } else {
        await examAPI.createExam(payload)
        setError({ type: 'success', message: 'Exam created successfully!' })
      }
      
      const times = getDefaultTimes()
      setFormData({
        title: '',
        description: '',
        subject: '',
        duration_minutes: 60,
        total_questions: 10,
        marks_per_question: 1,
        negative_mark: 0.25,
        pass_mark: 50,
        start_time: times.start_time,
        end_time: times.end_time,
        result_mode: 'immediate',
        selection_mode: 'manual',
        auto_easy: 0,
        auto_medium: 0,
        auto_hard: 0,
        is_published: false
      })
      setShowForm(false)
      setSelectedExam(null)
      loadExams()
    } catch (err) {
      console.error('Error saving exam:', err)
      const data = err.response?.data
      let message = 'Failed to save exam'

      if (typeof data === 'string') {
        message = data
      } else if (data?.detail) {
        message = data.detail
      } else if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        const firstVal = firstKey ? data[firstKey] : null
        if (Array.isArray(firstVal) && firstVal.length > 0) {
          message = `${firstKey}: ${firstVal[0]}`
        } else if (firstVal) {
          message = `${firstKey}: ${firstVal}`
        }
      }

      setError({ type: 'danger', message: message })
    } finally {
      setSubmitting(false)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleEdit = (exam) => {
    setSelectedExam(exam)
    setFormData({
      title: exam.title,
      description: exam.description || '',
      subject: exam.subject,
      duration_minutes: exam.duration_minutes,
      total_questions: exam.total_questions,
      marks_per_question: exam.marks_per_question,
      negative_mark: exam.negative_mark,
      pass_mark: exam.pass_mark,
      start_time: toLocalDateTimeInput(exam.start_time),
      end_time: toLocalDateTimeInput(exam.end_time),
      result_mode: exam.result_mode,
      selection_mode: exam.selection_mode,
      auto_easy: exam.auto_easy ?? 0,
      auto_medium: exam.auto_medium ?? 0,
      auto_hard: exam.auto_hard ?? 0,
      is_published: exam.is_published
    })
    setShowForm(true)
  }

  const handleDelete = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await examAPI.deleteExam(examId)
        alert('Exam deleted successfully!')
        loadExams()
      } catch (err) {
        alert('Failed to delete exam')
      }
    }
  }

  const openLinkQuestions = async (exam) => {
    setLinkExam(exam)
    setShowLinkModal(true)
    setLinkLoading(true)
    try {
      const response = await examAPI.listQuestions({ subject: exam.subject })
      const data = response.data || response
      const questions = Array.isArray(data) ? data : data.results || []
      setAllQuestions(questions)

      const existingIds = (exam.exam_questions || [])
        .map((eq) => {
          if (typeof eq.question === 'string') return eq.question
          return eq.question?.id
        })
        .filter(Boolean)
      setSelectedQuestionIds(existingIds)
      setLinkSearch('')
      setLinkDifficulty('all')
      setLinkType('all')
    } catch (err) {
      console.error('Error loading questions for linking:', err)
      alert('Failed to load question bank')
    } finally {
      setLinkLoading(false)
    }
  }

  const getFilteredLinkQuestions = () => {
    const q = linkSearch.trim().toLowerCase()
    return allQuestions.filter((item) => {
      const byDifficulty = linkDifficulty === 'all' || item.difficulty_level === linkDifficulty
      const byType = linkType === 'all' || item.question_type === linkType
      const bySearch = !q || item.question_text?.toLowerCase().includes(q) || item.topic_tag?.toLowerCase().includes(q)
      return byDifficulty && byType && bySearch
    })
  }

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    )
  }

  const saveLinkedQuestions = async () => {
    if (!linkExam) return
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least 1 question')
      return
    }

    if (selectedQuestionIds.length !== linkExam.total_questions) {
      alert(`This exam expects ${linkExam.total_questions} questions, but ${selectedQuestionIds.length} are selected.`)
      return
    }

    setLinkSaving(true)
    try {
      await examAPI.addQuestions(linkExam.id, selectedQuestionIds)
      alert('Questions linked successfully!')
      setShowLinkModal(false)
      setLinkExam(null)
      setSelectedQuestionIds([])
      loadExams()
    } catch (err) {
      console.error('Error linking questions:', err)
      const message = err.response?.data?.error || err.response?.data?.detail || 'Failed to link questions'
      alert(message)
    } finally {
      setLinkSaving(false)
    }
  }

  const runAutoSelect = async (examId) => {
    try {
      await examAPI.autoSelectQuestions(examId)
      alert('Questions auto-selected successfully!')
      loadExams()
    } catch (err) {
      console.error('Auto-select failed:', err)
      const message = err.response?.data?.error || err.response?.data?.detail || 'Auto-select failed'
      alert(message)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mt-5">
        <div className="row mb-4">
          <div className="col-md-8">
            <h2>Exam Management</h2>
            <p className="text-muted">Create and manage exams</p>
          </div>
          <div className="col-md-4 text-end">
            <button 
              className="btn btn-primary"
              onClick={() => {
                setShowForm(!showForm)
                if (showForm) setSelectedExam(null)
              }}
            >
              {showForm ? '✕ Cancel' : '+ Create Exam'}
            </button>
          </div>
        </div>

        {error && (
          <div className={`alert alert-${error.type || 'danger'} d-flex align-items-center justify-content-between`} style={{ marginBottom: '25px', borderRadius: '12px' }}>
            <span>{typeof error === 'string' ? error : error.message}</span>
            <button className="btn-close" style={{ filter: 'invert(1)' }} onClick={() => setError('')} />
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="card mb-5 border-0 shadow-sm" style={{ background: 'var(--bg-elevated)', borderRadius: '18px', overflow: 'hidden' }}>
            <div className="card-header border-0 py-3" style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)' }}>
              <h5 className="mb-0 fw-bold">{selectedExam ? '📝 Edit Exam' : '🎯 Create New Exam'}</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Title & Subject */}
                <div className="row mb-3">
                  <div className="col-md-8">
                    <label className="form-label">Exam Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter exam title"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Subject *</label>
                    <select
                      className="form-select"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Exam description (optional)"
                  />
                </div>

                {/* Exam Settings */}
                <div className="row mb-3">
                  <div className="col-md-3">
                    <label className="form-label">Duration (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleInputChange}
                      min="5"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Total Questions</label>
                    <input
                      type="number"
                      className="form-control"
                      name="total_questions"
                      value={formData.total_questions}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Marks per Question</label>
                    <input
                      type="number"
                      className="form-control"
                      name="marks_per_question"
                      value={formData.marks_per_question}
                      onChange={handleInputChange}
                      step="0.5"
                      min="0"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Pass Mark (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="pass_mark"
                      value={formData.pass_mark}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {/* Scheduling */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">End Time *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Negative Mark */}
                <div className="row mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Negative Mark</label>
                    <input
                      type="number"
                      className="form-control"
                      name="negative_mark"
                      value={formData.negative_mark}
                      onChange={handleInputChange}
                      step="0.25"
                      min="0"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Result Mode</label>
                    <select
                      className="form-select"
                      name="result_mode"
                      value={formData.result_mode}
                      onChange={handleInputChange}
                    >
                      <option value="immediate">Immediate</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Selection Mode</label>
                    <select
                      className="form-select"
                      name="selection_mode"
                      value={formData.selection_mode}
                      onChange={handleInputChange}
                    >
                      <option value="manual">Manual</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                {formData.selection_mode === 'auto' && (
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Auto Easy</label>
                      <input
                        type="number"
                        className="form-control"
                        name="auto_easy"
                        value={formData.auto_easy}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Auto Medium</label>
                      <input
                        type="number"
                        className="form-control"
                        name="auto_medium"
                        value={formData.auto_medium}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Auto Hard</label>
                      <input
                        type="number"
                        className="form-control"
                        name="auto_hard"
                        value={formData.auto_hard}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {/* Publish */}
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="is_published"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="is_published">
                      Publish this exam (visible to students)
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary px-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : selectedExam ? 'Update Exam' : 'Create Exam'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-4"
                    onClick={() => {
                      setShowForm(false)
                      setSelectedExam(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Exams List */}
        <div className="row">
          <div className="col-12">
            <h4 style={{ marginBottom: '20px', fontWeight: 700 }}>Active Exams ({exams.length})</h4>
            {exams.length === 0 ? (
              <div className="alert alert-info">
                No exams yet. Create your first exam!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Exam Title</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Details</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map(exam => (
                      <tr key={exam.id} className="align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{exam.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px' }}>{exam.description?.slice(0, 100)}</div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'var(--primary-glow)', color: 'var(--primary-light)' }}>
                              {exam.duration_minutes}m
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                              {exam.total_questions} Qs
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'var(--success-bg)', color: 'var(--success)' }}>
                              {exam.pass_mark}% Pass
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="badge" style={{ 
                            background: exam.is_published ? 'var(--success-bg)' : 'rgba(255,255,255,0.05)', 
                            color: exam.is_published ? 'var(--success)' : 'var(--text-muted)',
                            border: '1px solid ' + (exam.is_published ? 'transparent' : 'var(--border)'),
                            padding: '6px 12px', fontWeight: 600
                          }}>
                            {exam.is_published ? 'Public' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(exam)}
                              style={{ padding: '4px 12px' }}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-info"
                              onClick={() => (exam.selection_mode === 'auto' ? runAutoSelect(exam.id) : openLinkQuestions(exam))}
                              style={{ padding: '4px 12px' }}
                            >
                              {exam.selection_mode === 'auto' ? 'Auto-Select' : 'Questions'}
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(exam.id)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {showLinkModal && (
          <div className="card mt-4 border-info">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Link Questions: {linkExam?.title}</h5>
              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => {
                  setShowLinkModal(false)
                  setLinkExam(null)
                  setSelectedQuestionIds([])
                }}
              >
                Close
              </button>
            </div>
            <div className="card-body">
              {linkLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading questions...</span>
                  </div>
                </div>
              ) : allQuestions.length === 0 ? (
                <div className="alert alert-warning mb-0">
                  No questions found for this subject. Create questions first.
                </div>
              ) : (
                <>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Search question/topic"
                        value={linkSearch}
                        onChange={(e) => setLinkSearch(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <select className="form-select form-select-sm" value={linkDifficulty} onChange={(e) => setLinkDifficulty(e.target.value)}>
                        <option value="all">All Difficulty</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <select className="form-select form-select-sm" value={linkType} onChange={(e) => setLinkType(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="mcq">MCQ</option>
                        <option value="true_false">True/False</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <strong>Selected:</strong> {selectedQuestionIds.length}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelectedQuestionIds(getFilteredLinkQuestions().map((q) => q.id))}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelectedQuestionIds([])}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table className="table table-sm table-hover">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '60px' }}>Pick</th>
                          <th>Question</th>
                          <th>Type</th>
                          <th>Difficulty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredLinkQuestions().map((q) => (
                          <tr key={q.id}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedQuestionIds.includes(q.id)}
                                onChange={() => toggleQuestionSelection(q.id)}
                              />
                            </td>
                            <td>{q.question_text}</td>
                            <td>{q.question_type === 'mcq' ? 'MCQ' : 'T/F'}</td>
                            <td>{q.difficulty_level}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-success"
                      disabled={linkSaving}
                      onClick={saveLinkedQuestions}
                    >
                      {linkSaving ? 'Linking...' : 'Save Linked Questions'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
