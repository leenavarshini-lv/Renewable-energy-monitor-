// Export bundle of all seed collections
import plants from './plants.json';
import equipment from './equipment.json';
import batteries from './batteries.json';
import generation from './generation.json';
import consumers from './consumers.json';
import meters from './meters.json';
import readings from './readings.json';
import bills from './bills.json';
import alerts from './alerts.json';
import auditLogs from './auditLogs.json';
import tariffs from './tariffs.json';
import config from './config.json';
import users from './users.json';

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
  auditLogs,
  tariffs,
  config,
  users,
} as const;

export type CollectionName = keyof typeof collectionsData;
