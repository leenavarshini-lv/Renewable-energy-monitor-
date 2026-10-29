import fs from 'fs';
import path from 'path';

// 1. TARIFFS
const tariffs = [
  {
    tariffId: 'TARIFF_HOUSEHOLD',
    category: 'HOUSEHOLD',
    importRate: 6.5,
    unit: 'INR/kWh',
    description: 'Domestic residential retail tariff with solar net-metering'
  },
  {
    tariffId: 'TARIFF_COMMERCIAL',
    category: 'COMMERCIAL',
    importRate: 8.5,
    unit: 'INR/kWh',
    description: 'Commercial establishments, malls, tech hubs, and healthcare'
  },
  {
    tariffId: 'TARIFF_INDUSTRIAL',
    category: 'INDUSTRIAL',
    importRate: 7.5,
    unit: 'INR/kWh',
    description: 'High-tension and medium-tension manufacturing industries'
  }
];

// 2. CONFIG
const configDocs = [
  {
    key: 'emissionFactor',
    value: 0.71,
    note: 'Central Electricity Authority (CEA) grid baseline emission factor: 0.71 kg CO2 avoided per kWh generated'
  },
  {
    key: 'lowOutputRatio',
    value: 0.60,
    note: 'Inverter output threshold: 60% of expected pyranometer irradiance triggers LOW_OUTPUT alert'
  },
  {
    key: 'lowBatteryPct',
    value: 20,
    note: 'Battery BESS threshold: State-of-Charge below 20% triggers urgent LOW_BATTERY grid stabilization alert'
  },
  {
    key: 'warrantyAlertDays',
    value: 30,
    note: 'Asset management: Triggers WARRANTY_EXPIRY warning notice 30 days before manufacturer warranty expires'
  },
  {
    key: 'peakHourMultiplier',
    value: 1.20,
    note: 'Time-of-day dynamic peak hour surcharge multiplier (18:00 - 22:00)'
  }
];

// 3. USERS (Admin, Operator, Consumers)
const consumersPath = path.resolve('seed_data', 'consumers.json');
const consumers = JSON.parse(fs.readFileSync(consumersPath, 'utf8'));

const users = [
  {
    userId: 'USER_ADMIN_01',
    name: 'Leena Varshini',
    email: 'leenavarshini@gmail.com',
    role: 'ADMIN',
    consumerId: null,
    department: 'State Electricity Regulatory Commission',
    assignedSector: 'All Sectors'
  },
  {
    userId: 'USER_ADMIN_02',
    name: 'Dr. Ramesh Raman',
    email: 'r.raman@state-discom.gov.in',
    role: 'ADMIN',
    consumerId: null,
    department: 'Discom Tariff & Net-Metering Authority',
    assignedSector: 'State Grid'
  },
  {
    userId: 'USER_OPERATOR_01',
    name: 'Vikram Sethi',
    email: 'v.sethi@grid-operations.in',
    role: 'OPERATOR',
    consumerId: null,
    department: 'SCADA Transmission & Plant Dispatch',
    assignedSector: 'Northern Renewable Corridor'
  },
  {
    userId: 'USER_OPERATOR_02',
    name: 'Ananya Deshmukh',
    email: 'a.deshmukh@grid-operations.in',
    role: 'OPERATOR',
    consumerId: null,
    department: 'Substation BESS & Inverter Monitoring',
    assignedSector: 'Western Grid Hub'
  }
];

// Add consumers as users
for (let i = 0; i < consumers.length; i++) {
  const c = consumers[i];
  const emailName = c.name.toLowerCase().replace(/[^a-z]/g, '.');
  users.push({
    userId: `USER_CONS_${String(i + 1).padStart(3, '0')}`,
    name: c.name,
    email: `${emailName}@consumer-portal.in`,
    role: 'CONSUMER',
    consumerId: c.consumerId,
    department: 'Retail Consumer',
    assignedSector: c.category
  });
}

// Write to seed_data, public/seed_data, and src/data
const targets = ['seed_data', 'public/seed_data', 'src/data'];
for (const dir of targets) {
  fs.writeFileSync(path.resolve(dir, 'tariffs.json'), JSON.stringify(tariffs, null, 2), 'utf8');
  fs.writeFileSync(path.resolve(dir, 'config.json'), JSON.stringify(configDocs, null, 2), 'utf8');
  fs.writeFileSync(path.resolve(dir, 'users.json'), JSON.stringify(users, null, 2), 'utf8');
}
console.log('Successfully saved tariffs.json, config.json, and users.json!');
