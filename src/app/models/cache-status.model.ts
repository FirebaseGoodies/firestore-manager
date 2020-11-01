
export class CacheStatus {
  hasChanged: boolean;
  private locked: boolean;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.hasChanged = false;
    this.locked = false;
  }

  lock(): void {
    this.locked = true;
  }

  unlock(timeout: number = 0): void {
    setTimeout(() => {
      this.reset();
    }, timeout);
  }

  isLocked(): boolean {
    return this.locked;
  }
}
