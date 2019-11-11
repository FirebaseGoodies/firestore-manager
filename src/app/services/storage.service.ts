import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {
    constructor() {}

    get(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                browser.storage.local.get(key).then((storage) => {
                    resolve(storage[key]);
                });
            }
            catch(error) {
                console.log(error.message);
                const value = localStorage.getItem(key);
                let finalValue;
                try {
                    finalValue = JSON.parse(value);
                }
                catch(error) {
                    finalValue = value;
                }
                resolve(finalValue);
            }
        });
    }

    save(key: string, value: any): void {
        try {
            browser.storage.local.set({[key]: value});
        }
        catch(error) {
            console.log(error.message);
            let finalValue;
            try {
                finalValue = JSON.stringify(value);
            }
            catch(error) {
                finalValue = value;
            }
            localStorage.setItem(key, finalValue);
        }
    }
}
