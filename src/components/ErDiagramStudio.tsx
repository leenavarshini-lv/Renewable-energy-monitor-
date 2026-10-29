import React, { useState } from 'react';
import {
  Network,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCode,
  Layers,
  Key,
  ExternalLink,
  Table,
  Eye
} from 'lucide-react';

interface EntityField {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  isUk?: boolean;
  fkRef?: string;
}

interface ErEntity {
  name: string;
  title: string;
  description: string;
  category: 'GENERATION' | 'CONSUMPTION' | 'SYSTEM' | 'FINANCIAL';
  fields: EntityField[];
}

const ER_ENTITIES: ErEntity[] = [
  {
    name: 'PLANT',
    title: 'Plant Facility',
    category: 'GENERATION',
    description: 'Renewable power generation station (Solar, Wind, Hydro)',
    fields: [
      { name: 'plant_id', type: 'int', isPk: true },
      { name: 'name', type: 'varchar(150)', isUk: true },
      { name: 'plant_type', type: 'varchar(20)' },
      { name: 'capacity_kw', type: 'numeric(12,2)' },
      { name: 'location', type: 'varchar(100)' },
      { name: 'commissioned_on', type: 'date' },
      { name: 'status', type: 'varchar(30)' }
    ]
  },
  {
    name: 'EQUIPMENT',
    title: 'Plant Machinery',
    category: 'GENERATION',
    description: 'Inverters, trackers, turbines, transformers, and SCADA apparatus',
    fields: [
      { name: 'equipment_id', type: 'int', isPk: true },
      { name: 'plant_id', type: 'int', isFk: true, fkRef: 'PLANT.plant_id' },
      { name: 'equip_type', type: 'varchar(60)' },
      { name: 'model', type: 'varchar(120)' },
      { name: 'installed_on', type: 'date' },
      { name: 'warranty_end', type: 'date' },
      { name: 'health', type: 'varchar(20)' }
    ]
  },
  {
    name: 'BATTERY',
    title: 'BESS Unit',
    category: 'GENERATION',
    description: 'Grid-connected battery energy storage systems',
    fields: [
      { name: 'battery_id', type: 'int', isPk: true },
      { name: 'plant_id', type: 'int', isFk: true, fkRef: 'PLANT.plant_id' },
      { name: 'capacity_kwh', type: 'numeric(10,2)' },
      { name: 'charge_pct', type: 'numeric(5,2)' },
      { name: 'cycles', type: 'int' }
    ]
  },
  {
    name: 'GENERATION_RECORD',
    title: 'Generation Telemetry',
    category: 'GENERATION',
    description: 'Power production intervals and diurnal solar/wind logs',
    fields: [
      { name: 'gen_id', type: 'bigint', isPk: true },
      { name: 'plant_id', type: 'int', isFk: true, fkRef: 'PLANT.plant_id' },
      { name: 'gen_date', type: 'date' },
      { name: 'units_kwh', type: 'numeric(14,2)' }
    ]
  },
  {
    name: 'CARBON_CREDIT',
    title: 'Carbon Avoidance',
    category: 'GENERATION',
    description: 'Renewable offsets certified with CEA factor (0.71 kg/kWh)',
    fields: [
      { name: 'credit_id', type: 'int', isPk: true },
      { name: 'plant_id', type: 'int', isFk: true, fkRef: 'PLANT.plant_id' },
      { name: 'credit_month', type: 'date' },
      { name: 'units_kwh', type: 'numeric(14,2)' },
      { name: 'co2_avoided_kg', type: 'numeric(14,2)' }
    ]
  },
  {
    name: 'TARIFF',
    title: 'Tariff Schedule',
    category: 'FINANCIAL',
    description: 'Regulated retail electricity rates per consumer category',
    fields: [
      { name: 'tariff_id', type: 'int', isPk: true },
      { name: 'category', type: 'varchar(50)', isUk: true },
      { name: 'import_rate', type: 'numeric(8,2)' }
    ]
  },
  {
    name: 'CONSUMER',
    title: 'Consumer / Prosumer',
    category: 'CONSUMPTION',
    description: 'Grid electricity customer (Household, Commercial, Industrial)',
    fields: [
      { name: 'consumer_id', type: 'int', isPk: true },
      { name: 'tariff_id', type: 'int', isFk: true, fkRef: 'TARIFF.tariff_id' },
      { name: 'name', type: 'varchar(150)' },
      { name: 'address', type: 'varchar(255)' },
      { name: 'has_solar', type: 'boolean' }
    ]
  },
  {
    name: 'METER',
    title: 'Smart Meter Hardware',
    category: 'CONSUMPTION',
    description: 'Bidirectional net metering device measuring import/export',
    fields: [
      { name: 'meter_id', type: 'int', isPk: true },
      { name: 'consumer_id', type: 'int', isFk: true, fkRef: 'CONSUMER.consumer_id' },
      { name: 'installed_on', type: 'date' }
    ]
  },
  {
    name: 'METER_READING',
    title: 'Interval Reading',
    category: 'CONSUMPTION',
    description: 'Time-series consumption and rooftop solar export kWh',
    fields: [
      { name: 'reading_id', type: 'bigint', isPk: true },
      { name: 'meter_id', type: 'int', isFk: true, fkRef: 'METER.meter_id' },
      { name: 'reading_date', type: 'date' },
      { name: 'import_kwh', type: 'numeric(12,2)' },
      { name: 'export_kwh', type: 'numeric(12,2)' }
    ]
  },
  {
    name: 'BILL',
    title: 'Net Metering Bill',
    category: 'FINANCIAL',
    description: 'Monthly Discom statement with net energy and solar credits',
    fields: [
      { name: 'bill_id', type: 'bigint', isPk: true },
      { name: 'consumer_id', type: 'int', isFk: true, fkRef: 'CONSUMER.consumer_id' },
      { name: 'meter_id', type: 'int', isFk: true, fkRef: 'METER.meter_id' },
      { name: 'bill_month', type: 'date' },
      { name: 'import_kwh', type: 'numeric(12,2)' },
      { name: 'export_kwh', type: 'numeric(12,2)' },
      { name: 'credit_in_kwh', type: 'numeric(12,2)' },
      { name: 'net_kwh', type: 'numeric(12,2)' },
      { name: 'credit_out_kwh', type: 'numeric(12,2)' },
      { name: 'amount', type: 'numeric(12,2)' },
      { name: 'status', type: 'varchar(30)' }
    ]
  },
  {
    name: 'ALERT',
    title: 'Grid Alert',
    category: 'SYSTEM',
    description: 'Automatic warnings for low battery, low output, and warranty',
    fields: [
      { name: 'alert_id', type: 'bigint', isPk: true },
      { name: 'alert_type', type: 'varchar(60)' },
      { name: 'ref_table', type: 'varchar(60)' },
      { name: 'ref_id', type: 'bigint' },
      { name: 'message', type: 'varchar(500)' },
      { name: 'created_at', type: 'timestamp' },
      { name: 'resolved', type: 'boolean' }
    ]
  },
  {
    name: 'CONFIG',
    title: 'System Parameter',
    category: 'SYSTEM',
    description: 'Simulation factors, emission baseline, and alert thresholds',
    fields: [
      { name: 'key', type: 'varchar(100)', isPk: true },
      { name: 'value', type: 'numeric(12,4)' },
      { name: 'note', type: 'varchar(255)' }
    ]
  },
  {
    name: 'AUDIT_LOG',
    title: 'Audit Trail',
    category: 'SYSTEM',
    description: 'Immutable ledger of tariff updates and billing modifications',
    fields: [
      { name: 'log_id', type: 'bigint', isPk: true },
      { name: 'table_name', type: 'varchar(80)' },
      { name: 'action', type: 'varchar(60)' },
      { name: 'old_data', type: 'jsonb' },
      { name: 'new_data', type: 'jsonb' },
      { name: 'changed_by', type: 'varchar(120)' },
      { name: 'changed_at', type: 'timestamp' }
    ]
  }
];

const SQL_DDL = `-- ===============================================================
-- Renewable Energy Management System (REMS)
-- Database Relational Schema (PostgreSQL / Relational / Cloud SQL)
-- Grounded on ER Diagram Schema
-- ===============================================================

CREATE TABLE plant (
    plant_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    plant_type VARCHAR(20) NOT NULL CHECK (plant_type IN ('SOLAR', 'WIND', 'HYDRO')),
    capacity_kw NUMERIC(12, 2) NOT NULL CHECK (capacity_kw > 0),
    location VARCHAR(100) NOT NULL,
    commissioned_on DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE equipment (
    equipment_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES plant(plant_id) ON DELETE CASCADE,
    equip_type VARCHAR(60) NOT NULL,
    model VARCHAR(120) NOT NULL,
    installed_on DATE NOT NULL,
    warranty_end DATE NOT NULL,
    health VARCHAR(20) NOT NULL CHECK (health IN ('GOOD', 'WARNING', 'FAULTY'))
);

CREATE TABLE battery (
    battery_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES plant(plant_id) ON DELETE CASCADE,
    capacity_kwh NUMERIC(10, 2) NOT NULL CHECK (capacity_kwh > 0),
    charge_pct NUMERIC(5, 2) NOT NULL CHECK (charge_pct BETWEEN 0 AND 100),
    cycles INT NOT NULL DEFAULT 0
);

CREATE TABLE generation_record (
    gen_id BIGSERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES plant(plant_id) ON DELETE CASCADE,
    gen_date DATE NOT NULL,
    units_kwh NUMERIC(14, 2) NOT NULL CHECK (units_kwh >= 0)
);

CREATE TABLE carbon_credit (
    credit_id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES plant(plant_id) ON DELETE CASCADE,
    credit_month DATE NOT NULL,
    units_kwh NUMERIC(14, 2) NOT NULL CHECK (units_kwh >= 0),
    co2_avoided_kg NUMERIC(14, 2) NOT NULL CHECK (co2_avoided_kg >= 0)
);

CREATE TABLE tariff (
    tariff_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL UNIQUE CHECK (category IN ('HOUSEHOLD', 'COMMERCIAL', 'INDUSTRIAL')),
    import_rate NUMERIC(8, 2) NOT NULL CHECK (import_rate > 0)
);

CREATE TABLE consumer (
    consumer_id SERIAL PRIMARY KEY,
    tariff_id INT NOT NULL REFERENCES tariff(tariff_id),
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    has_solar BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE meter (
    meter_id SERIAL PRIMARY KEY,
    consumer_id INT NOT NULL REFERENCES consumer(consumer_id) ON DELETE CASCADE,
    installed_on DATE NOT NULL
);

CREATE TABLE meter_reading (
    reading_id BIGSERIAL PRIMARY KEY,
    meter_id INT NOT NULL REFERENCES meter(meter_id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    import_kwh NUMERIC(12, 2) NOT NULL CHECK (import_kwh >= 0),
    export_kwh NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (export_kwh >= 0)
);

CREATE TABLE bill (
    bill_id BIGSERIAL PRIMARY KEY,
    consumer_id INT NOT NULL REFERENCES consumer(consumer_id) ON DELETE CASCADE,
    meter_id INT NOT NULL REFERENCES meter(meter_id) ON DELETE CASCADE,
    bill_month DATE NOT NULL,
    import_kwh NUMERIC(12, 2) NOT NULL,
    export_kwh NUMERIC(12, 2) NOT NULL DEFAULT 0,
    credit_in_kwh NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_kwh NUMERIC(12, 2) NOT NULL,
    credit_out_kwh NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID'))
);

CREATE TABLE alert (
    alert_id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(60) NOT NULL CHECK (alert_type IN ('LOW_BATTERY', 'LOW_OUTPUT', 'WARRANTY_EXPIRY')),
    ref_table VARCHAR(60) NOT NULL,
    ref_id BIGINT NOT NULL,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE config (
    key VARCHAR(100) PRIMARY KEY,
    value NUMERIC(12, 4) NOT NULL,
    note VARCHAR(255) NOT NULL
);

CREATE TABLE audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(80) NOT NULL,
    action VARCHAR(60) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(120) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX idx_gen_plant_date ON generation_record(plant_id, gen_date);
CREATE INDEX idx_bill_consumer_month ON bill(consumer_id, bill_month);
CREATE INDEX idx_reading_meter_date ON meter_reading(meter_id, reading_date);
CREATE INDEX idx_alert_resolved ON alert(resolved, created_at DESC);
`;

export const ErDiagramStudio: React.FC = () => {
  const [viewMode, setViewMode] = useState<'diagram' | 'tables' | 'sql'>('diagram');
  const [copiedSql, setCopiedSql] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_DDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const filteredEntities = ER_ENTITIES.filter(
    e => filterCategory === 'ALL' || e.category === filterCategory
  );

  return (
    <div className="space-y-6">
      {/* Studio Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Network className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Database Entity-Relationship (ER) Architecture Studio
                </h2>
                <p className="text-xs text-slate-400">
                  Visual ER diagram schema, foreign key relations, constraints, and DDL export
                </p>
              </div>
            </div>
          </div>

          {/* Sub-view switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs font-semibold">
              <button
                onClick={() => setViewMode('diagram')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'diagram'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Diagram</span>
              </button>
              <button
                onClick={() => setViewMode('tables')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'tables'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Schema Entities (13)</span>
              </button>
              <button
                onClick={() => setViewMode('sql')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'sql'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>SQL DDL</span>
              </button>
            </div>

            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL' : 'Copy DDL'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Total Entities</span>
            <span className="text-white font-bold font-mono">13 Tables</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Primary Relationships</span>
            <span className="text-indigo-400 font-bold font-mono">10 Relational Keys (1:N)</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Cardinals Defined</span>
            <span className="text-emerald-400 font-bold font-mono">has, stores, produces, owns</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-slate-500 block text-[11px]">Database Engine</span>
            <span className="text-amber-300 font-bold font-mono">Cloud Firestore / SQL Compatible</span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'diagram' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="p-4 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">
                Entity-Relationship Diagram Architecture View
              </span>
            </div>
            <a
              href="/assets/aistudio/er_diagram_f1a967dd.png"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Open Full High-Res Asset</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-4 bg-slate-950 flex flex-col items-center justify-center overflow-auto min-h-[500px]">
            <img
              src="/assets/aistudio/er_diagram_f1a967dd.png"
              alt="Renewable Energy Management System ER Diagram"
              className="max-w-full h-auto rounded-xl shadow-2xl border border-slate-800/80 object-contain hover:scale-[1.01] transition-transform duration-200"
            />
          </div>
        </div>
      ) : viewMode === 'tables' ? (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Filter Domain:</span>
            {['ALL', 'GENERATION', 'CONSUMPTION', 'FINANCIAL', 'SYSTEM'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Entity Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntities.map(entity => {
              const isSelected = selectedEntity === entity.name;
              return (
                <div
                  key={entity.name}
                  onClick={() => setSelectedEntity(isSelected ? null : entity.name)}
                  className={`bg-slate-900 border rounded-2xl p-4 shadow-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-slate-900/95'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-white">
                          {entity.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {entity.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{entity.title}</p>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {entity.fields.length} cols
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 py-2.5 border-b border-slate-800/60 leading-relaxed">
                    {entity.description}
                  </p>

                  <div className="pt-2 divide-y divide-slate-800/40">
                    {entity.fields.map(field => (
                      <div
                        key={field.name}
                        className="py-1.5 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          {field.isPk && (
                            <span className="px-1 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              PK
                            </span>
                          )}
                          {field.isFk && (
                            <span
                              className="px-1 py-0.2 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold"
                              title={`FK -> ${field.fkRef}`}
                            >
                              FK
                            </span>
                          )}
                          {field.isUk && (
                            <span className="px-1 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                              UK
                            </span>
                          )}
                          <span
                            className={
                              field.isPk
                                ? 'text-amber-200 font-semibold'
                                : field.isFk
                                ? 'text-sky-200'
                                : 'text-slate-200'
                            }
                          >
                            {field.name}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px]">{field.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/60 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                schema.sql (PostgreSQL / Relational DDL Script)
              </span>
            </div>
            <button
              onClick={handleCopySql}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>
          <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 max-h-[600px] overflow-auto leading-relaxed">
            <pre>{SQL_DDL}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
