import React, { useState } from 'react';
import type { AdminUser, UserRole } from '../../types';
import { adminService } from '../../services/adminService';
import { X, Shield, Crown, GraduationCap, AlertCircle, Check } from 'lucide-react';

interface ChangeUserRoleModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onRoleUpdated: () => void;
}

export const ChangeUserRoleModal: React.FC<ChangeUserRoleModalProps> = ({
  user,
  isOpen,
  onClose,
  onRoleUpdated,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adminService.updateUserRole(user.id, { role: selectedRole });
      onRoleUpdated();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to update user role.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions: { role: UserRole; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      role: 'STUDENT',
      title: 'Student (Standard User)',
      desc: 'Can report lost/found items, claim discovered items, and manage their own submissions.',
      icon: <GraduationCap className="w-4 h-4 text-ink-muted" />,
    },
    {
      role: 'SECURITY',
      title: 'Campus Security Staff',
      desc: 'Authorized to review, evaluate, approve, or reject student ownership claims campus-wide.',
      icon: <Shield className="w-4 h-4 text-blue-600" />,
    },
    {
      role: 'ADMIN',
      title: 'Campus Administrator',
      desc: 'Full administrative access: user management, role modification, item archives, and audit access.',
      icon: <Crown className="w-4 h-4 text-purple-600" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-surface rounded-xl shadow-xl border border-surface-border overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div>
            <h2 id="role-modal-title" className="font-semibold text-ink text-sm">
              Change User Role
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Update permissions for <strong className="text-ink">{user.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            {roleOptions.map((opt) => {
              const isSelected = selectedRole === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'border-accent bg-accent/5 ring-1 ring-accent'
                      : 'border-surface-border bg-surface hover:bg-surface-secondary'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{opt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink text-xs">{opt.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </div>
                    <p className="text-[11px] text-ink-secondary mt-0.5 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 rounded-lg border border-surface-border text-ink-secondary text-xs font-medium hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedRole === user.role}
              className="px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

