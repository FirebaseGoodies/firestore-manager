import { DatabaseConfig } from './database-config.model';
import { Authentication } from './auth.model';

export interface Database {
  index?: number,
  config: DatabaseConfig,
  collections: string[],
  authentication?: Authentication,
  tags?: string[]
}
