import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Info, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import { appConfig } from '../config/app'
import { AuthVisual } from '../ui/AuthVisual'
import {
  CharCounter,
  CollapsibleSection,
  ErrorSummary,
  HelpTip,
  PasswordStrengthMeter,
  RequiredMark,
} from '../features/feature-pack/components'
import { useFieldValidation } from '../features/feature-pack/hooks'
import { useFeatures } from '../features/feature-pack/context'

export function RegisterPage() {
  const { notify } = useFeatures()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [checked, setChecked] = useState(false)
  const validation = useFieldValidation('check')
  const confirmError = confirm && confirm !== password ? 'The two passwords do not match.' : ''
  const errors: Record<string, string | undefined> = {
    ...(checked ? validation.summaryErrors : {}),
    ...(checked ? { confirm: confirmError } : {}),
  }
  const canCheck = username.trim().length >= 3 && password.length >= 10 && confirm.length > 0 && !confirmError

  function handleCheck(event: FormEvent) {
    event.preventDefault()
    const valid = validation.validateAll({ username, password })
    setChecked(true)
    if (!valid || confirmError) {
      notify('Check the highlighted fields.', 'error')
      return
    }
    notify('This password meets the local guidance. Nothing was submitted.', 'success')
  }

  return (
    <main className="auth-layout">
      <div className="auth-frame">
        <AuthVisual
          title="Access is managed, not improvised."
          copy="Accounts are provisioned by your platform administrator so every login has the correct scope from day one."
        />

        <div className="auth-card">
          <div className="auth-head">
            <p className="auth-kicker">Account access</p>
            <h1 className="auth-title">Registration</h1>
            <p className="auth-subtitle">{appConfig.title}</p>
          </div>

          <div className="auth-panel">
            <div className="notice">
              <ShieldAlert aria-hidden="true" />
              <div>
                <strong>Managed administrator accounts</strong>
                <p style={{ margin: 0 }}>
                  Laundry, shop, and hotel administrator accounts are created directly by the platform
                  administrator.
                </p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', opacity: 0.85 }}>
                  If you require access or staff credentials, please contact your laundry platform
                  administrator.
                </p>
              </div>
            </div>

            <CollapsibleSection title="Local password guidance (nothing is submitted)">
              <form onSubmit={handleCheck} className="auth-fields" noValidate>
                <ErrorSummary errors={errors} title="Check the highlighted fields" />
                <label className="block" htmlFor="fp-check-username">
                  <span className="field-label">
                    Username <RequiredMark />
                    <HelpTip text="Only used to check length rules locally." />
                  </span>
                  <input
                    id="fp-check-username"
                    className={clsx('field-input', checked && validation.errors.username && 'is-invalid')}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onBlur={() => {
                      validation.markTouched('username')
                      validation.validateField('username', { username, password })
                    }}
                    autoComplete="username"
                    placeholder="Example: hotel.reception"
                  />
                </label>

                <label className="block" htmlFor="fp-check-password">
                  <span className="field-label">Candidate password <RequiredMark /></span>
                  <input
                    id="fp-check-password"
                    type="password"
                    className={clsx('field-input', checked && validation.errors.password && 'is-invalid')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onBlur={() => {
                      validation.markTouched('password')
                      validation.validateField('password', { username, password })
                    }}
                    autoComplete="new-password"
                    placeholder="At least 10 characters"
                  />
                  <span className="flex items-center justify-between">
                    <PasswordStrengthMeter value={password} />
                    <CharCounter value={password} max={80} />
                  </span>
                  <span className="fp-field-error">{checked ? validation.errors.password : ''}</span>
                </label>

                <label className="block" htmlFor="fp-check-confirm">
                  <span className="field-label">Confirm password <RequiredMark /></span>
                  <input
                    id="fp-check-confirm"
                    type="password"
                    className={clsx('field-input', checked && confirmError && 'is-invalid')}
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    onBlur={() => setChecked(true)}
                    autoComplete="new-password"
                    placeholder="Repeat the password"
                  />
                  <span className="fp-field-error">{checked ? confirmError : ''}</span>
                </label>

                <button type="submit" disabled={!canCheck} className="btn btn-secondary btn-block">
                  Check password guidance
                </button>
                <p className="fp-muted" style={{ margin: 0, fontSize: '0.8125rem' }}>
                  Guidance only — accounts are issued by your administrator.
                </p>
              </form>
            </CollapsibleSection>

            <Link to="/login" className="btn btn-primary btn-block" style={{ marginTop: '1rem' }}>
              <ArrowLeft />
              Return to sign in
            </Link>
          </div>

          <p className="auth-foot">
            <Link to="/about" className="text-link">
              <Info aria-hidden="true" />
              About this portal
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
