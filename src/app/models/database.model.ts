import { DatabaseConfig } from './database-config.model';
import { Authentication } from './auth.model';
import { AutoBackup } from './auto-backup.model';

export interface Database {
  index?: number,
  config: DatabaseConfig,
  collections: string[],
  authentication?: Authentication,
  autoBackup?: AutoBackup,
  tags?: string[]
}
