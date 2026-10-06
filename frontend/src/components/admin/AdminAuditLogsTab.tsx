import React, { useState, useEffect, useCallback } from 'react';
import type { AuditAction, AuditLog } from '../../types';
import { adminService } from '../../services/adminService';
import { EmptyState } from '../common/EmptyState';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
} from 'lucide-react';

export const AdminAuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getAuditLogs({
        action: actionFilter === 'ALL' ? undefined : actionFilter,
        entityType: entityType.trim() || undefined,
        page,
        size: 25,
      });
      setLogs(res.content);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to load audit logs.');
      }
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityType, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'USER_BLOCKED':
      case 'LOGIN_FAILURE':
      case 'CLAIM_REJECTED':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-mono bg-red-500/10 text-red-700 border border-red-500/20">
            {action}
          </span>
        );
      case 'USER_UNBLOCKED':
      case 'CLAIM_APPROVED':
      case 'ITEM_RESOLVED':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-mono bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            {action}
          </span>
        );
      case 'ITEM_ARCHIVED':
      case 'ROLE_CHANGED':
      case 'ADMIN_ACTION':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-mono bg-purple-500/10 text-purple-700 border border-purple-500/20">
            {action}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-mono bg-surface-secondary text-ink-secondary border border-surface-border">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="p-3 sm:p-4 rounded-xl bg-surface border border-surface-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <input
            type="text"
            className="w-full pl-8.5 pr-3 py-1.5 bg-surface border border-surface-border rounded-lg text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            placeholder="Filter by Entity Type (e.g., ITEM, CLAIM, USER)..."
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(0);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="px-2.5 py-1.5 bg-surface border border-surface-border rounded-lg text-xs text-ink focus:outline-none focus:border-accent cursor-pointer"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value as AuditAction | 'ALL');
              setPage(0);
            }}
          >
            <option value="ALL">All Actions</option>
            <option value="USER_REGISTERED">User Registered</option>
            <option value="LOGIN_FAILURE">Login Failure</option>
            <option value="ITEM_CREATED">Item Created</option>
            <option value="ITEM_UPDATED">Item Updated</option>
            <option value="ITEM_ARCHIVED">Item Archived</option>
            <option value="CLAIM_SUBMITTED">Claim Submitted</option>
            <option value="CLAIM_APPROVED">Claim Approved</option>
            <option value="CLAIM_REJECTED">Claim Rejected</option>
            <option value="ITEM_RESOLVED">Item Resolved</option>
            <option value="USER_BLOCKED">User Blocked</option>
            <option value="USER_UNBLOCKED">User Unblocked</option>
            <option value="ROLE_CHANGED">Role Changed</option>
            <option value="ADMIN_ACTION">Admin Action</option>
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

      {/* Audit Table */}
      {loading ? (
        <div className="p-10 text-center text-ink-muted text-xs flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading audit log...</span>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit records found"
          description="Try adjusting your action or entity filters."
        />
      ) : (
        <div className="bg-surface rounded-xl border border-surface-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-secondary border-b border-surface-border text-ink-secondary text-[11px] font-medium">
                  <th className="py-2.5 px-3.5 font-medium">Timestamp</th>
                  <th className="py-2.5 px-3.5 font-medium">Action</th>
                  <th className="py-2.5 px-3.5 font-medium">Actor</th>
                  <th className="py-2.5 px-3.5 font-medium">Target Entity</th>
                  <th className="py-2.5 px-3.5 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="py-3 px-3.5 text-ink-muted text-[11px] whitespace-nowrap">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-ink-muted font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-ink flex items-center gap-1">
                        <User className="w-3 h-3 text-accent" /> {log.actorName}
                      </div>
                      <div className="text-ink-muted text-[11px]">{log.actorEmail}</div>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-medium text-ink">{log.entityType}</div>
                      {log.entityId && (
                        <div className="text-[10px] font-mono text-ink-muted bg-surface-secondary px-1.5 py-0.2 rounded inline-block mt-0.5">
                          {log.entityId.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[11px] text-ink-secondary max-w-[280px] break-all">
                      {log.metadata || '—'}
                    </td>
                  </tr>
                ))}
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
    </div>
  );
};

