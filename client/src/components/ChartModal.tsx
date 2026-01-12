import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_POLL } from '../queries'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import './ChartModal.css'

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#059669', '#10b981', '#06b6d4', '#8b5cf6', '#a855f7']

interface ChartModalProps {
  pollId: string
  pollTitle: string
  isOpen: boolean
  onClose: () => void
}

function ChartModal({ pollId, pollTitle, isOpen, onClose }: ChartModalProps) {
  const { loading, error, data } = useQuery(GET_POLL, {
    variables: { id: pollId },
    skip: !isOpen,
  })

  if (!isOpen) return null

  const poll = data?.poll

  const chartData = poll?.results
    ? poll.results.map((result: any) => ({
        name: result.optionText,
        votes: result.voteCount,
        percentage: result.percentage,
      }))
    : []

  return (
    <div className="chart-modal-overlay" onClick={onClose}>
      <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="chart-modal-header">
          <h2>{pollTitle}</h2>
          <button className="chart-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="chart-modal-body">
          {loading && <div className="chart-modal-loading">Loading chart...</div>}
          {error && <div className="chart-modal-error">Error: {error.message}</div>}
          
          {poll && poll.results && poll.results.length > 0 ? (
            <>
              <div className="chart-modal-stats">
                <span>{poll.voteCount} total votes</span>
                <span>•</span>
                <span>{poll.results.length} options</span>
              </div>

              <div className="chart-modal-chart">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'votes') {
                          const item = chartData.find((d: any) => d.votes === value)
                          return [`${value} votes (${item?.percentage}%)`, 'Votes']
                        }
                        return [value, name]
                      }}
                    />
                    <Bar dataKey="votes" fill="#2563eb">
                      {chartData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-modal-results-list">
                {poll.results.map((result: any, index: number) => (
                  <div key={result.optionId} className="chart-modal-result-item">
                    <div className="chart-modal-result-header">
                      <span className="chart-modal-result-option">{result.optionText}</span>
                      <span className="chart-modal-result-stats">
                        {result.voteCount} votes ({result.percentage}%)
                      </span>
                    </div>
                    <div className="chart-modal-result-bar-container">
                      <div 
                        className="chart-modal-result-bar"
                        style={{ 
                          width: `${result.percentage}%`,
                          '--bar-color': COLORS[index % COLORS.length]
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : poll && (
            <div className="chart-modal-empty">
              No votes yet. Be the first to vote!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChartModal

