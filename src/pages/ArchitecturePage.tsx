import React, { useState } from 'react';
import {
  Layers,
  Globe,
  Server,
  Database,
  Shield,
  Activity,
  FileCode2,
  Table,
  Zap,
  Info,
  X,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface ArchBlock {
  id: string;
  name: string;
  category: 'tier' | 'engine' | 'table' | 'trigger' | 'function' | 'role' | 'view' | 'audit';
  description: string;
  dbmsConcept: string;
  details: string;
}

export const ArchitecturePage: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState<ArchBlock | null>(null);

  const blocks: ArchBlock[] = [
    {
      id: 'browser-ui',
      name: 'Client Browser (React + Vite)',
      category: 'tier',
      description: 'Single Page Application (SPA) running in client browser with dark database operator console UI.',
      dbmsConcept: 'Presentation Layer (Separation of Concerns)',
      details: 'The browser NEVER connects directly to the database or handles database credentials. All queries, DML, and transactions are routed to the Express proxy over REST JSON endpoints.'
    },
    {
      id: 'express-api',
      name: 'Express Backend (Node.js + pg.Pool)',
      category: 'tier',
      description: 'Central proxy API server managing connection pooling, statement timeouts, and transactional sessions.',
      dbmsConcept: 'Connection Pooling & Query Gatekeeper',
      details: 'Maintains a pool of 10 persistent client connections to PostgreSQL. Injects SET statement_timeout = 15000, sanitizes parameters, enforces row limits, and exposes administrative REST endpoints.'
    },
    {
      id: 'pg-kernel',
      name: 'PostgreSQL Database Engine (Schema: rems)',
      category: 'engine',
      description: 'Relational DBMS engine enforcing ACID compliance, constraints, procedural triggers, and catalog schemas.',
      dbmsConcept: 'ACID Storage Engine & Relational Integrity',
      details: 'Houses the complete rems schema with 13 strongly-typed tables, primary/foreign key cascading rules, check constraints, B-Tree indexes, and MVCC transaction isolation.'
    },
    {
      id: 'tables-core',
      name: '13 Relational Tables',
      category: 'table',
      description: 'Normalized database structure covering facilities, generation, consumers, meters, and billing.',
      dbmsConcept: '3NF Relational Modeling & Foreign Key Integrity',
      details: 'Includes plant, equipment, battery, generation_record, tariff, consumer, meter, meter_reading, bill, carbon_credit, alert, config, and audit_log.'
    },
    {
      id: 'triggers',
      name: 'Event Triggers (trg_battery_low, trg_low_output, trg_audit)',
      category: 'trigger',
      description: 'Automatic procedural hooks fired synchronously on DML operations.',
      dbmsConcept: 'Active Database Rules & Declarative Invariants',
      details: 'trg_battery_low detects charge_pct <= 20% and auto-generates alerts. trg_low_output checks daily yield against plant capacity. trg_audit_tariff and trg_audit_bill capture JSONB change logs.'
    },
    {
      id: 'functions',
      name: 'Stored Procedures (generate_bills, calc_carbon_credits)',
      category: 'function',
      description: 'Server-side PL/pgSQL algorithms executing within database memory.',
      dbmsConcept: 'In-Database Computation & Reduced Network Round-Trips',
      details: 'generate_bills() computes net meter imports, exports, carryover credits, and tariff fees in a single atomic database function. calc_carbon_credits() aggregates generation with grid factors.'
    },
    {
      id: 'roles',
      name: 'RBAC Roles (rems_admin, rems_operator, rems_consumer)',
      category: 'role',
      description: 'PostgreSQL role grants restricting table and operation access.',
      dbmsConcept: 'Role-Based Access Control (RBAC) & Defense-in-Depth',
      details: 'rems_admin has full privileges. rems_operator can insert telemetry and generation but cannot alter tariffs or bills. rems_consumer can only view consumer and metering data.'
    },
    {
      id: 'mat-view',
      name: 'Materialized View (mv_monthly_plant_summary)',
      category: 'view',
      description: 'Pre-computed snapshot aggregating monthly plant yields, CO2 avoidance, and alert counts.',
      dbmsConcept: 'Query Optimization & Analytical Snapshots',
      details: 'Stores physically cached aggregation results to avoid expensive JOINs and SUMs during dashboard reads. Refreshed periodically via REFRESH MATERIALIZED VIEW.'
    },
    {
      id: 'audit-log',
      name: 'Immutable Audit Log (rems.audit_log)',
      category: 'audit',
      description: 'Append-only ledger storing actor, timestamp, old JSONB, and new JSONB values.',
      dbmsConcept: 'Auditability, Traceability & Regulatory Compliance',
      details: 'Guarantees full historical accountability for tariff and bill adjustments without allowing in-place edits or deletions to past entries.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#05070B]">
      {/* Header */}
      <div className="h-11 bg-[#0B1018] border-b border-[#16202E] px-4 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2F6BFF]" />
          <span className="font-mono font-semibold text-[#E6EDF7] tracking-wider uppercase">
            REMS System &amp; PostgreSQL Internal Architecture
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#7C8BA1]">
          Click any component to inspect DBMS concept &amp; operational logic
        </span>
      </div>

      {/* Main Diagram Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full">
        {/* Tier 1: Client Browser */}
        <div
          onClick={() => setSelectedBlock(blocks[0])}
          className="bg-[#0B1018] border border-[#16202E] hover:border-[#2F6BFF] p-4 rounded-[2px] cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#101724] border border-[#16202E] rounded-[2px] text-[#5B9BFF]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono text-xs font-semibold text-[#E6EDF7] group-hover:text-[#5B9BFF]">
                Tier 1: Presentation Layer (React + Vite Client)
              </div>
              <div className="text-[11px] text-[#7C8BA1]">
                Zero direct database connection • Monaco SQL Console • Recharts Visualizer • Live ER Canvas
              </div>
            </div>
          </div>
          <span className="font-mono text-[11px] text-[#5B9BFF] opacity-0 group-hover:opacity-100 transition-opacity">
            Inspect →
          </span>
        </div>

        {/* Downward Connector */}
        <div className="flex items-center justify-center -my-3">
          <div className="h-6 w-0.5 bg-[#16202E] relative flex items-center justify-center">
            <span className="absolute font-mono text-[9px] text-[#7C8BA1] bg-[#05070B] px-1 py-0.2 border border-[#16202E] rounded-[2px]">
              REST / JSON
            </span>
          </div>
        </div>

        {/* Tier 2: Express Proxy */}
        <div
          onClick={() => setSelectedBlock(blocks[1])}
          className="bg-[#0B1018] border border-[#16202E] hover:border-[#2F6BFF] p-4 rounded-[2px] cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#101724] border border-[#16202E] rounded-[2px] text-[#10B981]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono text-xs font-semibold text-[#E6EDF7] group-hover:text-[#5B9BFF]">
                Tier 2: Application Proxy (Node.js + Express + pg.Pool)
              </div>
              <div className="text-[11px] text-[#7C8BA1]">
                DATABASE_URL protected in server .env • 15s statement_timeout • Transaction Session Handler
              </div>
            </div>
          </div>
          <span className="font-mono text-[11px] text-[#5B9BFF] opacity-0 group-hover:opacity-100 transition-opacity">
            Inspect →
          </span>
        </div>

        {/* Downward Connector */}
        <div className="flex items-center justify-center -my-3">
          <div className="h-6 w-0.5 bg-[#16202E] relative flex items-center justify-center">
            <span className="absolute font-mono text-[9px] text-[#7C8BA1] bg-[#05070B] px-1 py-0.2 border border-[#16202E] rounded-[2px]">
              PostgreSQL Wire Protocol
            </span>
          </div>
        </div>

        {/* Tier 3: PostgreSQL Database Schema Box */}
        <div className="bg-[#080D14] border-2 border-[#16202E] rounded-[3px] p-5 flex flex-col gap-4">
          <div
            onClick={() => setSelectedBlock(blocks[2])}
            className="flex items-center justify-between pb-3 border-b border-[#16202E] cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#2F6BFF]" />
              <div>
                <span className="font-mono text-xs font-bold text-[#E6EDF7] group-hover:text-[#5B9BFF]">
                  Tier 3: PostgreSQL RDBMS Engine (Schema: rems)
                </span>
                <p className="text-[11px] text-[#7C8BA1]">
                  ACID Storage • System Catalog (information_schema) • Constraints &amp; B-Tree Indexes
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-[2px] border border-[#10B981]/30">
              SCHEMA BOUNDARY
            </span>
          </div>

          {/* Internal Database Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Tables Block */}
            <div
              onClick={() => setSelectedBlock(blocks[3])}
              className="bg-[#0B1018] border border-[#16202E] hover:border-[#5B9BFF] p-3 rounded-[2px] cursor-pointer transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#E6EDF7]">
                <Table className="w-3.5 h-3.5 text-[#5B9BFF]" />
                <span>13 Relational Tables</span>
              </div>
              <p className="text-[11px] text-[#7C8BA1]">
                3NF structure, cascading foreign keys, check constraints, default sequences.
              </p>
            </div>

            {/* Triggers Block */}
            <div
              onClick={() => setSelectedBlock(blocks[4])}
              className="bg-[#0B1018] border border-[#16202E] hover:border-[#EF4444] p-3 rounded-[2px] cursor-pointer transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#EF4444]">
                <Zap className="w-3.5 h-3.5" />
                <span>4 Event Triggers</span>
              </div>
              <p className="text-[11px] text-[#7C8BA1]">
                trg_battery_low, trg_low_output, trg_audit_tariff, trg_audit_bill.
              </p>
            </div>

            {/* Stored Functions Block */}
            <div
              onClick={() => setSelectedBlock(blocks[5])}
              className="bg-[#0B1018] border border-[#16202E] hover:border-[#10B981] p-3 rounded-[2px] cursor-pointer transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#10B981]">
                <FileCode2 className="w-3.5 h-3.5" />
                <span>PL/pgSQL Functions</span>
              </div>
              <p className="text-[11px] text-[#7C8BA1]">
                generate_bills(), calc_carbon_credits(), check_warranty_alerts().
              </p>
            </div>

            {/* RBAC Roles Block */}
            <div
              onClick={() => setSelectedBlock(blocks[6])}
              className="bg-[#0B1018] border border-[#16202E] hover:border-[#F59E0B] p-3 rounded-[2px] cursor-pointer transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#F59E0B]">
                <Shield className="w-3.5 h-3.5" />
                <span>3 RBAC Database Roles</span>
              </div>
              <p className="text-[11px] text-[#7C8BA1]">
                rems_admin, rems_operator, rems_consumer.
              </p>
            </div>

            {/* Materialized View Block */}
            <div
              onClick={() => setSelectedBlock(blocks[7])}
              className="bg-[#0B1018] border border-[#16202E] hover:border-[#5B9BFF] p-3 rounded-[2px] cursor-pointer transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#5B9BFF]">
                <Activity className="w-3.5 h-3.5" />
                <span>Materialized View</span>
              </div>
              <p className="text-[11px] text-[#7C8BA1]">
                mv_monthly_plant_summary pre-computes heavy analytical JOINs.
              </p>
            </div>

            {/* Audit Log Block */}
            <div
              onClick={() => setSelectedBlock(blocks[8])}
              className="bg-[#0B1018] border border-[#16202E] hover:border-[#10B981] p-3 rounded-[2px] cursor-pointer transition-all flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#10B981]">
                <Layers className="w-3.5 h-3.5" />
                <span>Audit Log (JSONB)</span>
              </div>
              <p className="text-[11px] text-[#7C8BA1]">
                rems.audit_log captures old/new JSONB snapshots on DML operations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[1px] p-4">
          <div className="bg-[#0B1018] border border-[#16202E] w-full max-w-lg rounded-[3px] shadow-2xl flex flex-col overflow-hidden text-xs">
            <div className="bg-[#0E141F] border-b border-[#16202E] px-4 py-3 flex items-center justify-between">
              <span className="font-mono font-semibold text-xs tracking-wider uppercase text-[#5B9BFF]">
                {selectedBlock.name}
              </span>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-[#7C8BA1] hover:text-[#E6EDF7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="bg-[#05070B] border border-[#16202E] p-3 rounded-[2px] flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-[#7C8BA1]">
                  DBMS Architectural Concept:
                </span>
                <span className="font-mono text-xs font-semibold text-[#10B981]">
                  {selectedBlock.dbmsConcept}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-[#7C8BA1]">Purpose:</span>
                <p className="text-xs text-[#E6EDF7] leading-relaxed">
                  {selectedBlock.description}
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-[#7C8BA1]">Implementation Details:</span>
                <p className="text-xs text-[#7C8BA1] leading-relaxed">
                  {selectedBlock.details}
                </p>
              </div>

              <div className="pt-2 border-t border-[#16202E] flex justify-end">
                <button
                  onClick={() => setSelectedBlock(null)}
                  className="px-3 py-1.5 bg-[#101722] hover:bg-[#16202E] border border-[#16202E] text-xs font-mono text-[#E6EDF7] rounded-[2px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
