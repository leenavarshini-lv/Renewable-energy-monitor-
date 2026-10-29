export type ViewMode =
  | 'dashboard'
  | 'sql-console'
  | 'table-browser'
  | 'er-diagram'
  | 'feature-demos'
  | 'architecture'
  | 'schema-normalization'
  | 'database-stats';

export interface DBStatus {
  connected: boolean;
  mode: 'postgres' | 'simulation';
  dbName: string;
  host: string;
  version: string;
  tableCount: number;
  connectionString?: string;
  error?: string;
}

export interface TableColumn {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
  isPrimaryKey: boolean;
  foreignKey?: {
    foreignTable: string;
    foreignColumn: string;
    constraintName: string;
  };
}

export interface TableMeta {
  tableName: string;
  columns: TableColumn[];
  rowCount: number;
  totalSize?: string;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: { name: string; dataTypeID?: number; type?: string }[];
  durationMs: number;
  command: string;
  plan?: any;
}

export interface QueryError {
  error: string;
  code?: string;
  detail?: string | null;
  hint?: string | null;
  position?: number | null;
}

export interface ToastItem {
  id: string;
  title: string;
  sql?: string;
  type: 'success' | 'error' | 'info';
  durationMs?: number;
}

export interface Plant {
  plant_id: number;
  name: string;
  plant_type: 'SOLAR' | 'WIND' | 'HYDRO';
  capacity_kw: number;
  location: string;
  commissioned_on: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
}

export interface Alert {
  alert_id: number;
  alert_type: 'LOW_BATTERY' | 'LOW_OUTPUT' | 'WARRANTY_EXPIRY' | 'SYSTEM_INFO';
  ref_table: string;
  ref_id: number;
  message: string;
  created_at: string;
  resolved: boolean;
}
