import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { GET_POLL, VOTE } from '../queries'
import ChartModal from '../components/ChartModal'
import './PollDetail.css'

// Generate anonymous user ID for anonymous voting (client-side, can't be traced)
function generateAnonymousUserId(pollId: string): string {
  const storageKey = `anon_user_${pollId}`
  let anonId = localStorage.getItem(storageKey)
  
  if (!anonId) {
    // Generate a random ID that can't be traced back
    anonId = Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15) +
             Date.now().toString(36)
    localStorage.setItem(storageKey, anonId)
  }
  
  return anonId
}

function PollDetail() {
  const { id } = useParams<{ id: string }>()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [showChartModal, setShowChartModal] = useState(false)

  const { loading, error, data, refetch } = useQuery(GET_POLL, {
    variables: { id },
  })

  const [vote, { loading: voting }] = useMutation(VOTE, {
    onCompleted: (mutationData) => {
      // Update cache immediately to avoid flickering
      if (mutationData?.vote?.poll) {
        refetch()
        // Automatically show chart modal after voting
        setShowChartModal(true)
      }
      setSelectedOption(null)
      setShowQuestions(false)
    },
  })

  if (loading) return <div className="loading">Loading poll...</div>
  if (error) return <div className="error">Error: {error.message}</div>
  if (!data?.poll) return <div className="error">Poll not found</div>

  const poll = data.poll

  const handleVote = async () => {
    if (!selectedOption) {
      alert('Please select an option')
      return
    }

    try {
      // For anonymous votes, generate/retrieve anonymous user ID client-side
      const anonymousUserId = isAnonymous && id ? generateAnonymousUserId(id) : undefined

      const result = await vote({
        variables: {
          input: {
            pollId: id,
            optionId: selectedOption,
            isAnonymous,
            anonymousUserId,
          },
        },
      })

      if (!result.data?.vote?.success) {
        alert(result.data?.vote?.message || 'Failed to record vote')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record vote')
    }
  }

  return (
    <div className="poll-detail">
      <Link to="/" className="back-link">← Back to polls</Link>

      <div className="poll-detail-card">
        <div className="poll-header">
          <h1>{poll.title}</h1>
          <div className="poll-info">
            <span>
              Created by {poll.isAnonymousCreator ? 'Anonymous' : poll.creatorName || 'Anonymous'}
            </span>
            <span>•</span>
            <span>{poll.voteCount} total votes</span>
            <span>•</span>
            <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {poll.userHasVoted ? (
          <div className="results-section">
            <div className="results-header-actions">
              <h2>✓ You've voted!</h2>
              <button
                onClick={() => setShowChartModal(true)}
                className="btn-view-chart"
              >
                📊 View Chart
              </button>
            </div>

            <button
              onClick={() => setShowQuestions(!showQuestions)}
              className="btn-view-questions"
            >
              {showQuestions ? 'Hide Questions' : 'View Questions'}
            </button>

            {showQuestions && (
              <div className="questions-preview">
                <h3>Poll Options</h3>
                <div className="options-list-readonly">
                  {poll.options.map((option: any) => (
                    <div key={option.id} className="option-readonly">
                      <span>{option.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="voting-section">
            <h2>Cast your vote</h2>
            <div className="options-list">
              {poll.options.map((option: any) => (
                <label key={option.id} className={`option-radio ${selectedOption === option.id ? 'checked' : ''}`}>
                  <input
                    type="radio"
                    name="option"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
            {
              poll.creatorName !== "Anonymous" ? 
              (
                <div className="anonymous-voting">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <span>Vote anonymously (cannot be traced)</span>
                  </label>
                </div>
              ) : ""
            }

            <button
              onClick={handleVote}
              disabled={!selectedOption || voting}
              className="btn btn-primary btn-vote"
            >
              {voting ? 'Submitting...' : 'Submit Vote'}
            </button>
          </div>
        )}

        {poll.userHasVoted && (
          <div className="results-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Votes</span>
                <span className="stat-value">{poll.voteCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Options</span>
                <span className="stat-value">{poll.options.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {id && (
        <ChartModal
          pollId={id}
          pollTitle={poll.title}
          isOpen={showChartModal}
          onClose={() => setShowChartModal(false)}
        />
      )}
    </div>
  )
}

export default PollDetail

