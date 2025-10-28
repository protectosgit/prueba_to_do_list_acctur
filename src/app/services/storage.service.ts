import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private readonly TASKS_KEY = 'tasks';

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    // Create storage instance
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // Get data from storage
  public async get(key: string): Promise<any> {
    return await this._storage?.get(key);
  }

  // Set data in storage
  public async set(key: string, value: any): Promise<any> {
    return await this._storage?.set(key, value);
  }

  // Remove data from storage
  public async remove(key: string): Promise<any> {
    return await this._storage?.remove(key);
  }

  // Clear all storage
  public async clear(): Promise<void> {
    return await this._storage?.clear();
  }

  // Get all keys
  public async keys(): Promise<string[]> {
    return await this._storage?.keys() || [];
  }

  // Get storage length
  public async length(): Promise<number> {
    return await this._storage?.length() || 0;
  }
}
