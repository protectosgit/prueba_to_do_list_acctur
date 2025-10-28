import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getRemoteConfig, RemoteConfig, fetchAndActivate, getValue, Value } from 'firebase/remote-config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp | null = null;
  private remoteConfig: RemoteConfig | null = null;
  private initialized = false;

  // Firebase configuration - Replace with your actual Firebase config
  private firebaseConfig = {
    apiKey: "AIzaSyDxmKNkwOACAo833Ma-amEI1HHKtV7vAqM",
    authDomain: "to-do-list-73d21.firebaseapp.com",
    projectId: "to-do-list-73d21",
    storageBucket: "to-do-list-73d21.firebasestorage.app",
    messagingSenderId: "965120352359",
    appId: "1:965120352359:web:6f408582354c1a8a3f34c2",
    measurementId: "G-H592FNPE9J"
  };

  constructor() {}

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize Firebase
      this.app = initializeApp(this.firebaseConfig);
      
      // Initialize Remote Config
      this.remoteConfig = getRemoteConfig(this.app);
      
      // Set config settings
      this.remoteConfig.settings = {
        minimumFetchIntervalMillis: 3600000, // 1 hour
        fetchTimeoutMillis: 60000 // 1 minute
      };

      // Set default config values
      this.remoteConfig.defaultConfig = {
        'enable_categories': true,
        'enable_dark_mode': false,
        'max_tasks': 100,
        'enable_notifications': false,
        'show_completed_tasks': true
      };

      // Fetch and activate config
      await fetchAndActivate(this.remoteConfig);
      
      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      // Continue without Firebase if initialization fails
      this.initialized = false;
    }
  }

  async getFeatureFlag(key: string): Promise<boolean> {
    if (!this.initialized || !this.remoteConfig) {
      // Return default values if Firebase is not initialized
      const defaults: { [key: string]: boolean } = {
        'enable_categories': true,
        'enable_notifications': false,
        'show_completed_tasks': true
      };
      return defaults[key] ?? false;
    }

    try {
      const value: Value = getValue(this.remoteConfig, key);
      return value.asBoolean();
    } catch (error) {
      console.error(`Error getting feature flag ${key}:`, error);
      return false;
    }
  }

  async getRemoteConfigValue(key: string): Promise<string> {
    if (!this.initialized || !this.remoteConfig) {
      return '';
    }

    try {
      const value: Value = getValue(this.remoteConfig, key);
      return value.asString();
    } catch (error) {
      console.error(`Error getting remote config value ${key}:`, error);
      return '';
    }
  }

  async getRemoteConfigNumber(key: string): Promise<number> {
    if (!this.initialized || !this.remoteConfig) {
      // Return default value for max_tasks
      if (key === 'max_tasks') {
        return 100;
      }
      return 0;
    }
  
    try {
      const value: Value = getValue(this.remoteConfig, key);
      return value.asNumber();
    } catch (error) {
      console.error(`Error getting remote config number ${key}:`, error);
      return key === 'max_tasks' ? 100 : 0;
    }
  }

  async refreshConfig(): Promise<void> {
    if (!this.initialized || !this.remoteConfig) {
      return;
    }

    try {
      await fetchAndActivate(this.remoteConfig);
      console.log('Remote config refreshed successfully');
    } catch (error) {
      console.error('Error refreshing remote config:', error);
    }
  }
}
