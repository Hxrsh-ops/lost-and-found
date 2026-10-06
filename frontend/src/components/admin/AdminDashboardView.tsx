import React, { useState } from 'react';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminItemsTab } from './AdminItemsTab';
import { AdminClaimsTab } from './AdminClaimsTab';
import { AdminAuditLogsTab } from './AdminAuditLogsTab';
import { Users, Package, FileCheck, ShieldAlert } from 'lucide-react';

interface AdminDashboardViewProps {
  onSelectItem: (itemId: string) => void;
  onOpenClaimReview: (claimId: string) => void;
}

type AdminSubTab = 'users' | 'items' | 'claims' | 'audit';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onSelectItem,
  onOpenClaimReview,
}) => {
  const [activeTab, setActiveTab] = useState<AdminSubTab>('users');

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-xl bg-surface border border-surface-border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-ink">
            Admin Console
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Manage user accounts, inspect reported property, evaluate claims, and review audit logs.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center bg-surface-secondary p-0.5 rounded-lg border border-surface-border self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'items'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Items</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'claims'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Claims</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-surface text-ink shadow-xs'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit</span>
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      <div>
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'items' && <AdminItemsTab onSelectItem={onSelectItem} />}
        {activeTab === 'claims' && <AdminClaimsTab onOpenClaimReview={onOpenClaimReview} />}
        {activeTab === 'audit' && <AdminAuditLogsTab />}
      </div>
    </div>
  );
};

