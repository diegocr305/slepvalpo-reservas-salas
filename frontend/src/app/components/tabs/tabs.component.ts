import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonIcon, IonLabel, IonHeader, IonToolbar, IonButton, IonFab, IonFabButton } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-header>
      <ion-toolbar>
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="assets/images/E01-Valparaíso-01.png" alt="Logo" style="height: 56px;" />
          <span style="font-size: 18px; font-weight: bold; color: #1976d2;">Reservas</span>
        </div>
      </ion-toolbar>
    </ion-header>
    
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="reservar">
          <ion-icon name="add-circle-outline"></ion-icon>
          <ion-label>Reservar</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="mis-reservas">
          <ion-icon name="list-outline"></ion-icon>
          <ion-label>Mis Reservas</ion-label>
        </ion-tab-button>
        
        <ion-tab-button (click)="logout()">
          <ion-icon name="log-out-outline"></ion-icon>
          <ion-label>Salir</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  standalone: true,
  imports: [IonTabs, IonTabBar, IonIcon, IonLabel, IonHeader, IonToolbar, IonButton, IonFab, IonFabButton]
})
export class TabsComponent {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/login']);
  }
}