import { Component, OnInit, Inject } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StorageService } from './services/storage.service';
import { FirebaseService } from './services/firebase.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private storageService: StorageService,
    private firebaseService: FirebaseService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.initializeApp();
  }

  async ngOnInit() {
    // Initialize services
    await this.storageService.init();
    await this.firebaseService.initialize();
    await this.applyDarkModeSetting();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      console.log('Platform ready');
    });
  }

  private async applyDarkModeSetting() {
    const enableDarkMode = await this.firebaseService.getFeatureFlag('enable_dark_mode');
    if (enableDarkMode) {
      this.document.body.classList.add('dark-theme');
    } else {
      this.document.body.classList.remove('dark-theme');
    }
  }
}
