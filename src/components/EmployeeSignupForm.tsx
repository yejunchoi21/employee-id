import { useId, useState, type FormEvent } from 'react'
import type { EmployeeSignupInput } from '../utils/createEmployee'
import './EmployeeSignupForm.css'

interface EmployeeSignupFormProps {
  onSubmit: (
    input: EmployeeSignupInput,
  ) => { ok: true } | { ok: false; error: string }
  submitLabel?: string
}

const emptyForm: EmployeeSignupInput = {
  name: '',
  title: '',
  department: '',
  office: '',
  email: '',
  phone: '',
  manager: '',
  bio: '',
  skills: '',
}

function EmployeeSignupForm({
  onSubmit,
  submitLabel = 'Create my card',
}: EmployeeSignupFormProps) {
  const formId = useId()
  const [form, setForm] = useState<EmployeeSignupInput>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = <K extends keyof EmployeeSignupInput>(
    key: K,
    value: EmployeeSignupInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = onSubmit(form)
      if (!result.ok) {
        setError(result.error)
        return
      }
      // Successful navigations leave this page; keep values until then.
    } catch {
      setError('Something went wrong while creating your card. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="signup" aria-labelledby={`${formId}-title`}>
      <div className="signup__intro">
        <h2 id={`${formId}-title`} className="signup__title">
          Sign up for the directory
        </h2>
        <p className="signup__copy">
          Add your custom employee info to create a card for the 360° rack.
          This is a browser-only demo, not a real account registration system.
        </p>
      </div>

      <form className="signup__form" onSubmit={handleSubmit}>
        <div className="signup__grid">
          <div className="signup__field">
            <label htmlFor={`${formId}-name`}>Full name</label>
            <input
              id={`${formId}-name`}
              name="name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </div>

          <div className="signup__field">
            <label htmlFor={`${formId}-title`}>Job title</label>
            <input
              id={`${formId}-title`}
              name="title"
              type="text"
              required
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </div>

          <div className="signup__field">
            <label htmlFor={`${formId}-department`}>Department</label>
            <input
              id={`${formId}-department`}
              name="department"
              type="text"
              required
              list={`${formId}-departments`}
              value={form.department}
              onChange={(event) => updateField('department', event.target.value)}
            />
            <datalist id={`${formId}-departments`}>
              <option value="Design" />
              <option value="Engineering" />
              <option value="People" />
              <option value="Analytics" />
              <option value="Customer Success" />
              <option value="Marketing" />
              <option value="Security" />
              <option value="Operations" />
            </datalist>
          </div>

          <div className="signup__field">
            <label htmlFor={`${formId}-office`}>Office</label>
            <input
              id={`${formId}-office`}
              name="office"
              type="text"
              required
              value={form.office}
              onChange={(event) => updateField('office', event.target.value)}
            />
          </div>

          <div className="signup__field">
            <label htmlFor={`${formId}-email`}>Work email</label>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
          </div>

          <div className="signup__field">
            <label htmlFor={`${formId}-phone`}>Work phone</label>
            <input
              id={`${formId}-phone`}
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
            />
          </div>

          <div className="signup__field">
            <label htmlFor={`${formId}-manager`}>Manager</label>
            <input
              id={`${formId}-manager`}
              name="manager"
              type="text"
              required
              value={form.manager}
              onChange={(event) => updateField('manager', event.target.value)}
            />
          </div>

          <div className="signup__field">
            <label htmlFor={`${formId}-skills`}>Skills</label>
            <input
              id={`${formId}-skills`}
              name="skills"
              type="text"
              required
              placeholder="Design systems, React, Writing"
              value={form.skills}
              onChange={(event) => updateField('skills', event.target.value)}
            />
            <p className="signup__help">Separate skills with commas.</p>
          </div>
        </div>

        <div className="signup__field signup__field--full">
          <label htmlFor={`${formId}-bio`}>Short bio</label>
          <textarea
            id={`${formId}-bio`}
            name="bio"
            required
            rows={4}
            value={form.bio}
            onChange={(event) => updateField('bio', event.target.value)}
          />
        </div>

        <div className="signup__footer">
          {error ? (
            <p className="signup__error" role="alert">
              {error}
            </p>
          ) : (
            <p className="signup__help">
              Browser-only demo. No password, accounts, or database are used.
            </p>
          )}
          <button
            type="submit"
            className="signup__submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating…' : submitLabel}
          </button>
        </div>
      </form>
    </section>
  )
}

export default EmployeeSignupForm
