import { Mail, Lock, User } from '../../components/icons'
import { Input } from '../../components/ui'
import { PasswordStrength } from './AuthHelpers'

export interface FieldErrors {
  username?: string
  email?: string
  password?: string
}

interface AuthFormFieldsProps {
  mode: 'login' | 'register' | 'reset'
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  confirmPassword: string
  setConfirmPassword: (v: string) => void
  username: string
  setUsername: (v: string) => void
  fieldErrors: FieldErrors
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>
}

export function AuthFormFields({
  mode,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  username,
  setUsername,
  fieldErrors,
  setFieldErrors,
}: AuthFormFieldsProps) {
  return (
    <div className="space-y-3">
      {mode === 'register' && (
        <div>
          <Input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setFieldErrors(prev => ({ ...prev, username: undefined })) }}
            placeholder="Ton pseudo de gamer"
            icon={<User className="w-4 h-4" />}
            required
            autoComplete="username"
            className={fieldErrors.username ? 'border-error focus:border-error' : ''}
          />
          {fieldErrors.username && <p className="text-error text-sm mt-1">{fieldErrors.username}</p>}
        </div>
      )}

      {mode !== 'reset' && (
        <div>
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: undefined })) }}
            placeholder="Email"
            icon={<Mail className="w-4 h-4" />}
            required
            autoFocus={mode !== 'register'}
            autoComplete="email"
            className={fieldErrors.email ? 'border-error focus:border-error' : ''}
          />
          {fieldErrors.email && <p className="text-error text-sm mt-1">{fieldErrors.email}</p>}
        </div>
      )}

      <div>
        <Input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: undefined })) }}
          placeholder={mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}
          icon={<Lock className="w-4 h-4" />}
          showPasswordToggle
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className={fieldErrors.password ? 'border-error focus:border-error' : ''}
        />
        {fieldErrors.password && <p className="text-error text-sm mt-1">{fieldErrors.password}</p>}
        {/* Password strength indicator (register/reset only) */}
        {(mode === 'register' || mode === 'reset') && password.length > 0 && (
          <PasswordStrength password={password} />
        )}
      </div>

      {mode === 'reset' && (
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmer le mot de passe"
          icon={<Lock className="w-4 h-4" />}
          showPasswordToggle
          required
          autoComplete="new-password"
        />
      )}
    </div>
  )
}
