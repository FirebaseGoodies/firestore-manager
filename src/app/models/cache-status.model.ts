
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

  unlock(): void {
    this.reset();
  }

  isLocked(): boolean {
    return this.locked;
  }
}
