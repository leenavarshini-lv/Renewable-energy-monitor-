import React from 'react';
import {
  LayoutDashboard,
  Terminal,
  TableProperties,
  Network,
  Cpu,
  Layers,
  FileCode2,
  BarChart3,
  Server,
  Database,
} from 'lucide-react';
import { ViewMode } from '../types/rems';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  openAlertsCount?: number;
}

interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  openAlertsCount = 0,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: openAlertsCount },
    { id: 'sql-console', label: 'SQL Console', icon: Terminal },
    { id: 'table-browser', label: 'Table Browser (CRUD)', icon: TableProperties },
    { id: 'er-diagram', label: 'ER Diagram (Live)', icon: Network },
    { id: 'feature-demos', label: 'Feature Demos', icon: Cpu },
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'schema-normalization', label: 'Schema & Normalization', icon: FileCode2 },
    { id: 'database-stats', label: 'Database Stats & Reset', icon: BarChart3 },
  ];

  return (
    <aside className="w-56 bg-[#0B1018] border-r border-[#16202E] flex flex-col justify-between shrink-0 select-none">
      {/* Nav items */}
      <div className="py-2 flex flex-col gap-0.5">
        <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#7C8BA1]">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer border-l-2 ${
                isActive
                  ? 'bg-[#101724] text-[#E6EDF7] border-[#2F6BFF]'
                  : 'text-[#7C8BA1] hover:text-[#E6EDF7] hover:bg-[#0E141F] border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#5B9BFF]' : 'text-[#7C8BA1]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span className="font-mono text-[10px] bg-[#EF4444] text-white px-1.5 py-0.2 rounded-[2px] leading-none shrink-0 font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Specs */}
      <div className="p-3 border-t border-[#16202E] bg-[#070A0F] flex flex-col gap-1.5 text-[11px] font-mono text-[#7C8BA1]">
        <div className="flex items-center justify-between text-[#E6EDF7]">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#2F6BFF]" />
            <span>schema: rems</span>
          </span>
          <span className="text-[10px] text-[#10B981] bg-[#10B981]/10 px-1 py-0.2 rounded-[2px]">
            ACTIVE
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span>Statement Timeout</span>
          <span className="text-[#E6EDF7]">15,000ms</span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <span>Display Row Limit</span>
          <span className="text-[#E6EDF7]">1,000 rows</span>
        </div>

        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#16202E]">
          <span>REMS Console v2.4</span>
          <span className="text-[#5B9BFF]">PostgreSQL</span>
        </div>
      </div>
    </aside>
  );
};
