import React, { useState, useEffect, useCallback } from 'react';
import type { AdminUser, UserRole, UserStatus } from '../../types';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../common/EmptyState';
import { ChangeUserRoleModal } from './ChangeUserRoleModal';
import {
  Search,
  Shield,
  GraduationCap,
  Crown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AdminUsersTab: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Role edit modal
  const [editingRoleUser, setEditingRoleUser] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({
        search: search.trim() || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        size: 20,
      });
      setUsers(res.content);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to load user accounts.');
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (targetUser: AdminUser) => {
    const isBlocking = targetUser.status === 'ACTIVE';
    const actionWord = isBlocking ? 'BLOCK' : 'UNBLOCK';

    if (currentUser?.id === targetUser.id && isBlocking) {
      alert('You cannot block your own administrative account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionWord.toLowerCase()} account "${targetUser.name}" (${targetUser.email})?`)) {
      return;
    }

    try {
      await adminService.updateUserStatus(targetUser.id, {
        status: isBlocking ? 'BLOCKED' : 'ACTIVE',
      });
      fetchUsers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        alert((err as { message: string }).message);
      } else {
        alert(`Failed to ${actionWord.toLowerCase()} user.`);
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-700 border border-purple-500/20">
            <Crown className="w-3 h-3" /> Admin
          </span>
        );
      case 'SECURITY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-700 border border-blue-500/20">
            <Shield className="w-3 h-3" /> Security
          </span>
        );
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-secondary text-ink-secondary border border-surface-border">
            <GraduationCap className="w-3 h-3" /> Student
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-secondary text-ink-secondary border border-surface-border">
            {role}
          </span>
        );
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    return status === 'ACTIVE' ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-700 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Blocked
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search & Filters */}
      <div className="p-3 sm:p-4 rounded-xl bg-surface border border-surface-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <input
            type="text"
            className="w-full pl-8.5 pr-3 py-1.5 bg-surface border border-surface-border rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="Search accounts by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="px-2.5 py-1.5 bg-surface border border-surface-border rounded-lg text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | 'ALL');
              setPage(0);
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="SECURITY">Security</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            className="px-2.5 py-1.5 bg-surface border border-surface-border rounded-lg text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UserStatus | 'ALL');
              setPage(0);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* User Table */}
      {loading ? (
        <div className="p-10 text-center text-ink-muted text-xs flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading accounts...</span>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No users match your criteria"
          description="Try adjusting your search terms or filter selections."
        />
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border text-ink-secondary text-[11px] font-medium">
                  <th className="py-2.5 px-3.5 font-medium">User</th>
                  <th className="py-2.5 px-3.5 font-medium">Role</th>
                  <th className="py-2.5 px-3.5 font-medium">Status</th>
                  <th className="py-2.5 px-3.5 font-medium">Registered</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const initials = u.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={u.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-surface-secondary border border-surface-border text-ink font-medium flex items-center justify-center text-[11px] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-ink flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] text-accent bg-accent/10 px-1 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-ink-muted text-[11px]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">{getRoleBadge(u.role)}</td>
                      <td className="py-3 px-3.5">{getStatusBadge(u.status)}</td>
                      <td className="py-3 px-3.5 text-ink-muted text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingRoleUser(u)}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot modify your own administrative role' : 'Change user role'}
                            className="px-2.5 py-1 rounded-md border border-surface-border text-ink-secondary hover:text-ink hover:bg-surface-secondary text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            Role
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf && u.status === 'ACTIVE'}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                              u.status === 'ACTIVE'
                                ? 'bg-red-500/10 text-red-700 hover:bg-red-500/20 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-500/20'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border shadow-xs text-xs text-ink-secondary">
          <div>
            Page <span className="font-medium text-ink">{page + 1}</span> of{' '}
            <span className="font-medium text-ink">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2.5 py-1 rounded-md border border-surface-border hover:bg-surface-secondary disabled:opacity-40 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-2.5 py-1 rounded-md border border-surface-border hover:bg-surface-secondary disabled:opacity-40 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {editingRoleUser && (
        <ChangeUserRoleModal
          user={editingRoleUser}
          isOpen={Boolean(editingRoleUser)}
          onClose={() => setEditingRoleUser(null)}
          onRoleUpdated={() => {
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

