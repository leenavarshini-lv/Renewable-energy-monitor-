export interface Plant {
  plantId: string;
  name: string;
  type: 'SOLAR' | 'WIND' | 'HYDRO';
  capacityKw: number;
  location: string;
  commissionedOn: string;
  status: 'ACTIVE' | 'OPERATIONAL' | 'MAINTENANCE';
}

export interface Equipment {
  equipmentId: string;
  plantId: string;
  equipType: string;
  model: string;
  installedOn: string;
  warrantyEnd: string;
  health: 'GOOD' | 'WARNING' | 'FAULTY';
}

export interface Battery {
  batteryId: string;
  plantId: string;
  capacityKwh: number;
  chargePct: number;
  cycles: number;
}

export interface Generation {
  genId: string;
  plantId: string;
  date: string;
  unitsKwh: number;
}

export interface Consumer {
  consumerId: string;
  name: string;
  category: 'HOUSEHOLD' | 'COMMERCIAL' | 'INDUSTRIAL';
  address: string;
  hasSolar: boolean;
}

export interface Meter {
  meterId: string;
  consumerId: string;
  installedOn: string;
}

export interface Reading {
  readingId: string;
  meterId: string;
  date: string;
  importKwh: number;
  exportKwh: number;
}

export interface Bill {
  billId: string;
  consumerId: string;
  meterId: string;
  billMonth: string;
  importKwh: number;
  exportKwh: number;
  creditInKwh: number;
  netKwh: number;
  creditOutKwh: number;
  amount: number;
  status: 'PAID' | 'UNPAID';
}

export interface Alert {
  alertId: string;
  type: 'LOW_BATTERY' | 'LOW_OUTPUT' | 'WARRANTY_EXPIRY';
  refId: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

export interface AuditLog {
  logId: string;
  action: string;
  performedBy: string;
  actorName: string;
  userRole: 'ADMIN' | 'OPERATOR' | 'SYSTEM';
  targetEntity: string;
  targetId: string;
  previousValue: string;
  newValue: string;
  reason: string;
  timestamp: string;
}

export interface Tariff {
  tariffId: string;
  category: 'HOUSEHOLD' | 'COMMERCIAL' | 'INDUSTRIAL';
  importRate: number;
  unit: string;
  description: string;
}

export interface SystemConfig {
  key: string;
  value: number;
  note: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'CONSUMER';
  consumerId: string | null;
  department: string;
  assignedSector: string;
}

export type UserRole = 'ADMIN' | 'OPERATOR' | 'CONSUMER';

export type CollectionKey =
  | 'plants'
  | 'equipment'
  | 'batteries'
  | 'generation'
  | 'consumers'
  | 'meters'
  | 'readings'
  | 'bills'
  | 'alerts'
  | 'auditLogs'
  | 'tariffs'
  | 'config'
  | 'users';

export interface CollectionMeta {
  key: CollectionKey;
  label: string;
  fileName: string;
  idField: string;
  icon: string;
  description: string;
  rulesApplied: string[];
  rolesAllowed: UserRole[];
}

export const COLLECTION_METAS: CollectionMeta[] = [
  {
    key: 'plants',
    label: 'Plants',
    fileName: 'plants.json',
    idField: 'plantId',
    icon: 'SunMedium',
    description: 'Renewable power generation facilities across major Indian renewable energy states.',
    rulesApplied: ['SOLAR, WIND, and HYDRO categorizations', 'Capacities in kW (5MW to 75MW)', 'Indian states location tags'],
    rolesAllowed: ['ADMIN', 'OPERATOR']
  },
  {
    key: 'equipment',
    label: 'Equipment',
    fileName: 'equipment.json',
    idField: 'equipmentId',
    icon: 'Cpu',
    description: 'Critical electrical, turbine, inverter, and SCADA apparatus mapped to power plants.',
    rulesApplied: ['FK to plants (plantId)', 'HEALTH statuses: GOOD, WARNING, FAULTY', 'Valid warranty periods'],
    rolesAllowed: ['ADMIN', 'OPERATOR']
  },
  {
    key: 'batteries',
    label: 'Batteries',
    fileName: 'batteries.json',
    idField: 'batteryId',
    icon: 'BatteryCharging',
    description: 'BESS (Battery Energy Storage Systems) coupled to grid substations and plants.',
    rulesApplied: ['FK to plants (plantId)', 'Capacities 250 - 5000 kWh', 'chargePct (0-100%) and cycle counts'],
    rolesAllowed: ['ADMIN', 'OPERATOR']
  },
  {
    key: 'generation',
    label: 'Generation',
    fileName: 'generation.json',
    idField: 'genId',
    icon: 'Zap',
    description: 'Telemetry time-series records of power produced by each plant.',
    rulesApplied: ['Zero solar production at night', 'Summer generation peaks for solar (Mar-Jun)', 'Irregular wind patterns'],
    rolesAllowed: ['ADMIN', 'OPERATOR']
  },
  {
    key: 'consumers',
    label: 'Consumers',
    fileName: 'consumers.json',
    idField: 'consumerId',
    icon: 'Users',
    description: 'Grid-connected electricity consumers across Household, Commercial, and Industrial sectors.',
    rulesApplied: ['Realistic Indian names & PIN addresses', 'Categorized HOUSEHOLD / COMMERCIAL / INDUSTRIAL', 'hasSolar prosumer flag'],
    rolesAllowed: ['ADMIN']
  },
  {
    key: 'meters',
    label: 'Meters',
    fileName: 'meters.json',
    idField: 'meterId',
    icon: 'Gauge',
    description: 'Smart bidirectional net metering hardware installed at consumer premises.',
    rulesApplied: ['Strict 1-to-1 foreign key to consumers', 'Commissioning dates within 2025-2026 range'],
    rolesAllowed: ['ADMIN', 'OPERATOR', 'CONSUMER']
  },
  {
    key: 'readings',
    label: 'Readings',
    fileName: 'readings.json',
    idField: 'readingId',
    icon: 'Activity',
    description: 'Bidirectional metering intervals tracking grid import and solar export units.',
    rulesApplied: ['FK to meters (meterId)', 'Zero exportKwh for consumers with hasSolar=false', 'Positive exportKwh for solar prosumers'],
    rolesAllowed: ['ADMIN', 'CONSUMER']
  },
  {
    key: 'bills',
    label: 'Bills',
    fileName: 'bills.json',
    idField: 'billId',
    icon: 'Receipt',
    description: 'Discom net metering electricity settlement statements and financial invoices.',
    rulesApplied: [
      'net = import - export - creditIn',
      'If net < 0: amount = 0, creditOut = -net',
      'Rates: Household ₹6.5, Commercial ₹8.5, Industrial ₹7.5'
    ],
    rolesAllowed: ['ADMIN', 'CONSUMER']
  },
  {
    key: 'alerts',
    label: 'Alerts',
    fileName: 'alerts.json',
    idField: 'alertId',
    icon: 'AlertTriangle',
    description: 'Operational exception alerts and predictive maintenance triggers.',
    rulesApplied: [
      'LOW_BATTERY -> FK refId to batteries',
      'LOW_OUTPUT -> FK refId to plants',
      'WARRANTY_EXPIRY -> FK refId to equipment'
    ],
    rolesAllowed: ['ADMIN', 'OPERATOR']
  },
  {
    key: 'tariffs',
    label: 'Tariffs',
    fileName: 'tariffs.json',
    idField: 'tariffId',
    icon: 'Tag',
    description: 'Regulated tariff rates per consumer category used for dynamic bill calculation.',
    rulesApplied: ['HOUSEHOLD: ₹6.5/kWh', 'COMMERCIAL: ₹8.5/kWh', 'INDUSTRIAL: ₹7.5/kWh'],
    rolesAllowed: ['ADMIN']
  },
  {
    key: 'config',
    label: 'Config Rules',
    fileName: 'config.json',
    idField: 'key',
    icon: 'Sliders',
    description: 'Global threshold parameters: CEA emission factor 0.71, low-output 60%, low-battery 20%, warranty 30d.',
    rulesApplied: ['Emission factor 0.71 kg CO2/kWh', 'Alert thresholds', 'System rules'],
    rolesAllowed: ['ADMIN', 'OPERATOR']
  },
  {
    key: 'users',
    label: 'Users & Roles',
    fileName: 'users.json',
    idField: 'userId',
    icon: 'Shield',
    description: 'Role-based access accounts: Admin, Operator, and Prosumer Consumers.',
    rulesApplied: ['RBAC profiles', 'consumerId mapping for prosumers', 'Department assignments'],
    rolesAllowed: ['ADMIN']
  },
  {
    key: 'auditLogs',
    label: 'Audit Log',
    fileName: 'auditLogs.json',
    idField: 'logId',
    icon: 'History',
    description: 'Immutable ledger recording who changed tariffs, meter calibrations, and bill overrides.',
    rulesApplied: ['Tracks user email, role & action', 'Records previous and new values', 'ISO timestamps'],
    rolesAllowed: ['ADMIN']
  }
];
