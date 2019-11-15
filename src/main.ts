import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { StorageService } from './app/services/storage.service';

if (environment.production) {
  enableProdMode();
}

StorageService.getInstance().getMany('firebase_config', 'database_index').then(([config, index]) => {
  console.log('firebase_config in storage:');
  console.log(config);
  StorageService.setTmp('firebase_config', config);
  StorageService.setTmp('database_index', index);
  platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));
});
