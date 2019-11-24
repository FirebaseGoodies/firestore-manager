import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { StorageService } from './app/services/storage.service';

if (environment.production) {
  enableProdMode();
}

// Get database config & index from storage before bootstrapping the module
StorageService.getInstance().getMany('firebase_config', 'database_index').then(([config, index]) => {
  // Save as temporary values
  const values = {
    firebase_config: config,
    database_index: index
  };
  // console.log(values);
  StorageService.saveTmp(values);
  // Bootstrap main module
  platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));
});
