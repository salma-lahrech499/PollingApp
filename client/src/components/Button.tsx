import './Button.css'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  className?: string
}

function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  className = '' 
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {children}
    </button>
  )
}

export default Button

