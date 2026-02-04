import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface AppContext {
  apiClientId?: string;
  merchant?: string;
}

@Injectable()
export class AppContextService {
  private static storage = new AsyncLocalStorage<AppContext>();

  static run<T>(context: AppContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  static get(): AppContext {
    return this.storage.getStore() || {};
  }

  static set(key: keyof AppContext, value: string): void {
    const store = this.storage.getStore();
    if (store) {
      store[key] = value;
    }
  }
}