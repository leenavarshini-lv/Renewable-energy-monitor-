import React, { useState, useEffect } from 'react';
import { ViewMode, DBStatus, ToastItem } from './types/rems';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { ConnectionModal } from './components/ConnectionModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import { DashboardPage } from './pages/DashboardPage';
import { SqlConsolePage } from './pages/SqlConsolePage';
import { TableBrowserPage } from './pages/TableBrowserPage';
import { ErDiagramPage } from './pages/ErDiagramPage';
import { FeatureDemosPage } from './pages/FeatureDemosPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SchemaNormalizationPage } from './pages/SchemaNormalizationPage';
import { DatabaseStatsPage } from './pages/DatabaseStatsPage';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [targetTable, setTargetTable] = useState<string>('plant');
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [inTransaction, setInTransaction] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Modals
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Fetch DB status
  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error('Failed to fetch DB status', err);
    }
  };

  useEffect(() => {
    fetchDbStatus();
    const interval = setInterval(fetchDbStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Global keyboard shortcuts (Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast notification dispatcher
  const addToast = (title: string, sql?: string, durationMs?: number) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = {
      id,
      title,
      sql,
      type: title.toLowerCase().includes('error') ? 'error' : 'success',
      durationMs,
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Connect to custom PostgreSQL database
  const handleConnect = async (url: string) => {
    const res = await fetch('/api/db/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionString: url }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Connection failed');
    fetchDbStatus();
    addToast('PostgreSQL Pool Connected', url.replace(/:[^:@]+@/, ':****@'), 12);
  };

  // Disconnect back to emulated engine
  const handleDisconnect = async () => {
    const res = await fetch('/api/db/disconnect', { method: 'POST' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    fetchDbStatus();
    addToast('Switched to Emulated PG', 'rems (in-memory pg emulation)', 2);
  };

  // Export full report bundle
  const handleExportReport = () => {
    window.open('/api/db/export', '_blank');
    addToast('Report Export Triggered', 'rems_complete_report.json downloaded', 10);
  };

  const handleNavigate = (view: ViewMode, table?: string) => {
    setCurrentView(view);
    if (table) {
      setTargetTable(table);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#05070B] text-[#E6EDF7] font-sans">
      {/* Top Header */}
      <Header
        status={dbStatus}
        onOpenConnectionModal={() => setConnectionModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onExportReport={handleExportReport}
        inTransaction={inTransaction}
      />

      {/* Main Workspace: Sidebar + Active Page */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          openAlertsCount={3}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {currentView === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onExecuteSqlToast={addToast}
            />
          )}

          {currentView === 'sql-console' && (
            <SqlConsolePage
              onExecuteSqlToast={addToast}
              inTransaction={inTransaction}
              onSetInTransaction={setInTransaction}
            />
          )}

          {currentView === 'table-browser' && (
            <TableBrowserPage
              initialTable={targetTable}
              onExecuteSqlToast={addToast}
            />
          )}

          {currentView === 'er-diagram' && <ErDiagramPage />}

          {currentView === 'feature-demos' && (
            <FeatureDemosPage onExecuteSqlToast={addToast} />
          )}

          {currentView === 'architecture' && <ArchitecturePage />}

          {currentView === 'schema-normalization' && <SchemaNormalizationPage />}

          {currentView === 'database-stats' && (
            <DatabaseStatsPage onExecuteSqlToast={addToast} />
          )}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ConnectionModal
        isOpen={connectionModalOpen}
        status={dbStatus}
        onClose={() => setConnectionModalOpen(false)}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onRefresh={fetchDbStatus}
      />

      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleNavigate}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
