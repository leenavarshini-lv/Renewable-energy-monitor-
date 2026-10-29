import fs from 'fs';
import path from 'path';

// Generate 120 realistic Audit Log records
const auditLogs: any[] = [];

const ACTIONS = [
  'TARIFF_RATE_UPDATE',
  'BILL_STATUS_OVERRIDE',
  'SOLAR_CREDIT_ADJUSTMENT',
  'METER_RECALIBRATION',
  'NET_BILLING_DISPUTE_RESOLVED',
  'PEAK_HOUR_SURCHARGE_APPLIED',
  'EXPORT_TARIFF_INCENTIVE_CREDITED'
];

const ACTORS = [
  { name: 'Dr. Ramesh Raman', email: 'r.raman@state-discom.gov.in', role: 'ADMIN' },
  { name: 'Priya Narayanan', email: 'p.narayanan@state-discom.gov.in', role: 'ADMIN' },
  { name: 'Vikram Sethi', email: 'v.sethi@grid-operations.in', role: 'OPERATOR' },
  { name: 'Ananya Deshmukh', email: 'a.deshmukh@grid-operations.in', role: 'OPERATOR' },
  { name: 'Discom Automated Billing Daemon', email: 'system@auto-billing.gov.in', role: 'SYSTEM' }
];

const BILL_IDS = Array.from({ length: 120 }, (_, i) => `BILL_${String(i + 1).padStart(3, '0')}`);
const METER_IDS = Array.from({ length: 120 }, (_, i) => `MTR_${String(i + 1).padStart(3, '0')}`);

for (let i = 1; i <= 120; i++) {
  const logId = `LOG_${String(i).padStart(3, '0')}`;
  const action = ACTIONS[(i - 1) % ACTIONS.length];
  const actor = ACTORS[(i - 1) % ACTORS.length];

  let targetEntity = 'bills';
  let targetId = BILL_IDS[(i - 1) % BILL_IDS.length];
  let previousValue = '';
  let newValue = '';
  let reason = '';

  if (action === 'TARIFF_RATE_UPDATE') {
    targetEntity = 'tariff_schedules';
    targetId = 'SCHEDULE_2026_Q2';
    previousValue = 'Household: ₹6.00/kWh, Commercial: ₹8.00/kWh';
    newValue = 'Household: ₹6.50/kWh, Commercial: ₹8.50/kWh';
    reason = 'Regulatory Commission Order Ref T-4022 for FY 2026';
  } else if (action === 'BILL_STATUS_OVERRIDE') {
    targetEntity = 'bills';
    targetId = BILL_IDS[(i * 3) % BILL_IDS.length];
    previousValue = 'status: UNPAID';
    newValue = 'status: PAID';
    reason = 'Verified RTGS direct transfer confirmation from consumer bank';
  } else if (action === 'SOLAR_CREDIT_ADJUSTMENT') {
    targetEntity = 'bills';
    targetId = BILL_IDS[(i * 5) % BILL_IDS.length];
    previousValue = 'creditInKwh: 0.00';
    newValue = 'creditInKwh: 45.50';
    reason = 'Carried over unutilized rooftop solar surplus from previous billing quarter';
  } else if (action === 'METER_RECALIBRATION') {
    targetEntity = 'meters';
    targetId = METER_IDS[(i * 2) % METER_IDS.length];
    previousValue = 'calibrationDrift: +2.1%';
    newValue = 'calibrationDrift: 0.0% (Re-zeroed)';
    reason = 'Quarterly field inspection and smart bi-directional meter calibration';
  } else {
    targetEntity = 'bills';
    targetId = BILL_IDS[(i * 7) % BILL_IDS.length];
    previousValue = 'disputeStatus: OPEN';
    newValue = 'disputeStatus: RESOLVED';
    reason = 'Discom grievance review confirmed meter export reading validity';
  }

  // Random timestamp within range 2025-10-01 to 2026-09-30
  const start = new Date('2025-10-01T00:00:00Z').getTime();
  const end = new Date('2026-09-30T00:00:00Z').getTime();
  const timestamp = new Date(start + ((i * 73939) % (end - start))).toISOString();

  auditLogs.push({
    logId,
    action,
    performedBy: actor.email,
    actorName: actor.name,
    userRole: actor.role,
    targetEntity,
    targetId,
    previousValue,
    newValue,
    reason,
    timestamp
  });
}

// Write to seed_data and src/data
const dirs = ['seed_data', 'public/seed_data', 'src/data'];
for (const dir of dirs) {
  fs.writeFileSync(path.resolve(dir, 'auditLogs.json'), JSON.stringify(auditLogs, null, 2), 'utf8');
}
console.log('Saved 120 auditLogs documents to seed_data and src/data!');
