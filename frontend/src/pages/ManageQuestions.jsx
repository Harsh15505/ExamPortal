import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'

export default function ManageQuestions() {
  const [questions, setQuestions] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterType, setFilterType] = useState('all')
  
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'mcq',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    difficulty_level: 'easy',
    topic_tag: '',
    subject: ''
  })

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'mcq',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      difficulty_level: 'easy',
      topic_tag: '',
      subject: ''
    })
    setEditingQuestionId(null)
  }

  useEffect(() => {
    loadQuestions()
    loadSubjects()
  }, [])

  useEffect(() => {
    const q = search.trim().toLowerCase()
    const list = questions.filter((item) => {
      const bySubject = filterSubject === 'all' || item.subject === filterSubject
      const byDifficulty = filterDifficulty === 'all' || item.difficulty_level === filterDifficulty
      const byType = filterType === 'all' || item.question_type === filterType
      const bySearch =
        !q ||
        item.question_text?.toLowerCase().includes(q) ||
        item.topic_tag?.toLowerCase().includes(q)
      return bySubject && byDifficulty && byType && bySearch
    })
    setFilteredQuestions(list)
  }, [questions, search, filterSubject, filterDifficulty, filterType])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const response = await examAPI.listQuestions()
      const data = response.data || response
      setQuestions(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      console.error('Error loading questions:', err)
      setError('Failed to load questions')
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
    const { name, value } = e.target

    if (name === 'question_type') {
      if (value === 'true_false') {
        setFormData(prev => ({
          ...prev,
          question_type: value,
          option_a: 'True',
          option_b: 'False',
          option_c: '',
          option_d: '',
          correct_answer: prev.correct_answer === 'T' || prev.correct_answer === 'F' ? prev.correct_answer : 'T'
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          question_type: value,
          option_a: prev.option_a === 'True' ? '' : prev.option_a,
          option_b: prev.option_b === 'False' ? '' : prev.option_b,
          correct_answer: ['A', 'B', 'C', 'D'].includes(prev.correct_answer) ? prev.correct_answer : 'A'
        }))
      }
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    const isMCQ = formData.question_type === 'mcq'
    const requiredOptionsValid = isMCQ
      ? formData.option_a && formData.option_b && formData.option_c && formData.option_d
      : true

    if (!formData.question_text || !formData.subject || !formData.topic_tag || !requiredOptionsValid) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        option_a: formData.question_type === 'true_false' ? 'True' : formData.option_a,
        option_b: formData.question_type === 'true_false' ? 'False' : formData.option_b,
        option_c: formData.question_type === 'true_false' ? '' : formData.option_c,
        option_d: formData.question_type === 'true_false' ? '' : formData.option_d
      }

      if (editingQuestionId) {
        await examAPI.updateQuestion(editingQuestionId, payload)
        setError({ type: 'success', message: 'Question updated successfully!' })
      } else {
        await examAPI.createQuestion(payload)
        setError({ type: 'success', message: 'Question created successfully!' })
      }

      resetForm()
      setShowForm(false)
      loadQuestions()
    } catch (err) {
      console.error('Error saving question:', err)
      const data = err.response?.data
      let message = 'Failed to save question'

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

  const handleEdit = (question) => {
    setEditingQuestionId(question.id)
    setFormData({
      question_text: question.question_text || '',
      question_type: question.question_type || 'mcq',
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      correct_answer: question.correct_answer || (question.question_type === 'true_false' ? 'T' : 'A'),
      difficulty_level: question.difficulty_level || 'easy',
      topic_tag: question.topic_tag || '',
      subject: question.subject || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (questionId) => {
    if (!window.confirm('Delete this question?')) return

    try {
      await examAPI.deleteQuestion(questionId)
      alert('Question deleted successfully!')
      if (editingQuestionId === questionId) {
        resetForm()
        setShowForm(false)
      }
      loadQuestions()
    } catch (err) {
      console.error('Error deleting question:', err)
      alert(err.response?.data?.detail || 'Failed to delete question')
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
            <h2>Question Management</h2>
            <p className="text-muted">Create and manage exam questions</p>
          </div>
          <div className="col-md-4 text-end">
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (showForm) {
                  resetForm()
                }
                setShowForm(!showForm)
              }}
            >
              {showForm ? '✕ Cancel' : '+ Create Question'}
            </button>
          </div>
        </div>

        {error && (
          <div className={`alert alert-${error.type || 'danger'} d-flex align-items-center justify-content-between`} style={{ marginBottom: '25px', borderRadius: '12px' }}>
            <span>{typeof error === 'string' ? error : error.message}</span>
            <button className="btn-close" style={{ filter: 'invert(1)' }} onClick={() => setError('')} />
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="card mb-5 border-0 shadow-sm" style={{ background: 'var(--bg-elevated)', borderRadius: '18px', overflow: 'hidden' }}>
            <div className="card-header border-0 py-3" style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)' }}>
              <h5 className="mb-0 fw-bold">{editingQuestionId ? '📝 Edit Question' : '✨ Create New Question'}</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Question Text */}
                <div className="mb-3">
                  <label className="form-label">Question Text *</label>
                  <textarea
                    className="form-control"
                    name="question_text"
                    value={formData.question_text}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter the question"
                    required
                  />
                </div>

                {/* Subject & Type Row */}
                <div className="row">
                  <div className="col-md-6 mb-3">
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Question Type</label>
                    <select
                      className="form-select"
                      name="question_type"
                      value={formData.question_type}
                      onChange={handleInputChange}
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                    </select>
                  </div>
                </div>

                {/* Options */}
                {formData.question_type === 'mcq' ? (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Option A *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="option_a"
                          value={formData.option_a}
                          onChange={handleInputChange}
                          placeholder="Enter option A"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Option B *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="option_b"
                          value={formData.option_b}
                          onChange={handleInputChange}
                          placeholder="Enter option B"
                          required
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Option C *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="option_c"
                          value={formData.option_c}
                          onChange={handleInputChange}
                          placeholder="Enter option C"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Option D *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="option_d"
                          value={formData.option_d}
                          onChange={handleInputChange}
                          placeholder="Enter option D"
                          required
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="alert alert-info mb-3">
                    True/False questions use fixed options: True and False.
                  </div>
                )}

                {/* Correct Answer & Difficulty */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Correct Answer</label>
                    <select
                      className="form-select"
                      name="correct_answer"
                      value={formData.correct_answer}
                      onChange={handleInputChange}
                    >
                      {formData.question_type === 'mcq' ? (
                        <>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </>
                      ) : (
                        <>
                          <option value="T">True</option>
                          <option value="F">False</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Difficulty Level</label>
                    <select
                      className="form-select"
                      name="difficulty_level"
                      value={formData.difficulty_level}
                      onChange={handleInputChange}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Topic Tag */}
                <div className="mb-3">
                  <label className="form-label">Topic Tag *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="topic_tag"
                    value={formData.topic_tag}
                    onChange={handleInputChange}
                    placeholder="e.g., algebra, geometry, etc."
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary px-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Create Question'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary px-4"
                    onClick={() => {
                      resetForm()
                      setShowForm(false)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Question Bank ({filteredQuestions.length})</h4>
              <div className="d-flex gap-2" style={{ minWidth: '700px' }}>
                <input
                  className="form-control form-control-sm"
                  placeholder="Search by question or topic"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select className="form-select form-select-sm" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                  <option value="all">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select className="form-select form-select-sm" value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                  <option value="all">All Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select className="form-select form-select-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="mcq">MCQ</option>
                  <option value="true_false">True/False</option>
                </select>
              </div>
            </div>
            {filteredQuestions.length === 0 ? (
              <div className="alert alert-info">
                No questions yet. Create your first question!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Difficulty</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                      <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map(q => (
                      <tr key={q.id} className="align-middle" style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s ease' }}>
                        <td style={{ padding: '20px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px', lineHeight: '1.4' }}>
                            {q.question_text}
                          </div>
                          {q.topic_tag && (
                            <span style={{ 
                              fontSize: '0.72rem', 
                              color: 'var(--text-muted)', 
                              background: 'rgba(255,255,255,0.05)', 
                              padding: '2px 8px', 
                              borderRadius: '4px',
                              border: '1px solid var(--border)'
                            }}>
                              Tag: {q.topic_tag}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="badge" style={{ 
                            background: 'var(--info-bg)', 
                            color: 'var(--info)', 
                            border: '1px solid var(--info-bg)',
                            fontWeight: 600,
                            padding: '6px 10px'
                          }}>
                            {q.question_type === 'mcq' ? 'MCQ' : 'T/F'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="badge" style={{ 
                            background: q.difficulty_level === 'easy' ? 'var(--success-bg)' : 
                                       q.difficulty_level === 'medium' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                            color: q.difficulty_level === 'easy' ? 'var(--success)' : 
                                   q.difficulty_level === 'medium' ? 'var(--warning)' : 'var(--danger)',
                            border: '1px solid transparent',
                            fontWeight: 600,
                            padding: '6px 10px',
                            textTransform: 'capitalize'
                          }}>
                            {q.difficulty_level}
                          </span>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {q.subject_name}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(q)}
                              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(q.id)}
                              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                            >
                              Delete
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
      </div>
    </Layout>
  )
}
