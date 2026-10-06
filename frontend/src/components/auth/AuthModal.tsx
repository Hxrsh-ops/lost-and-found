import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  defaultTab,
}) => {
  const initialTab = defaultTab || defaultMode;
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  useEffect(() => {
    setTab(defaultTab || defaultMode);
  }, [defaultMode, defaultTab, isOpen]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setIsSubmitting(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onClose();
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      if (err?.validationErrors) {
        setValidationErrors(err.validationErrors);
      } else {
        setError(err?.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-surface-border overflow-hidden z-10 my-8">
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <h2 className="text-base font-semibold text-ink">
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          <p className="text-xs text-ink-secondary mb-4">
            {tab === 'login'
              ? 'Enter your campus credentials to access your reported items and claims.'
              : 'Register to report items, submit ownership claims, and receive notifications.'}
          </p>

          {/* Tab Switcher */}
          <div className="flex p-0.5 mb-4 bg-surface-secondary rounded-lg border border-surface-border">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-surface text-ink shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Register
            </button>
          </div>

          {/* Global Error Notice */}
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Harshanth K"
                    className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </div>
                {validationErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium">{validationErrors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-ink">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@srmist.edu.in"
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              {validationErrors.email && (
                <p className="text-[11px] text-red-600 font-medium">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-ink">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </div>
              {validationErrors.password && (
                <p className="text-[11px] text-red-600 font-medium">{validationErrors.password}</p>
              )}
              {tab === 'register' && (
                <p className="text-[11px] text-ink-muted">Minimum 8 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2 px-4 rounded-lg font-medium text-xs text-white bg-accent hover:bg-accent-hover active:bg-accent-hover transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : tab === 'login' ? (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

