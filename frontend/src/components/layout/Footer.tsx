import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-surface-border bg-app-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-muted">
        <p className="font-medium text-ink-secondary">
          Lost &amp; Found · SRM Ramapuram
        </p>
        <p>
          &copy; {new Date().getFullYear()} SRM Institute of Science and Technology
        </p>
      </div>
    </footer>
  );
};
