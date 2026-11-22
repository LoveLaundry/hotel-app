import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import clsx from 'clsx'
import { errorMessage } from '../api/client'
import { appConfig } from '../config/app'
import { AuthVisual } from '../ui/AuthVisual'
import type { Association } from './associations'
import { LaundryChoiceRequired, useAuth } from './AuthContext'
import { useFeatures } from '../features/feature-pack/context'
import {
  AutosaveIndicator,
  CharCounter,
  CollapsibleSection,
  DraftBanner,
  ErrorSummary,
  HelpTip,
  RequiredMark,
  StepIndicator,
} from '../features/feature-pack/components'
import { useDebouncedValue, useDraft, useFieldValidation, useSubmitOnce } from '../features/feature-pack/hooks'
import {
  assertHotelClientType,
  friendlyRole,
  lastRememberedLaundry,
  normalizeError,
  orderChoices,
  rememberLaundry,
  stepStatus,
} from '../features/feature-pack/utils'

export function LoginPage() {
  const { isAuthenticated, signIn } = useAuth()
  const { notify, requestConfirm } = useFeatures()
  const draft = useDraft('login-username')
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [choices, setChoices] = useState<Association[] | null>(null)
  const [draftNoticeDismissed, setDraftNoticeDismissed] = useState(false)
  const validation = useFieldValidation('signin')
  const remembered = useMemo(() => lastRememberedLaundry(), [choices])
  const [choiceQuery, setChoiceQuery] = useState('')
  const debouncedChoiceQuery = useDebouncedValue(choiceQuery, 180)

  const orderedChoices = useMemo(() => {
    const needle = debouncedChoiceQuery.trim().toLowerCase()
    const filtered = (choices ?? []).filter((choice) =>
      `${choice.laundry_name} ${choice.client_name} ${choice.laundry_id}`.toLowerCase().includes(needle),
    )
    return orderChoices(filtered, remembered)
  }, [choices, debouncedChoiceQuery, remembered])

  const username = draft.value
  const valid = !validation.errors.username && !validation.errors.password && username.trim().length >= 3 && password.length > 0

  const { run: attempt, pending } = useSubmitOnce(async (laundryId?: string) => {
    setError(null)
    try {
      await signIn({ username, password, laundryId })
      if (laundryId) rememberLaundry(laundryId)
      notify('Signed in to your hotel workspace.')
    } catch (caught) {
      if (caught instanceof LaundryChoiceRequired) {
        setChoices(caught.laundries)
        notify('This login belongs to several laundries. Choose one to continue.', 'info')
      } else {
        setError(normalizeError(caught) || errorMessage(caught))
      }
    }
  })

  if (isAuthenticated) return <Navigate to="/" replace />

  assertHotelClientType(appConfig.clientType)
  const sideLabel = appConfig.clientType === 'SHOP' ? 'Shop login' : 'Hotel login'
  const steps = choices ? ['Credentials', 'Laundry', 'Ready'] : ['Credentials', 'Laundry', 'Ready']

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validation.validateAll({ username, password })) return
    void attempt()
  }

  function resetForm() {
    requestConfirm({
      title: 'Clear the sign-in form?',
      body: 'Saved username drafts on this device will be removed. Your password is never stored.',
      confirmLabel: 'Clear form',
      onConfirm: () => {
        draft.discard()
        setPassword('')
        setError(null)
        setChoices(null)
        validation.reset()
        setDraftNoticeDismissed(true)
        notify('Sign-in form cleared.', 'info')
      },
    })
  }

  return (
    <main className="auth-layout">
      <div className="auth-frame">
        <AuthVisual />

        <div className="auth-card">
          <div className="auth-head">
            <p className="auth-kicker">Secure access</p>
            <h1 className="auth-title">{appConfig.title}</h1>
            <p className="auth-subtitle">{appConfig.tagline}</p>
          </div>

          <StepIndicator steps={steps} current={choices ? 1 : 0} />

          {choices ? (
            <div className="auth-panel">
              <h2 className="panel-title">Choose a laundry</h2>
              <p className="panel-note">
                This login is registered with more than one laundry. Each one keeps its own records.
              </p>
              <label className="fp-search" style={{ marginTop: '0.8rem' }}>
                <Search size={14} aria-hidden="true" />
                <span className="sr-only">Search available laundries</span>
                <input
                  value={choiceQuery}
                  onChange={(event) => setChoiceQuery(event.target.value)}
                  placeholder="Find a laundry"
                  aria-label="Search available laundries"
                />
              </label>
              <div className="choice-list">
                {orderedChoices.map((choice) => {
                  const suspended = choice.status.toUpperCase() !== 'ACTIVE'
                  return (
                    <button
                      key={`${choice.laundry_id}-${choice.client_name}`}
                      type="button"
                      disabled={pending || suspended}
                      onClick={() => void attempt(choice.laundry_id)}
                      className="choice-button"
                      title={suspended ? 'This association is suspended. Choose an active one.' : `Sign in as ${friendlyRole(choice.role_id)}`}
                    >
                      <span className="flex items-center gap-2">
                        <Building2 size={16} className="text-accent" aria-hidden="true" />
                        <span>
                          <span className="block font-medium">{choice.laundry_name || choice.laundry_id}</span>
                          <span className="block text-xs text-slate-400">
                            {choice.client_name || 'Hotel account'} · {friendlyRole(choice.role_id)}
                            {remembered === choice.laundry_id ? ' · last used' : ''}
                          </span>
                        </span>
                      </span>
                      {suspended ? (
                        <span className="chip chip-danger">Suspended</span>
                      ) : (
                        <ArrowRight size={15} aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
                {orderedChoices.length === 0 ? (
                  <p className="panel-note">No laundry matches that search.</p>
                ) : null}
              </div>
              <button type="button" onClick={() => setChoices(null)} className="btn btn-ghost" style={{ marginTop: '0.9rem' }}>
                Use a different login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-panel" noValidate>
              {draft.restored && !draftNoticeDismissed ? (
                <DraftBanner
                  onRestore={() => {
                    draft.restore()
                    setDraftNoticeDismissed(true)
                  }}
                  onDiscard={() => {
                    draft.discard()
                    setDraftNoticeDismissed(true)
                  }}
                />
              ) : null}

              <div className="auth-fields">
                <ErrorSummary errors={validation.summaryErrors} />

                <label className="block" htmlFor="fp-field-username">
                  <span className="field-label">
                    {sideLabel} <RequiredMark />
                    <HelpTip text="Use the username issued by your platform administrator." />
                  </span>
                  <span className="input-with-icon">
                    <UserRound className="input-icon" aria-hidden="true" />
                    <input
                      id="fp-field-username"
                      value={username}
                      onChange={(event) => draft.setValue(event.target.value)}
                      onBlur={() => {
                        validation.markTouched('username')
                        validation.validateField('username', { username, password })
                      }}
                      autoComplete="username"
                      className={clsx('field-input', validation.touched.username && validation.errors.username && 'is-invalid')}
                      placeholder="Your account username"
                      aria-invalid={Boolean(validation.touched.username && validation.errors.username)}
                      aria-describedby={validation.touched.username && validation.errors.username ? 'fp-username-error' : undefined}
                      required
                    />
                  </span>
                  <span className="flex items-center justify-between">
                    <span className="fp-field-error" id="fp-username-error">
                      {validation.touched.username ? validation.errors.username : ''}
                    </span>
                    <CharCounter value={username} max={80} />
                  </span>
                </label>

                <label className="block" htmlFor="fp-field-password">
                  <span className="field-label">
                    Password <RequiredMark />
                    <HelpTip text="Passwords are never saved in this browser draft." />
                  </span>
                  <span className="input-with-icon">
                    <LockKeyhole className="input-icon" aria-hidden="true" />
                    <input
                      id="fp-field-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() => {
                        validation.markTouched('password')
                        validation.validateField('password', { username, password })
                      }}
                      autoComplete="current-password"
                      className={clsx('field-input', 'fp-password-input', validation.touched.password && validation.errors.password && 'is-invalid')}
                      placeholder="Your password"
                      aria-invalid={Boolean(validation.touched.password && validation.errors.password)}
                      aria-describedby={validation.touched.password && validation.errors.password ? 'fp-password-error' : undefined}
                      required
                    />
                    <button
                      type="button"
                      className="fp-password-toggle"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </span>
                  <span className="fp-field-error" id="fp-password-error">
                    {validation.touched.password ? validation.errors.password : ''}
                  </span>
                </label>

                <AutosaveIndicator status={draft.status} />

                {error ? (
                  <p role="alert" className="auth-error">
                    <ShieldCheck aria-hidden="true" />
                    {error}
                  </p>
                ) : null}

                <button type="submit" disabled={pending || !valid} className="btn btn-primary btn-block">
                  {pending ? 'Signing in…' : 'Sign in'}
                  {!pending ? <ArrowRight aria-hidden="true" /> : null}
                </button>

                <button type="button" onClick={resetForm} className="btn btn-ghost btn-block">
                  <RotateCcw aria-hidden="true" /> Reset form
                </button>

                <CollapsibleSection title="Sign-in help">
                  <p style={{ margin: 0 }}>
                    This portal accepts hotel accounts only. If the same username exists at several laundries,
                    you will be asked which one to use after the first step. Contact your platform administrator
                    if your account is missing or suspended.
                  </p>
                </CollapsibleSection>

                <p className="auth-foot">
                  Don&apos;t have an account? Contact your platform administrator.
                </p>
              </div>
            </form>
          )}

          <p className="auth-foot">
            <Link to="/about" className="text-link">
              <Info aria-hidden="true" />
              About this portal
            </Link>
          </p>
          {stepStatus(2, choices ? 1 : 0) === 'todo' ? <span className="sr-only">Laundry selection may be required.</span> : null}
        </div>
      </div>
    </main>
  )
}
