import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  Database,
  Layers,
  Zap,
} from 'lucide-react';

export const SchemaNormalizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'normalization' | 'denormalization' | 'ddl'>('normalization');
  const [copiedTable, setCopiedTable] = useState<string | null>(null);

  const copyToClipboard = (code: string, tableName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTable(tableName);
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const ddlExamples: Record<string, string> = {
    plant: `CREATE TABLE rems.plant (
    plant_id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    plant_type VARCHAR(20) NOT NULL CHECK (plant_type IN ('SOLAR', 'WIND', 'HYDRO')),
    capacity_kw NUMERIC(10, 2) NOT NULL CHECK (capacity_kw > 0),
    location VARCHAR(120) NOT NULL,
    commissioned_on DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'))
);`,
    equipment: `CREATE TABLE rems.equipment (
    equipment_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES rems.plant(plant_id) ON DELETE CASCADE,
    equip_type VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    installed_on DATE NOT NULL,
    warranty_end DATE NOT NULL,
    health VARCHAR(20) NOT NULL DEFAULT 'GOOD' CHECK (health IN ('GOOD', 'WARNING', 'CRITICAL'))
);
CREATE INDEX idx_equipment_warranty ON rems.equipment (warranty_end);`,
    battery: `CREATE TABLE rems.battery (
    battery_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES rems.plant(plant_id) ON DELETE CASCADE,
    capacity_kwh NUMERIC(10, 2) NOT NULL CHECK (capacity_kwh > 0),
    charge_pct NUMERIC(5, 2) NOT NULL CHECK (charge_pct BETWEEN 0 AND 100),
    cycles INT NOT NULL DEFAULT 0 CHECK (cycles >= 0)
);
CREATE INDEX idx_battery_plant ON rems.battery (plant_id);`,
    generation_record: `CREATE TABLE rems.generation_record (
    gen_id BIGSERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES rems.plant(plant_id) ON DELETE CASCADE,
    gen_date DATE NOT NULL,
    units_kwh NUMERIC(12, 2) NOT NULL CHECK (units_kwh >= 0),
    CONSTRAINT uq_plant_gen_date UNIQUE (plant_id, gen_date)
);
CREATE INDEX idx_generation_plant_date ON rems.generation_record (plant_id, gen_date);`,
    tariff: `CREATE TABLE rems.tariff (
    tariff_id SERIAL PRIMARY KEY,
    category VARCHAR(30) NOT NULL UNIQUE CHECK (category IN ('HOUSEHOLD', 'COMMERCIAL', 'INDUSTRIAL')),
    import_rate NUMERIC(6, 2) NOT NULL CHECK (import_rate > 0)
);`,
    consumer: `CREATE TABLE rems.consumer (
    consumer_id SERIAL PRIMARY KEY,
    tariff_id INT NOT NULL REFERENCES rems.tariff(tariff_id),
    name VARCHAR(120) NOT NULL,
    address VARCHAR(255) NOT NULL,
    has_solar BOOLEAN NOT NULL DEFAULT FALSE
);`,
    meter: `CREATE TABLE rems.meter (
    meter_id SERIAL PRIMARY KEY,
    consumer_id INT NOT NULL REFERENCES rems.consumer(consumer_id) ON DELETE CASCADE,
    installed_on DATE NOT NULL
);`,
    meter_reading: `CREATE TABLE rems.meter_reading (
    reading_id BIGSERIAL PRIMARY KEY,
    meter_id INT NOT NULL REFERENCES rems.meter(meter_id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    import_kwh NUMERIC(10, 2) NOT NULL CHECK (import_kwh >= 0),
    export_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (export_kwh >= 0),
    CONSTRAINT uq_meter_reading_date UNIQUE (meter_id, reading_date)
);
CREATE INDEX idx_reading_meter_date ON rems.meter_reading (meter_id, reading_date);`,
    bill: `CREATE TABLE rems.bill (
    bill_id BIGSERIAL PRIMARY KEY,
    consumer_id INT NOT NULL REFERENCES rems.consumer(consumer_id),
    meter_id INT NOT NULL REFERENCES rems.meter(meter_id),
    bill_month DATE NOT NULL,
    import_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    export_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    credit_in_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    credit_out_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID')),
    CONSTRAINT uq_consumer_bill_month UNIQUE (consumer_id, bill_month)
);
CREATE INDEX idx_bill_consumer_month ON rems.bill (consumer_id, bill_month);`,
    carbon_credit: `CREATE TABLE rems.carbon_credit (
    credit_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES rems.plant(plant_id) ON DELETE CASCADE,
    credit_month DATE NOT NULL,
    units_kwh NUMERIC(14, 2) NOT NULL,
    co2_avoided_kg NUMERIC(14, 2) NOT NULL,
    CONSTRAINT uq_plant_credit_month UNIQUE (plant_id, credit_month)
);`,
    alert: `CREATE TABLE rems.alert (
    alert_id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('LOW_BATTERY', 'LOW_OUTPUT', 'WARRANTY_EXPIRY', 'SYSTEM_INFO')),
    ref_table VARCHAR(30) NOT NULL,
    ref_id BIGINT NOT NULL,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_alert_type_resolved ON rems.alert (alert_type, resolved);`,
    config: `CREATE TABLE rems.config (
    key VARCHAR(64) PRIMARY KEY,
    value NUMERIC(10, 4) NOT NULL,
    note VARCHAR(255)
);`,
    audit_log: `CREATE TABLE rems.audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(80) NOT NULL DEFAULT CURRENT_USER,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#05070B]">
      {/* Top Tabs */}
      <div className="h-11 bg-[#0B1018] border-b border-[#16202E] px-4 flex items-center justify-between shrink-0 text-xs select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('normalization')}
            className={`px-3 py-1.5 font-mono text-xs border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'normalization'
                ? 'border-[#2F6BFF] text-[#E6EDF7] bg-[#111824]'
                : 'border-transparent text-[#7C8BA1] hover:text-[#E6EDF7]'
            }`}
          >
            1NF → 2NF → 3NF Transformation
          </button>
          <button
            onClick={() => setActiveTab('denormalization')}
            className={`px-3 py-1.5 font-mono text-xs border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'denormalization'
                ? 'border-[#2F6BFF] text-[#E6EDF7] bg-[#111824]'
                : 'border-transparent text-[#7C8BA1] hover:text-[#E6EDF7]'
            }`}
          >
            4 Deliberate Denormalizations
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3 py-1.5 font-mono text-xs border-b-2 font-medium transition-colors cursor-pointer ${
              activeTab === 'ddl'
                ? 'border-[#2F6BFF] text-[#E6EDF7] bg-[#111824]'
                : 'border-transparent text-[#7C8BA1] hover:text-[#E6EDF7]'
            }`}
          >
            Catalog DDL Viewer
          </button>
        </div>

        <span className="font-mono text-[11px] text-[#7C8BA1] hidden sm:inline">
          DBMS Normal Form Auditing
        </span>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full flex flex-col gap-6 text-xs">
        {/* TAB 1: 1NF -> 2NF -> 3NF */}
        {activeTab === 'normalization' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                Relational Normalization Pipeline (1NF → 2NF → 3NF)
              </h2>
              <p className="text-xs text-[#7C8BA1] mt-0.5">
                How the Renewable Energy Management System schema eliminates update, insertion, and deletion anomalies.
              </p>
            </div>

            {/* 1NF Card */}
            <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#5B9BFF] font-mono text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>1NF: First Normal Form (Atomicity &amp; Key Uniqueness)</span>
              </div>
              <p className="text-[#E6EDF7] leading-relaxed">
                Every column contains strictly atomic, indivisible scalar values. Repeating groups and CSV strings (such as storing all daily generation numbers or multiple machine types inside one text column) are decomposed into separate child relations:
              </p>
              <div className="bg-[#05070B] border border-[#16202E] p-3 rounded-[2px] font-mono text-[11px] text-[#7C8BA1] flex flex-col gap-1">
                <div>• <code className="text-[#E6EDF7]">rems.generation_record</code> stores one discrete daily yield tuple per row with primary key <code className="text-[#5B9BFF]">gen_id</code>.</div>
                <div>• <code className="text-[#E6EDF7]">rems.meter_reading</code> stores individual timestamped energy imports/exports.</div>
                <div>• Unique composite constraints enforce integrity (<code className="text-[#5B9BFF]">uq_plant_gen_date</code>, <code className="text-[#5B9BFF]">uq_meter_reading_date</code>).</div>
              </div>
            </div>

            {/* 2NF Card */}
            <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#10B981] font-mono text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>2NF: Second Normal Form (Full Functional Dependency)</span>
              </div>
              <p className="text-[#E6EDF7] leading-relaxed">
                Every non-prime attribute is fully functionally dependent on the primary key, eliminating partial dependencies on composite keys:
              </p>
              <div className="bg-[#05070B] border border-[#16202E] p-3 rounded-[2px] font-mono text-[11px] text-[#7C8BA1] flex flex-col gap-1">
                <div>• Equipment attributes (<code className="text-[#E6EDF7]">model, warranty_end, health</code>) depend solely on <code className="text-[#5B9BFF]">equipment_id</code>, not embedded inside plant tables.</div>
                <div>• Meter installation metadata depends solely on <code className="text-[#5B9BFF]">meter_id</code>, isolated from meter readings.</div>
              </div>
            </div>

            {/* 3NF Card */}
            <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#F59E0B] font-mono text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>3NF: Third Normal Form (No Transitive Dependencies)</span>
              </div>
              <p className="text-[#E6EDF7] leading-relaxed">
                Non-prime attributes depend ONLY on the primary key and not on other non-key attributes (A → B → C transitive dependencies are eliminated):
              </p>
              <div className="bg-[#05070B] border border-[#16202E] p-3 rounded-[2px] font-mono text-[11px] text-[#7C8BA1] flex flex-col gap-1">
                <div>• Consumer does not store <code className="text-[#E6EDF7]">import_rate</code> directly. Tariff rates reside exclusively in <code className="text-[#5B9BFF]">rems.tariff</code> referenced via foreign key <code className="text-[#5B9BFF]">tariff_id</code>.</div>
                <div>• Updating an electricity tariff rate modifies exactly ONE tuple in <code className="text-[#E6EDF7]">rems.tariff</code> without risking inconsistent rates across millions of consumers.</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 4 DELIBERATE DENORMALIZATIONS */}
        {activeTab === 'denormalization' && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                The Four Deliberate Denormalizations in REMS
              </h2>
              <p className="text-xs text-[#7C8BA1] mt-0.5">
                In production high-volume databases, strict 3NF is selectively traded off for query throughput, point-in-time audit immutability, and indexing efficiency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Denorm 1 */}
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs font-semibold text-[#5B9BFF]">
                  <span>1. Bill Totals (amount, net_kwh)</span>
                  <span className="text-[10px] bg-[#2F6BFF]/10 text-[#5B9BFF] px-1.5 py-0.2 rounded-[2px]">
                    rems.bill
                  </span>
                </div>
                <p className="text-[#E6EDF7] leading-relaxed text-[11px]">
                  <strong>Strict 3NF Violation:</strong> <code className="font-mono">amount</code> and <code className="font-mono">net_kwh</code> can be calculated on-the-fly by summing 30 days of readings and multiplying by the tariff rate.
                </p>
                <p className="text-[#7C8BA1] leading-relaxed text-[11px]">
                  <strong>Engineering Rationale:</strong> Pre-calculating and persisting the final bill total prevents running resource-intensive aggregations across millions of raw meter readings every time a customer views their statement. Additionally, it freezes the billing amount in case subsequent tariff rates are updated in future months.
                </p>
              </div>

              {/* Denorm 2 */}
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs font-semibold text-[#10B981]">
                  <span>2. Direct bill.consumer_id Reference</span>
                  <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] px-1.5 py-0.2 rounded-[2px]">
                    rems.bill
                  </span>
                </div>
                <p className="text-[#E6EDF7] leading-relaxed text-[11px]">
                  <strong>Strict 3NF Violation:</strong> A bill already points to <code className="font-mono">meter_id</code>, and meter already points to <code className="font-mono">consumer_id</code>. Having both is redundant.
                </p>
                <p className="text-[#7C8BA1] leading-relaxed text-[11px]">
                  <strong>Engineering Rationale:</strong> Eliminates a two-table JOIN (<code className="font-mono">bill → meter → consumer</code>) on consumer-facing portal queries, enables direct compound indexing on <code className="font-mono">(consumer_id, bill_month)</code>, and facilitates horizontal table partitioning by customer.
                </p>
              </div>

              {/* Denorm 3 */}
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs font-semibold text-[#F59E0B]">
                  <span>3. carbon_credit.units_kwh Snapshot</span>
                  <span className="text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] px-1.5 py-0.2 rounded-[2px]">
                    rems.carbon_credit
                  </span>
                </div>
                <p className="text-[#E6EDF7] leading-relaxed text-[11px]">
                  <strong>Strict 3NF Violation:</strong> Total generation is already obtainable by summing <code className="font-mono">rems.generation_record</code> for that plant and month.
                </p>
                <p className="text-[#7C8BA1] leading-relaxed text-[11px]">
                  <strong>Engineering Rationale:</strong> Carbon credit registries (like Verra and Gold Standard) require immutable, certified monthly certificates. Storing the frozen generation total protects the credit ledger from post-hoc sensor calibrations or retroactive data adjustments in past generation rows.
                </p>
              </div>

              {/* Denorm 4 */}
              <div className="bg-[#0B1018] border border-[#16202E] p-4 rounded-[2px] flex flex-col gap-2">
                <div className="flex items-center justify-between font-mono text-xs font-semibold text-[#EF4444]">
                  <span>4. Alert Polymorphic Reference</span>
                  <span className="text-[10px] bg-[#EF4444]/10 text-[#EF4444] px-1.5 py-0.2 rounded-[2px]">
                    rems.alert
                  </span>
                </div>
                <p className="text-[#E6EDF7] leading-relaxed text-[11px]">
                  <strong>Strict 3NF Violation:</strong> Uses <code className="font-mono">ref_table</code> (varchar) + <code className="font-mono">ref_id</code> (bigint) instead of separate foreign key columns (<code className="font-mono">plant_id, equipment_id, battery_id</code>) or separate alert tables.
                </p>
                <p className="text-[#7C8BA1] leading-relaxed text-[11px]">
                  <strong>Engineering Rationale:</strong> Avoids creating a sparse table filled with NULL foreign keys or maintaining 4 separate alert tables with duplicate alert management logic. Enables a unified operational feed and consolidated index on <code className="font-mono">(alert_type, resolved)</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATALOG DDL VIEWER */}
        {activeTab === 'ddl' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold font-mono text-[#E6EDF7] uppercase tracking-wider">
                PostgreSQL Catalog DDL Definitions
              </h2>
              <p className="text-xs text-[#7C8BA1] mt-0.5">
                Exact DDL statements including data types, check constraints, foreign keys, and indexes.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {Object.entries(ddlExamples).map(([tableName, ddl]) => (
                <div
                  key={tableName}
                  className="bg-[#0B1018] border border-[#16202E] rounded-[2px] overflow-hidden"
                >
                  <div className="px-3 py-2 bg-[#0E141F] border-b border-[#16202E] flex items-center justify-between">
                    <span className="font-mono font-semibold text-xs text-[#5B9BFF]">
                      rems.{tableName}
                    </span>
                    <button
                      onClick={() => copyToClipboard(ddl, tableName)}
                      className="flex items-center gap-1 text-[11px] font-mono text-[#7C8BA1] hover:text-[#E6EDF7]"
                    >
                      {copiedTable === tableName ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          <span className="text-[#10B981]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy DDL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#05070B] font-mono text-[11px] text-[#A6C0FE] overflow-x-auto whitespace-pre">
                    {ddl}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
