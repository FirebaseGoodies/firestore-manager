import { DatabaseConfig } from './database-config.model';

export interface Database {
  index?: number,
  config: DatabaseConfig,
  collections: string[]
}
