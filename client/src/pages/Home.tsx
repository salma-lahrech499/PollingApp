import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Link } from 'react-router-dom'
import { GET_POLLS } from '../queries'
import ChartModal from '../components/ChartModal'
import './Home.css'

function Home() {
  const { loading, error, data } = useQuery(GET_POLLS)
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)
  const [selectedPollTitle, setSelectedPollTitle] = useState<string>('')

  if (loading) return <div className="loading">Loading polls...</div>
  if (error) return <div className="error">Error: {error.message}</div>

  return (
    <div className="home">
      <div className="home-header">
        <Link to="/create" className="btn-create-poll">
          ➕ Create New Poll
        </Link>
      </div>

      {data?.polls?.length === 0 ? (
        <div className="empty-state">
          <h2>No polls yet</h2>
          <p>Be the first to create a poll!</p>
          <Link to="/create" className="btn btn-primary">
            Create Poll
          </Link>
        </div>
      ) : (
        <>
          <div className="polls-grid">
            {data?.polls?.map((poll: any) => (
              <div key={poll.id} className="poll-card">
                <Link to={`/poll/${poll.id}`} className="poll-card-link">
                  <h3>{poll.title}</h3>
                  <div className="poll-meta">
                    <span>
                      {poll.isAnonymousCreator ? 'Anonymous' : poll.creatorName || 'Anonymous'}
                    </span>
                    <span>•</span>
                    <span>{poll.voteCount} votes</span>
                    <span>•</span>
                    <span>{poll.options.length} options</span>
                  </div>
                </Link>
                <div className="poll-footer">
                  <span className="poll-date">
                    {new Date(poll.createdAt).toLocaleDateString()}
                  </span>
                  <div className="poll-footer-actions">
                    {poll.userHasVoted && (
                      <span className="voted-badge">✓ Voted</span>
                    )}
                    <button
                      className="btn-chart-details"
                      onClick={(e) => {
                        e.preventDefault()
                        setSelectedPollId(poll.id)
                        setSelectedPollTitle(poll.title)
                      }}
                    >
                      📊 Chart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedPollId && (
            <ChartModal
              pollId={selectedPollId}
              pollTitle={selectedPollTitle}
              isOpen={!!selectedPollId}
              onClose={() => setSelectedPollId(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default Home

