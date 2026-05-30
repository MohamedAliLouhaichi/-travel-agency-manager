import { FormEvent, useState } from 'react';
import { API_BASE_URL } from '../utils/api';
import { BarChart3, BriefcaseBusiness, LogIn, ShieldCheck, UserPlus } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'register';
type SignupRole = 'SECRETARY' | 'ADMIN';

export default function Login({ onLoginSuccess }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [role, setRole] = useState<SignupRole>('SECRETARY');
  const [adminCode, setAdminCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegisterMode = mode === 'register';

  const resetFeedback = () => {
    setError('');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  const saveSession = (data: any) => {
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('auth_user', JSON.stringify(data.user));

    onLoginSuccess();
    window.location.hash = '#/';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';

      const payload = isRegisterMode
        ? {
            fullName,
            email,
            password,
            role,
            ...(role === 'ADMIN' ? { adminCode } : {}),
          }
        : {
            email,
            password,
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;

        throw new Error(message || 'Authentication failed');
      }

      saveSession(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <div className="login-shell">
        <section className="login-showcase">
          <div className="login-brand">
            <img
              className="login-brand-logo"
              src="/branding/riadh-voyages-logo.png"
              alt="Riadh Voyages"
            />
            <div>
              <p className="login-brand-name">RIADH VOYAGES</p>
              <p className="login-brand-caption">Agence de voyages</p>
            </div>
          </div>

          <div className="login-showcase-copy">
            <p className="login-kicker">Smart agency workspace</p>
            <h1>Manage every journey with clarity.</h1>
            <p>
              Customers, reservations, invoices, and daily operations in one
              focused workspace built for your team.
            </p>
          </div>

          <div className="login-feature-list">
            <div className="login-feature">
              <BriefcaseBusiness size={18} />
              <span>Centralized operations</span>
            </div>
            <div className="login-feature">
              <BarChart3 size={18} />
              <span>Clear performance overview</span>
            </div>
            <div className="login-feature">
              <ShieldCheck size={18} />
              <span>Secure internal access</span>
            </div>
          </div>
        </section>

        <div className="login-card glass-panel">
          <div className="login-header">
            <p className="login-form-kicker">
              {isRegisterMode ? 'Team onboarding' : 'Welcome back'}
            </p>
            <h2 className="login-title">
              {isRegisterMode ? 'Create your account' : 'Sign in to your workspace'}
            </h2>
            <p className="login-subtitle">
              {isRegisterMode
                ? 'Create an internal account for the agency system'
                : 'Enter your credentials to continue'}
            </p>
          </div>

          <div className="login-mode-switch">
            <button
              type="button"
              className={mode === 'login' ? 'btn btn-primary' : 'btn btn-quiet'}
              onClick={() => switchMode('login')}
              disabled={loading}
            >
              Sign in
            </button>

            <button
              type="button"
              className={mode === 'register' ? 'btn btn-primary' : 'btn btn-quiet'}
              onClick={() => switchMode('register')}
              disabled={loading}
            >
              Register
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ahmed Ben Ali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isRegisterMode}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="e.g. admin@travelagency.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={isRegisterMode ? 6 : undefined}
                required
              />
            </div>

            {isRegisterMode && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="role">
                    Account type
                  </label>
                  <select
                    id="role"
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as SignupRole)}
                    required
                  >
                    <option value="SECRETARY">Normal employee</option>
                    <option value="ADMIN">Chef d'agence</option>
                  </select>
                </div>

                {role === 'ADMIN' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="adminCode">
                      Chef registration code
                    </label>
                    <input
                      id="adminCode"
                      type="password"
                      className="form-input"
                      placeholder="Enter chef registration code"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      required={role === 'ADMIN'}
                    />
                    <p className="form-helper">
                      Required only for chef d'agence accounts.
                    </p>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner loading-spinner-small" />
              ) : isRegisterMode ? (
                <>
                  <UserPlus size={18} /> Create Account
                </>
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>

          {isRegisterMode && (
            <div className="login-note">
              Normal employee accounts have operational access only. Chef accounts
              require the internal registration code and can access financial dashboards.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
