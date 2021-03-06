import { AbstractControl, ValidationErrors } from '@angular/forms';
import { DatabaseConfig } from '../models/database-config.model';
import { sanitizeJson } from '../helpers/parser.helper';

export function databaseConfigValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value) {
    const config: DatabaseConfig = parseDatabaseConfig(control.value);
    if (! isDatabaseConfigValid(config)) {
      return { configInvalid: true };
    }
  }

  return null;
}

export function parseDatabaseConfig(config: string): DatabaseConfig {
  try {
    const sanitizedJson = sanitizeJson(config);
    return JSON.parse(sanitizedJson);
  } catch (e) {
    return null;
  }
}

export function isDatabaseConfigValid(config: DatabaseConfig): boolean {
  return !!(config && config.apiKey && config.authDomain && config.databaseURL && config.projectId && config.storageBucket && config.messagingSenderId && config.appId);
}
