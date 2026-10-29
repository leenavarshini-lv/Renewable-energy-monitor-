import fs from 'fs';
import path from 'path';

// Seeded pseudorandom generator for deterministic, realistic data
let seed = 42;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function randInt(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2) {
  const val = random() * (max - min) + min;
  return Number(val.toFixed(decimals));
}

function choice<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

// Date helper within range 2025-10-01T00:00:00Z to 2026-09-30T23:59:59Z
const START_TIMESTAMP = new Date('2025-10-01T00:00:00.000Z').getTime();
const END_TIMESTAMP = new Date('2026-09-30T23:59:59.000Z').getTime();

function randomDate(startMs = START_TIMESTAMP, endMs = END_TIMESTAMP): Date {
  const ms = Math.floor(random() * (endMs - startMs)) + startMs;
  return new Date(ms);
}

function formatDateISO(date: Date): string {
  return date.toISOString();
}

const INDIAN_STATES = [
  'Rajasthan',
  'Gujarat',
  'Tamil Nadu',
  'Karnataka',
  'Maharashtra',
  'Andhra Pradesh',
  'Madhya Pradesh',
  'Himachal Pradesh',
  'Uttarakhand',
  'Kerala',
  'Telangana',
  'Punjab',
  'Odisha',
];

const SOLAR_NAMES = [
  'Bhadla Solar Park Ph-I', 'Bhadla Solar Park Ph-II', 'Pavagada Solar Complex East',
  'Rewa Ultra Mega Solar', 'Kamuthi Photovoltaic Station', 'Charanka Solar Hub',
  'Kurnool Ultra Solar Park', 'Ananthapuramu Solar Facility', 'Dholera Solar Array A',
  'Mandsaur Solar Plant', 'Kadapa Ultra Mega Solar', 'Fatehgarh Solar Hub',
  'Kaza High-Altitude Solar', 'Neemuch Solar Farm', 'Surendranagar Solar Station',
  'Nokh Solar Park Unit 1', 'Nokh Solar Park Unit 2', 'Banaskantha Solar Farm'
];

const WIND_NAMES = [
  'Muppandal Wind Farm North', 'Muppandal Wind Farm South', 'Jaisalmer Wind Park Cluster 1',
  'Brahmanvel Wind Farm', 'Kayathar Wind Power Station', 'Dhalgaon Wind Cluster',
  'Vankusawade Wind Park', 'Beluguppa Wind Farm', 'Tuppadahalli Wind Facility',
  'Kukru Wind Park', 'Sangli Wind Park', 'Chitradurga Wind Heights',
  'Kutch Wind Energy Park', 'Satara Wind Range', 'Gadag Wind Farm'
];

const HYDRO_NAMES = [
  'Koyna Stage IV Hydro Project', 'Tehri Pumped Storage Hydro', 'Sharavathi Hydro Station',
  'Nathpa Jhakri Hydel Unit', 'Bhakra Nangal Hydro Terminal', 'Idukki Arch Dam Hydro',
  'Sardar Sarovar Canal Hydro', 'Baspa II Hydroelectric Project', 'Chamera Stage III Hydro',
  'Srisailam Right Bank Hydro', 'Karcham Wangtoo Hydro Station', 'Uri II Hydel Plant'
];

// 1. PLANTS (120 docs)
interface Plant {
  plantId: string;
  name: string;
  type: 'SOLAR' | 'WIND' | 'HYDRO';
  capacityKw: number;
  location: string;
  commissionedOn: string;
  status: 'ACTIVE' | 'OPERATIONAL' | 'MAINTENANCE';
}

const plants: Plant[] = [];
for (let i = 1; i <= 120; i++) {
  const plantId = `PLANT_${String(i).padStart(3, '0')}`;
  // balanced distribution: ~50 Solar, ~40 Wind, ~30 Hydro
  let type: 'SOLAR' | 'WIND' | 'HYDRO';
  let name = '';
  let capacityKw = 0;
  let location = '';

  if (i <= 55) {
    type = 'SOLAR';
    const baseName = SOLAR_NAMES[(i - 1) % SOLAR_NAMES.length];
    const subId = Math.floor((i - 1) / SOLAR_NAMES.length) + 1;
    name = subId > 1 ? `${baseName} Sec-${subId}` : baseName;
    capacityKw = choice([5000, 10000, 15000, 20000, 25000, 40000, 50000, 75000]);
    location = choice(['Rajasthan', 'Gujarat', 'Karnataka', 'Madhya Pradesh', 'Andhra Pradesh', 'Tamil Nadu']);
  } else if (i <= 95) {
    type = 'WIND';
    const baseName = WIND_NAMES[(i - 56) % WIND_NAMES.length];
    const subId = Math.floor((i - 56) / WIND_NAMES.length) + 1;
    name = subId > 1 ? `${baseName} Turb-${subId}` : baseName;
    capacityKw = choice([6000, 12000, 18000, 24000, 36000, 48000, 60000]);
    location = choice(['Tamil Nadu', 'Gujarat', 'Maharashtra', 'Rajasthan', 'Karnataka', 'Andhra Pradesh']);
  } else {
    type = 'HYDRO';
    const baseName = HYDRO_NAMES[(i - 96) % HYDRO_NAMES.length];
    const subId = Math.floor((i - 96) / HYDRO_NAMES.length) + 1;
    name = subId > 1 ? `${baseName} Gen-${subId}` : baseName;
    capacityKw = choice([8000, 16000, 25000, 32000, 50000, 65000]);
    location = choice(['Himachal Pradesh', 'Uttarakhand', 'Maharashtra', 'Karnataka', 'Kerala']);
  }

  const commDate = randomDate(new Date('2025-10-01T00:00:00Z').getTime(), new Date('2026-08-30T00:00:00Z').getTime());
  const status = choice<'ACTIVE' | 'OPERATIONAL' | 'MAINTENANCE'>(['OPERATIONAL', 'OPERATIONAL', 'ACTIVE', 'ACTIVE', 'MAINTENANCE']);

  plants.push({
    plantId,
    name,
    type,
    capacityKw,
    location,
    commissionedOn: formatDateISO(commDate),
    status,
  });
}

// 2. EQUIPMENT (120 docs)
interface Equipment {
  equipmentId: string;
  plantId: string;
  equipType: string;
  model: string;
  installedOn: string;
  warrantyEnd: string;
  health: 'GOOD' | 'WARNING' | 'FAULTY';
}

const equipment: Equipment[] = [];
for (let i = 1; i <= 120; i++) {
  const equipmentId = `EQUIP_${String(i).padStart(3, '0')}`;
  // Reference a plant (looping or picking)
  const plant = plants[(i - 1) % plants.length];
  let equipType = '';
  let model = '';

  if (plant.type === 'SOLAR') {
    equipType = choice(['CENTRAL_INVERTER', 'STRING_INVERTER', 'SOLAR_ARRAY_COMBINER', 'SINGLE_AXIS_TRACKER', 'PYRANOMETER_STATION']);
    model = choice([
      'SMA Sunny Central 2500-EV',
      'Sungrow SG250HX String Inverter',
      'ABB PVS980-58 Central 2000kVA',
      'Schneider Conext Core XC 1000V',
      'Nextracker Horizon Single-Axis Gen2',
      'Kipp & Zonen CMP11 Pyranometer'
    ]);
  } else if (plant.type === 'WIND') {
    equipType = choice(['WIND_TURBINE_NACELLE', 'GENERATOR_UNIT', 'YAW_DRIVE_MOTOR', 'BLADE_PITCH_ACTUATOR', 'ANEMOMETER_MAST']);
    model = choice([
      'Vestas V150-4.2 MW Nacelle Assembly',
      'Siemens Gamesa SG 3.4-132 Turbine Gen',
      'GE Vernova 2.7-116 DFIG Generator',
      'Suzlon S120 Hybrid Lattice Nacelle',
      'Bonfiglioli 700T Series Yaw Drive',
      'Thies Clima Ultrasonic Anemometer 2D'
    ]);
  } else {
    equipType = choice(['FRANCIS_RUNNER', 'HYDRO_TURBINE_GOVERNOR', 'MAIN_INLET_VALVE', 'STEP_UP_TRANSFORMER', 'PENSTOCK_MONITOR']);
    model = choice([
      'Voith Hydro Francis F-250 High Head',
      'Andritz Hydro Francis Turbine 15MW',
      'BHEL Digital Electro-Hydraulic Governor',
      'ABB Power Step-Up Transformer 33/132kV',
      'Flowserve Bi-Plane Butterfly Valve 2200mm'
    ]);
  }

  const installDate = randomDate(new Date('2025-10-01T00:00:00Z').getTime(), new Date('2026-06-30T00:00:00Z').getTime());
  // Warranty end 3 to 10 years after installation
  const warrantyYears = choice([3, 5, 7, 10]);
  const warrantyDate = new Date(installDate);
  warrantyDate.setFullYear(warrantyDate.getFullYear() + warrantyYears);

  // Health distribution: mostly GOOD, some WARNING, rare FAULTY
  const health = choice<'GOOD' | 'WARNING' | 'FAULTY'>([
    'GOOD', 'GOOD', 'GOOD', 'GOOD', 'GOOD', 'GOOD', 'WARNING', 'WARNING', 'FAULTY'
  ]);

  equipment.push({
    equipmentId,
    plantId: plant.plantId,
    equipType,
    model,
    installedOn: formatDateISO(installDate),
    warrantyEnd: formatDateISO(warrantyDate),
    health,
  });
}

// 3. BATTERIES (120 docs)
interface Battery {
  batteryId: string;
  plantId: string;
  capacityKwh: number;
  chargePct: number;
  cycles: number;
}

const batteries: Battery[] = [];
for (let i = 1; i <= 120; i++) {
  const batteryId = `BATT_${String(i).padStart(3, '0')}`;
  const plant = plants[(i - 1) % plants.length];
  const capacityKwh = choice([250, 500, 750, 1000, 1500, 2000, 3000, 5000]);
  // chargePct 0 to 100
  const chargePct = randInt(12, 98);
  const cycles = randInt(85, 2900);

  batteries.push({
    batteryId,
    plantId: plant.plantId,
    capacityKwh,
    chargePct,
    cycles,
  });
}

// 4. GENERATION (120 docs)
// Rule: Solar generation is zero at night and peaks in summer. Wind is irregular.
interface Generation {
  genId: string;
  plantId: string;
  date: string;
  unitsKwh: number;
}

const generation: Generation[] = [];
for (let i = 1; i <= 120; i++) {
  const genId = `GEN_${String(i).padStart(3, '0')}`;
  const plant = plants[(i - 1) % plants.length];

  // Pick a date between 2025-10-01 and 2026-09-30 with a specific hour
  const genDate = randomDate();
  const hour = genDate.getUTCHours();
  const month = genDate.getUTCMonth(); // 0 = Jan, 1 = Feb, 2 = Mar, 3 = Apr, 4 = May, 5 = Jun, 6 = Jul, 7 = Aug, 8 = Sep, 9 = Oct, 10 = Nov, 11 = Dec

  let unitsKwh = 0;

  if (plant.type === 'SOLAR') {
    // Night hours in UTC/local: assume night is hour >= 19 or hour < 6 (solar is ZERO at night)
    // To make sure we have both night and day samples in the 120 docs:
    const isNight = hour >= 19 || hour < 6;
    if (isNight) {
      unitsKwh = 0;
    } else {
      // Daytime solar: peaks around midday (11:00 - 13:00)
      const middayFactor = Math.sin(((hour - 6) / 13) * Math.PI); // 0 at 6 and 19, 1 at 12.5
      // Summer in India: March(2), April(3), May(4), June(5) -> Peak summer factor 1.3 to 1.75
      // Monsoon: July(6), Aug(7) -> 0.45 to 0.75
      // Winter: Nov(10), Dec(11), Jan(0) -> 0.75 to 0.95
      let seasonFactor = 1.0;
      if (month >= 2 && month <= 5) {
        seasonFactor = randFloat(1.35, 1.8); // Summer peak!
      } else if (month === 6 || month === 7) {
        seasonFactor = randFloat(0.45, 0.8); // Monsoon clouds
      } else {
        seasonFactor = randFloat(0.75, 1.1); // Winter/Autumn
      }

      const hourlyCapacityFactor = 0.85; // peak capacity factor
      unitsKwh = randFloat(
        plant.capacityKw * 0.2 * middayFactor * seasonFactor * hourlyCapacityFactor,
        plant.capacityKw * 0.95 * middayFactor * seasonFactor * hourlyCapacityFactor,
        2
      );
      if (unitsKwh < 0) unitsKwh = 0;
    }
  } else if (plant.type === 'WIND') {
    // Wind is irregular (can blow at night, sudden gusts or calms)
    const gustFactor = randFloat(0.05, 0.92);
    unitsKwh = randFloat(plant.capacityKw * 0.1 * gustFactor, plant.capacityKw * gustFactor, 2);
  } else {
    // Hydro: baseload with higher flow during monsoon (July-Sept)
    const hydroSeason = (month >= 6 && month <= 8) ? 1.4 : 0.85;
    unitsKwh = randFloat(plant.capacityKw * 0.4 * hydroSeason, plant.capacityKw * 0.9 * hydroSeason, 2);
  }

  generation.push({
    genId,
    plantId: plant.plantId,
    date: formatDateISO(genDate),
    unitsKwh: Number(unitsKwh.toFixed(2)),
  });
}

// 5. CONSUMERS (120 docs)
interface Consumer {
  consumerId: string;
  name: string;
  category: 'HOUSEHOLD' | 'COMMERCIAL' | 'INDUSTRIAL';
  address: string;
  hasSolar: boolean;
}

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Pooja', 'Sunita', 'Meera', 'Riya', 'Kavya',
  'Rajesh', 'Suresh', 'Vikram', 'Ramesh', 'Manoj', 'Deepak', 'Girish', 'Harish', 'Nitin', 'Alok'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Deshmukh', 'Kulkarni', 'Joshi',
  'Mehta', 'Gupta', 'Singh', 'Chopra', 'Malhotra', 'Bose', 'Chatterjee', 'Pillai', 'Menon', 'Gowda'
];

const COMMERCIAL_ENTITIES = [
  'Nexus IT Hub', 'Prestige Tech Center', 'Apollo Multispecialty Clinic', 'Phoenix Grand Galleria',
  'Cyber Gateway Towers', 'Mindspace Business Complex', 'Emerald Regency Hotel', 'Fortis Diagnostic Center',
  'World Trade Center Block-B', 'Kalyan Hypermarket', 'Decathlon Flagship Store', 'Titan Corporate Office',
  'Manipal Health Clinic', 'Radisson Blu Express', 'Lulu Shopping Hub'
];

const INDUSTRIAL_ENTITIES = [
  'Kaveri Spinning & Weaving Mills', 'Bharat Heavy Forgings Ltd', 'Sundaram Precision Auto Components',
  'Deccan Electro-Steel Foundry', 'Godavari Agro Food Processing', 'Gujarat Polymer & Resins Plant',
  'Vindhya Chemical Synthetics', 'Coromandel Glass Works', 'Kirloskar Pump Assembly Works',
  'Tata AutoComp Casting Div', 'Birla Carbon Industries', 'Jindal Extrusions Unit 4'
];

const CITIES_BY_STATE: Record<string, string[]> = {
  Rajasthan: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru'],
  Maharashtra: ['Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],
};

const consumers: Consumer[] = [];
for (let i = 1; i <= 120; i++) {
  const consumerId = `CONS_${String(i).padStart(3, '0')}`;
  // Distribution: 60 Household, 36 Commercial, 24 Industrial
  let category: 'HOUSEHOLD' | 'COMMERCIAL' | 'INDUSTRIAL';
  let name = '';
  let hasSolar = false;

  const state = choice(Object.keys(CITIES_BY_STATE));
  const city = choice(CITIES_BY_STATE[state]);
  const pin = randInt(110001, 695001);

  if (i <= 60) {
    category = 'HOUSEHOLD';
    name = `${choice(INDIAN_FIRST_NAMES)} ${choice(INDIAN_LAST_NAMES)}`;
    hasSolar = random() < 0.45; // ~45% of households have rooftop solar
  } else if (i <= 96) {
    category = 'COMMERCIAL';
    name = COMMERCIAL_ENTITIES[(i - 61) % COMMERCIAL_ENTITIES.length];
    hasSolar = random() < 0.65; // ~65% of commercial buildings have rooftop solar
  } else {
    category = 'INDUSTRIAL';
    name = INDUSTRIAL_ENTITIES[(i - 97) % INDUSTRIAL_ENTITIES.length];
    hasSolar = random() < 0.55; // ~55% of industries have captive rooftop solar
  }

  const houseNo = randInt(10, 890);
  const streetName = choice(['MG Road', 'Anna Salai', 'Ring Road', 'Brigade Cross', 'SV Road', 'GIDC Industrial Area', 'Sector 14 MIDC', 'Banjara Hills Rd 12']);
  const address = `${houseNo}, ${streetName}, ${city}, ${state} - ${pin}`;

  consumers.push({
    consumerId,
    name,
    category,
    address,
    hasSolar,
  });
}

// 6. METERS (120 docs)
interface Meter {
  meterId: string;
  consumerId: string;
  installedOn: string;
}

const meters: Meter[] = [];
for (let i = 1; i <= 120; i++) {
  const meterId = `MTR_${String(i).padStart(3, '0')}`;
  // 1-to-1 mapping with consumers
  const consumer = consumers[i - 1];
  const installDate = randomDate(new Date('2025-10-01T00:00:00Z').getTime(), new Date('2026-04-30T00:00:00Z').getTime());

  meters.push({
    meterId,
    consumerId: consumer.consumerId,
    installedOn: formatDateISO(installDate),
  });
}

// 7. READINGS (120 docs)
// Rule: Only consumers with hasSolar=true have exportKwh > 0.
interface Reading {
  readingId: string;
  meterId: string;
  date: string;
  importKwh: number;
  exportKwh: number;
}

const readings: Reading[] = [];
for (let i = 1; i <= 120; i++) {
  const readingId = `READ_${String(i).padStart(3, '0')}`;
  const meter = meters[(i - 1) % meters.length];
  const consumer = consumers.find(c => c.consumerId === meter.consumerId)!;
  const readingDate = randomDate();

  let importKwh = 0;
  let exportKwh = 0;

  if (consumer.category === 'HOUSEHOLD') {
    importKwh = randFloat(140.0, 520.0, 2);
    if (consumer.hasSolar) {
      exportKwh = randFloat(80.0, 480.0, 2);
    } else {
      exportKwh = 0;
    }
  } else if (consumer.category === 'COMMERCIAL') {
    importKwh = randFloat(1200.0, 6800.0, 2);
    if (consumer.hasSolar) {
      exportKwh = randFloat(400.0, 4500.0, 2);
    } else {
      exportKwh = 0;
    }
  } else {
    // INDUSTRIAL
    importKwh = randFloat(7500.0, 42000.0, 2);
    if (consumer.hasSolar) {
      exportKwh = randFloat(2000.0, 22000.0, 2);
    } else {
      exportKwh = 0;
    }
  }

  readings.push({
    readingId,
    meterId: meter.meterId,
    date: formatDateISO(readingDate),
    importKwh,
    exportKwh,
  });
}

// 8. BILLS (120 docs)
// Rule: Bills follow: net = import - export - creditIn.
// If net < 0, amount = 0 and creditOut = -net.
// Otherwise amount = net x rate (household 6.5, commercial 8.5, industrial 7.5).
interface Bill {
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

const BILL_MONTHS = [
  '2025-10', '2025-11', '2025-12',
  '2026-01', '2026-02', '2026-03',
  '2026-04', '2026-05', '2026-06',
  '2026-07', '2026-08', '2026-09'
];

const bills: Bill[] = [];
for (let i = 1; i <= 120; i++) {
  const billId = `BILL_${String(i).padStart(3, '0')}`;
  const meter = meters[(i - 1) % meters.length];
  const consumer = consumers.find(c => c.consumerId === meter.consumerId)!;
  const billMonth = choice(BILL_MONTHS);

  let importKwh = 0;
  let exportKwh = 0;
  let rate = 6.5;

  if (consumer.category === 'HOUSEHOLD') {
    rate = 6.5;
    importKwh = randFloat(180, 580);
    if (consumer.hasSolar) {
      // Intentionally create both positive net and negative net scenarios
      exportKwh = random() < 0.35 ? randFloat(importKwh + 20, importKwh + 150) : randFloat(50, importKwh * 0.85);
    } else {
      exportKwh = 0;
    }
  } else if (consumer.category === 'COMMERCIAL') {
    rate = 8.5;
    importKwh = randFloat(1500, 7500);
    if (consumer.hasSolar) {
      exportKwh = random() < 0.2 ? randFloat(importKwh + 100, importKwh + 1000) : randFloat(600, importKwh * 0.7);
    } else {
      exportKwh = 0;
    }
  } else {
    rate = 7.5;
    importKwh = randFloat(8000, 45000);
    if (consumer.hasSolar) {
      exportKwh = random() < 0.2 ? randFloat(importKwh + 500, importKwh + 4000) : randFloat(2500, importKwh * 0.75);
    } else {
      exportKwh = 0;
    }
  }

  // CreditIn: carried forward credits (only likely if hasSolar)
  const creditInKwh = consumer.hasSolar && random() < 0.4 ? randFloat(15, 120) : 0;
  const rawNet = importKwh - exportKwh - creditInKwh;
  const netKwh = Number(rawNet.toFixed(2));

  let creditOutKwh = 0;
  let amount = 0;

  if (netKwh < 0) {
    amount = 0;
    creditOutKwh = Number(Math.abs(netKwh).toFixed(2));
  } else {
    creditOutKwh = 0;
    amount = Number((netKwh * rate).toFixed(2));
  }

  const status = choice<'PAID' | 'UNPAID'>(['PAID', 'PAID', 'PAID', 'UNPAID']);

  bills.push({
    billId,
    consumerId: consumer.consumerId,
    meterId: meter.meterId,
    billMonth,
    importKwh: Number(importKwh.toFixed(2)),
    exportKwh: Number(exportKwh.toFixed(2)),
    creditInKwh: Number(creditInKwh.toFixed(2)),
    netKwh,
    creditOutKwh,
    amount,
    status,
  });
}

// 9. ALERTS (120 docs)
// Rule: type (LOW_BATTERY/LOW_OUTPUT/WARRANTY_EXPIRY), refId, message, createdAt, resolved
interface Alert {
  alertId: string;
  type: 'LOW_BATTERY' | 'LOW_OUTPUT' | 'WARRANTY_EXPIRY';
  refId: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

const alerts: Alert[] = [];
for (let i = 1; i <= 120; i++) {
  const alertId = `ALERT_${String(i).padStart(3, '0')}`;
  const alertType = choice<'LOW_BATTERY' | 'LOW_OUTPUT' | 'WARRANTY_EXPIRY'>([
    'LOW_BATTERY', 'LOW_OUTPUT', 'WARRANTY_EXPIRY'
  ]);

  let refId = '';
  let message = '';

  if (alertType === 'LOW_BATTERY') {
    const battery = choice(batteries);
    refId = battery.batteryId;
    const plant = plants.find(p => p.plantId === battery.plantId)!;
    message = `Critical SoC drop detected on Battery Bank ${battery.batteryId} (${battery.chargePct}%) at ${plant.name}. Grid stabilization threshold breached.`;
  } else if (alertType === 'LOW_OUTPUT') {
    const plant = choice(plants);
    refId = plant.plantId;
    if (plant.type === 'SOLAR') {
      message = `Sub-nominal power generation alert at ${plant.name}: Inverter cluster reporting 42% deviation against pyranometer irradiance index.`;
    } else if (plant.type === 'WIND') {
      message = `Rotor speed mismatch alert at ${plant.name}: Yaw misalignment detected under prevailing 14.2 m/s wind velocity.`;
    } else {
      message = `Hydraulic discharge flow restriction alert at ${plant.name}: Penstock pressure drop exceeding safety limits by 18%.`;
    }
  } else {
    // WARRANTY_EXPIRY
    const eq = choice(equipment);
    refId = eq.equipmentId;
    const plant = plants.find(p => p.plantId === eq.plantId)!;
    message = `Asset lifecycle notice: Manufacturer warranty for ${eq.model} (${eq.equipType}) at ${plant.name} expires on ${eq.warrantyEnd.split('T')[0]}. Schedule OEM inspection.`;
  }

  const createdAt = formatDateISO(randomDate());
  const resolved = random() < 0.65;

  alerts.push({
    alertId,
    type: alertType,
    refId,
    message,
    createdAt,
    resolved,
  });
}

// 10. CARBON CREDITS (120 docs)
// Rule: co2AvoidedKg = unitsKwh x 0.71
interface CarbonCredit {
  creditId: string;
  plantId: string;
  month: string;
  unitsKwh: number;
  co2AvoidedKg: number;
}

const carbonCredits: CarbonCredit[] = [];
for (let i = 1; i <= 120; i++) {
  const creditId = `CC_${String(i).padStart(3, '0')}`;
  const plant = plants[(i - 1) % plants.length];
  const month = choice(BILL_MONTHS);

  // realistic monthly generation for carbon credits (50,000 to 1,200,000 kWh depending on plant size)
  const unitsKwh = Number((plant.capacityKw * randFloat(85.0, 195.0, 2)).toFixed(2));
  const co2AvoidedKg = Number((unitsKwh * 0.71).toFixed(2));

  carbonCredits.push({
    creditId,
    plantId: plant.plantId,
    month,
    unitsKwh,
    co2AvoidedKg,
  });
}

// Verification checks
console.log('--- VERIFICATION CHECKS ---');
const collections = {
  plants,
  equipment,
  batteries,
  generation,
  consumers,
  meters,
  readings,
  bills,
  alerts,
  carbonCredits
};

for (const [key, list] of Object.entries(collections)) {
  console.log(`Collection ${key}: length = ${list.length}`);
  if (list.length !== 120) {
    throw new Error(`Collection ${key} has ${list.length} docs, expected 120!`);
  }
}

// Verify foreign keys
const plantIds = new Set(plants.map(p => p.plantId));
const consumerIds = new Set(consumers.map(c => c.consumerId));
const meterIds = new Set(meters.map(m => m.meterId));
const batteryIds = new Set(batteries.map(b => b.batteryId));
const equipIds = new Set(equipment.map(e => e.equipmentId));

for (const eq of equipment) {
  if (!plantIds.has(eq.plantId)) throw new Error(`Invalid plantId ${eq.plantId} in equipment`);
}
for (const b of batteries) {
  if (!plantIds.has(b.plantId)) throw new Error(`Invalid plantId ${b.plantId} in battery`);
}
for (const g of generation) {
  if (!plantIds.has(g.plantId)) throw new Error(`Invalid plantId ${g.plantId} in generation`);
}
for (const m of meters) {
  if (!consumerIds.has(m.consumerId)) throw new Error(`Invalid consumerId ${m.consumerId} in meters`);
}
for (const r of readings) {
  if (!meterIds.has(r.meterId)) throw new Error(`Invalid meterId ${r.meterId} in readings`);
  const meter = meters.find(m => m.meterId === r.meterId)!;
  const consumer = consumers.find(c => c.consumerId === meter.consumerId)!;
  if (!consumer.hasSolar && r.exportKwh > 0) {
    throw new Error(`Consumer without solar has exportKwh > 0 in reading ${r.readingId}`);
  }
}
for (const b of bills) {
  if (!consumerIds.has(b.consumerId)) throw new Error(`Invalid consumerId ${b.consumerId} in bills`);
  if (!meterIds.has(b.meterId)) throw new Error(`Invalid meterId ${b.meterId} in bills`);
  const consumer = consumers.find(c => c.consumerId === b.consumerId)!;
  if (!consumer.hasSolar && b.exportKwh > 0) {
    throw new Error(`Consumer without solar has exportKwh > 0 in bill ${b.billId}`);
  }
  // Check net math
  const calculatedNet = Number((b.importKwh - b.exportKwh - b.creditInKwh).toFixed(2));
  if (Math.abs(calculatedNet - b.netKwh) > 0.05) {
    throw new Error(`Bill net math mismatch in ${b.billId}: calculated ${calculatedNet} vs stored ${b.netKwh}`);
  }
  if (b.netKwh < 0) {
    if (b.amount !== 0) throw new Error(`Bill ${b.billId} with negative net has amount !== 0`);
    if (Math.abs(b.creditOutKwh - Math.abs(b.netKwh)) > 0.05) {
      throw new Error(`Bill ${b.billId} creditOutKwh mismatch`);
    }
  }
}
for (const a of alerts) {
  if (a.type === 'LOW_BATTERY' && !batteryIds.has(a.refId)) {
    throw new Error(`Alert ${a.alertId} has invalid battery refId ${a.refId}`);
  }
  if (a.type === 'LOW_OUTPUT' && !plantIds.has(a.refId)) {
    throw new Error(`Alert ${a.alertId} has invalid plant refId ${a.refId}`);
  }
  if (a.type === 'WARRANTY_EXPIRY' && !equipIds.has(a.refId)) {
    throw new Error(`Alert ${a.alertId} has invalid equipment refId ${a.refId}`);
  }
}
for (const cc of carbonCredits) {
  if (!plantIds.has(cc.plantId)) throw new Error(`Invalid plantId in carbonCredit ${cc.creditId}`);
  const expectedCo2 = Number((cc.unitsKwh * 0.71).toFixed(2));
  if (Math.abs(expectedCo2 - cc.co2AvoidedKg) > 0.05) {
    throw new Error(`Carbon credit formula mismatch in ${cc.creditId}`);
  }
}
console.log('All verification assertions PASSED!');

// Write JSON files to ./seed_data and ./public/seed_data and ./src/data
const outputDirs = [
  path.join(process.cwd(), 'seed_data'),
  path.join(process.cwd(), 'public', 'seed_data'),
  path.join(process.cwd(), 'src', 'data')
];

for (const dir of outputDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

for (const [name, data] of Object.entries(collections)) {
  const jsonContent = JSON.stringify(data, null, 2);
  for (const dir of outputDirs) {
    fs.writeFileSync(path.join(dir, `${name}.json`), jsonContent, 'utf-8');
  }
  console.log(`Saved ${name}.json (120 documents)`);
}

// Generate index bundle file for easy frontend import
const bundleFile = path.join(process.cwd(), 'src', 'data', 'allCollections.ts');
const bundleContent = `// Auto-generated export bundle of all 10 seed collections
import plants from './plants.json';
import equipment from './equipment.json';
import batteries from './batteries.json';
import generation from './generation.json';
import consumers from './consumers.json';
import meters from './meters.json';
import readings from './readings.json';
import bills from './bills.json';
import alerts from './alerts.json';
import carbonCredits from './carbonCredits.json';

export const collectionsData = {
  plants,
  equipment,
  batteries,
  generation,
  consumers,
  meters,
  readings,
  bills,
  alerts,
  carbonCredits
} as const;

export type CollectionName = keyof typeof collectionsData;
`;
fs.writeFileSync(bundleFile, bundleContent, 'utf-8');
console.log('Generated src/data/allCollections.ts');
