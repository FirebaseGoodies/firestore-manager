import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { StorageService } from './app/services/storage.service';

if (environment.production) {
  enableProdMode();
}

StorageService.getInstance().get('firebase_config').then((config) => {
  console.log('firebase_config in storage:');
  console.log(config);
  StorageService.setTmp('firebase_config', config);
  platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));
});
