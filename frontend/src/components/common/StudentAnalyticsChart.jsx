import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { examAPI } from '../../api/exams';
import { format } from 'date-fns';

export default function StudentAnalyticsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await examAPI.getMyResults();
      const results = res.data || res;
      
      // Sort by date ascending to show history left-to-right
      const sorted = [...results].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );

      // Map to chart format
      const chartData = sorted.map(r => ({
        name: (r.exam_title || "Exam").slice(0, 15) + '...',
        fullTitle: r.exam_title || "Exam",
        score: parseFloat(r.percentage || 0).toFixed(1),
        date: format(new Date(r.created_at), 'MMM d, yyyy'),
        isPass: r.is_pass
      }));

      setData(chartData);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border spinner-border-sm text-primary" />
    </div>
  );

  if (data.length === 0) return null; // Don't show chart if no past exams

  // Custom Tooltip for Glassmorphism effect
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload;
      return (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {row.date}
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            {row.fullTitle}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: row.isPass ? 'var(--success)' : 'var(--danger)' }}>
              {row.score}%
            </span>
            <span style={{ 
              fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
              background: row.isPass ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: row.isPass ? 'var(--success)' : 'var(--danger)' 
            }}>
              {row.isPass ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '32px',
      animation: 'fadeInUp 0.6s ease'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Performance History
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Your score trajectory across recent exams
        </p>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="var(--primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
              activeDot={{ r: 6, fill: 'var(--primary-light)', stroke: 'var(--bg-surface)', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
