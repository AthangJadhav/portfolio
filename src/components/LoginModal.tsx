import { useState, type FormEvent } from "react"
import { login } from "../lib/api"

type LoginModalProps = {
  onClose: () => void
  onSuccess: () => void
}

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(password)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="admin-overlay"
      onClick={onClose}
    >
      <div
        className="login-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Admin access</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoFocus
          />

          {error && <p className="login-modal__error">{error}</p>}

          <div className="login-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="login-modal__cancel"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="login-modal__submit"
            >
              {isSubmitting ? "Checking…" : "Log in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
