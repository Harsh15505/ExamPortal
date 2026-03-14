import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { examAPI } from '../api/exams'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts'

export default function AdminAnalytics() {
  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [scoreDistribution, setScoreDistribution] = useState([])
  const [topicPerformance, setTopicPerformance] = useState([])
  const [difficultyPerformance, setDifficultyPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadExams() }, [])

  const loadExams = async () => {
    try {
      setLoading(true)
      const res = await examAPI.listExams()
      const data = res.data || res
      const examList = Array.isArray(data) ? data : data.results || []
      setExams(examList)
      if (examList.length > 0) {
        setSelectedExamId(examList[0].id)
        await loadAnalytics(examList[0].id)
      }
    } catch (err) {
      setError('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async (examId) => {
    if (!examId) return
    try {
      setLoadingAnalytics(true)
      setError('')
      const [summaryRes, scoreRes, topicRes, difficultyRes] = await Promise.all([
        examAPI.getAnalytics(examId),
        examAPI.getScoreDistribution(examId),
        examAPI.getTopicPerformance(examId),
        examAPI.getDifficultyPerformance(examId),
      ])

      setAnalytics(summaryRes.data || summaryRes)

      // Format score distribution for Recharts
      const distData = scoreRes.data || scoreRes
      const distBuckets = Array.isArray(distData) ? distData : distData.distribution || {}
      if (!Array.isArray(distBuckets)) {
        // Convert dict to array if backend returns `{ "0-20": 5, "21-40": 2 }`
        const mappedDist = Object.entries(distBuckets).map(([range, count]) => ({ range, count }))
        setScoreDistribution(mappedDist)
      } else {
        setScoreDistribution(distBuckets) // if already array
      }

      // Format topic & difficulty
      const topData = topicRes.data || topicRes
      setTopicPerformance(Array.isArray(topData) ? topData : topData.topics || [])

      const diffData = difficultyRes.data || difficultyRes
      setDifficultyPerformance(Array.isArray(diffData) ? diffData : diffData.difficulty || [])
    } catch (err) {
      setError(err.response?.data?.error || 'No analytics data available for this exam yet')
      setAnalytics(null)
      setScoreDistribution([])
      setTopicPerformance([])
      setDifficultyPerformance([])
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const handleExamChange = (e) => {
    const examId = e.target.value
    setSelectedExamId(examId)
    void loadAnalytics(examId)
  }

  const handleExportCSV = () => {
    if (!analytics) return
    const exam = exams.find(e => e.id === selectedExamId)
    const examName = exam ? exam.title : 'Analytics'

    // Manual CSV generation to avoid "Buffer is not defined" library errors in browser
    let csvContent = `Report,${examName} Analytics\n`
    csvContent += `Generated At,${new Date().toLocaleString()}\n\n`
    
    csvContent += `--- KEY METRICS ---\n`
    csvContent += `Total Attempts,${analytics.total_attempts || 0}\n`
    csvContent += `Submitted,${analytics.total_submitted || 0}\n`
    csvContent += `Average Score,${Number(analytics.average_score || 0).toFixed(1)}\n`
    csvContent += `Pass Rate %,${Number(analytics.pass_rate || 0).toFixed(1)}\n\n`

    csvContent += `--- SCORE DISTRIBUTION ---\nRange,Count\n`
    scoreDistribution.forEach(b => {
      csvContent += `"${b.range}",${b.count}\n`
    })

    csvContent += `\n--- ACCURACY BY DIFFICULTY ---\nDifficulty,Percentage %\n`
    difficultyPerformance.forEach(d => {
      csvContent += `${d.difficulty},${d.percentage}\n`
    })

    csvContent += `\n--- TOPIC MASTERY ---\nTopic,Pass Rate %\n`
    topicPerformance.forEach(t => {
      csvContent += `"${t.topic}",${t.percentage}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${examName.replace(/[^a-z0-9]/gi, '_')}_Analytics.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- Chart Tooltips & Colors ---
  const GlassTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)', color: 'var(--text-primary)'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '6px' }}>{label || payload[0].name}</div>
          {payload.map((entry, index) => (
            <div key={index} style={{ fontSize: '0.85rem', color: entry.color || 'var(--primary-light)' }}>
              {entry.name}: <strong style={{ color: 'var(--text-primary)' }}>{entry.value}{entry.dataKey === 'percentage' ? '%' : ''}</strong>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--info)']

  if (loading) return (
    <Layout>
      <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner-border" style={{ width: '42px', height: '42px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading analytics dashboard...</p>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="container-fluid px-4 py-4 page-section" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header & Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontWeight: 800, margin: 0 }}>Exam Analytics</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Deep dive into student performance metrics</p>
          </div>
          <div style={{ minWidth: '300px', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>SELECT EXAM</label>
              <select className="form-select" value={selectedExamId} onChange={handleExamChange} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>{exam.title}</option>
                ))}
              </select>
            </div>
            {analytics && (
              <button className="btn btn-outline-primary" onClick={handleExportCSV} style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between" style={{ borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border)', background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <span>{error}</span>
            <button className="btn-close" style={{ filter: 'invert(1)' }} onClick={() => setError('')} />
          </div>
        )}

        {loadingAnalytics && !error && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Updating data...
          </div>
        )}

        {analytics && !loadingAnalytics && (
          <div style={{ animation: 'fadeInUp 0.5s ease both' }}>
            
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {[
                { label: 'Total Attempts', value: analytics.total_attempts ?? 0, color: 'var(--primary-light)', bg: 'var(--primary-glow)' },
                { label: 'Submitted', value: analytics.total_submitted ?? 0, color: 'var(--info)', bg: 'var(--bg-elevated)' },
                { label: 'Average Score', value: `${Number(analytics.average_score ?? 0).toFixed(1)}`, color: 'var(--warning)', bg: 'var(--warning-bg)' },
                { label: 'Pass Rate', value: `${Number(analytics.pass_rate ?? 0).toFixed(1)}%`, color: 'var(--success)', bg: 'var(--success-bg)' },
              ].map((stat, i) => (
                <div key={i} style={{ 
                  background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', 
                  border: `1px solid var(--border)`, position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: stat.color }}></div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="row g-4 mb-4">
              
              {/* Score Distribution (Bar Chart) */}
              <div className="col-lg-8">
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', height: '100%' }}>
                  <h5 style={{ fontWeight: 700, marginBottom: '24px' }}>Score Distribution</h5>
                  {scoreDistribution.length === 0 ? (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
                  ) : (
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                          <Tooltip content={<GlassTooltip />} cursor={{ fill: 'var(--bg-elevated)' }} />
                          <Bar dataKey="count" name="Students" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Difficulty Performance (Donut Chart) */}
              <div className="col-lg-4">
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', height: '100%' }}>
                  <h5 style={{ fontWeight: 700, marginBottom: '24px' }}>Accuracy by Difficulty</h5>
                  {difficultyPerformance.length === 0 ? (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
                  ) : (
                    <div style={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={difficultyPerformance}
                            dataKey="percentage"
                            nameKey="difficulty"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                          >
                            {difficultyPerformance.map((entry, index) => {
                              const pColor = entry.difficulty === 'easy' ? 'var(--success)' : entry.difficulty === 'medium' ? 'var(--warning)' : 'var(--danger)'
                              return <Cell key={`cell-${index}`} fill={pColor} />
                            })}
                          </Pie>
                          <Tooltip content={<GlassTooltip />} />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Topic Performance (Horizontal Bar Chart) */}
              <div className="col-12">
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
                  <h5 style={{ fontWeight: 700, marginBottom: '24px' }}>Topic Mastery (Pass Rate %)</h5>
                  {topicPerformance.length === 0 ? (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
                  ) : (
                    <div style={{ width: '100%', height: Math.max(300, topicPerformance.length * 60) }}>
                      <ResponsiveContainer>
                        <BarChart data={topicPerformance} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                          <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                          <YAxis dataKey="topic" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontWeight: 600 }} width={120} />
                          <Tooltip content={<GlassTooltip />} cursor={{ fill: 'var(--bg-elevated)' }} />
                          <Bar dataKey="percentage" name="Pass Rate (%)" radius={[0, 6, 6, 0]}>
                            {topicPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
