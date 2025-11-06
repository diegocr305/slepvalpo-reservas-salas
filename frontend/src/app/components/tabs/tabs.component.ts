import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButton } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>SLEP Valparaíso - Reservas</ion-title>
        <ion-button slot="end" fill="clear" (click)="logout()">
          <ion-icon name="log-out-outline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>
    
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="calendario">
          <ion-icon name="calendar-outline"></ion-icon>
          <ion-label>Calendario</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="reservar">
          <ion-icon name="add-circle-outline"></ion-icon>
          <ion-label>Reservar</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonTitle, IonButton]
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