import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useNavigate, Link } from 'react-router-dom'
import { CREATE_POLL } from '../mutations'
import { GET_POLLS } from '../queries'
import './CreatePoll.css'

function CreatePoll() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [creatorName, setCreatorName] = useState('')
  const [isAnonymousCreator, setIsAnonymousCreator] = useState(false)
  const [allowAnonymousVoting, setAllowAnonymousVoting] = useState(true)

  const [createPoll, { loading, error }] = useMutation(CREATE_POLL, {
    refetchQueries: [{ query: GET_POLLS }],
    onCompleted: (data) => {
      navigate(`/poll/${data.createPoll.id}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('Please enter a poll title')
      return
    }

    const validOptions = options.filter(opt => opt.trim())
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options')
      return
    }

    try {
      await createPoll({
        variables: {
          input: {
            title: title.trim(),
            options: validOptions.map(opt => opt.trim()),
            creatorName: isAnonymousCreator ? null : (creatorName.trim() || null),
            isAnonymousCreator,
            allowAnonymousVoting,
          },
        },
      })
    } catch (err) {
      console.error('Error creating poll:', err)
    }
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  return (
    <div className="create-poll">
      <Link to="/" className="back-link">← Back to polls</Link>
      <div className="create-poll-card">
        <h2>Create New Poll</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Poll Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should we have for lunch?"
              required
            />
          </div>

          <div className="form-group">
            <label>Options</label>
            {options.map((option, index) => (
              <div key={index} className="option-input-group">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="btn-add-option"
            >
              + Add Option
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="creatorName">Your Name (optional)</label>
            <input
              id="creatorName"
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="Enter Your Name"
              disabled={isAnonymousCreator}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isAnonymousCreator}
                onChange={(e) => setIsAnonymousCreator(e.target.checked)}
              />
              Create anonymously
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={allowAnonymousVoting}
                onChange={(e) => setAllowAnonymousVoting(e.target.checked)}
              />
              Allow anonymous voting
            </label>
          </div>

          {error && <div className="error-message">{error.message}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-create" disabled={loading}>
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePoll

