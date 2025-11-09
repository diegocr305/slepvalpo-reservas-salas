import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonButton, IonFab, IonFabButton, IonChip, IonButtons } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-header>
      <ion-toolbar>
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="assets/images/E01-Valparaíso-01.png" alt="Logo" style="height: 56px;" />
          <span style="font-size: 18px; font-weight: bold; color: #1976d2;">Reservas</span>
        </div>
        
        <ion-buttons slot="end" *ngIf="usuario">
          <ion-chip color="primary" (click)="logout()" style="cursor: pointer;">
            <ion-icon name="person-circle-outline"></ion-icon>
            <ion-label>
              <div style="text-align: left; line-height: 1.2;">
                <div style="font-weight: 500; font-size: 12px;">{{usuario.nombre_completo}}</div>
                <div style="font-size: 10px; opacity: 0.8;">{{usuario.email}}</div>
                <div style="font-size: 10px; opacity: 0.7;" *ngIf="usuario.area">{{usuario.area}}</div>
              </div>
            </ion-label>
            <ion-icon name="log-out-outline" style="margin-left: 8px;"></ion-icon>
          </ion-chip>
        </ion-buttons>
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
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonButton, IonFab, IonFabButton, IonChip, IonButtons, CommonModule]
})
export class TabsComponent implements OnInit {
  usuario: any = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarUsuario();
  }

  async cargarUsuario() {
    try {
      const user = this.supabaseService.user;
      if (user?.email) {
        const { data, error } = await this.supabaseService.supabase
          .from('usuarios')
          .select('*')
          .eq('email', user.email)
          .eq('activo', true)
          .single();
        
        if (data && !error) {
          this.usuario = data;
        }
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  }

  async logout() {
    await this.supabaseService.signOut();
    this.router.navigate(['/login']);
  }
}