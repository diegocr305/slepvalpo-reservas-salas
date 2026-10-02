import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonButton, IonFab, IonFabButton, IonChip, IonButtons } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { addCircleOutline, listOutline, logOutOutline, personCircleOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-header>
      <!-- Franja decorativa Gobierno de Chile -->
      <div class="franja-gob" aria-hidden="true">
        <span class="franja-celeste"></span>
        <span class="franja-rojo"></span>
      </div>
      <ion-toolbar class="institucional-toolbar">
        <div class="header-content">
          <img src="assets/images/Logotipo Valparaíso_bco.png" alt="Logo" class="header-logo" />
          <span class="header-title">Reservas</span>
        </div>
        
        <ion-buttons slot="end" *ngIf="usuario">
          <div class="user-box">
            <ion-icon name="person-circle-outline" class="user-box-icon"></ion-icon>
            <div class="user-info">
              <div class="user-name">{{usuario.nombre_completo}}</div>
              <div class="user-email">{{usuario.email}}</div>
              <div class="user-area" *ngIf="usuario.area">{{usuario.area}}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <ion-icon name="log-out-outline"></ion-icon>
            <span>Salir</span>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-tabs>
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        <ion-tab-button tab="reservar" class="custom-tab-button">
          <ion-icon name="add-circle-outline" class="tab-icon"></ion-icon>
          <ion-label class="tab-label">Reservar</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="reservas-dia" class="custom-tab-button">
          <ion-icon name="calendar-outline" class="tab-icon"></ion-icon>
          <ion-label class="tab-label">Reservas del Día</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="mis-reservas" *ngIf="!esFuncionario()" class="custom-tab-button">
          <ion-icon name="list-outline" class="tab-icon"></ion-icon>
          <ion-label class="tab-label">Mis Reservas</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    /* ===== Topbar institucional ===== */
    .franja-gob {
      display: flex;
      width: 100%;
      height: 4px;
    }
    .franja-gob .franja-celeste { flex: 1; background: #006bb9; }
    .franja-gob .franja-rojo { flex: 1; background: #ff1d3d; }

    .institucional-toolbar {
      --background: #25306b;
      --color: #ffffff;
      --border-width: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-left: 12px;
    }

    .header-logo {
      height: 44px;
      width: auto;
    }

    .header-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.3px;
    }

    /* Caja de usuario */
    .user-box {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ffffff;
      padding: 2px 10px;
      margin-right: 6px;
    }

    .user-box-icon {
      font-size: 1.6rem;
      color: #c7cde8;
    }

    .user-info {
      text-align: left;
      line-height: 1.2;
    }

    .user-name { font-weight: 600; font-size: 12px; color: #ffffff; }
    .user-email { font-size: 10px; color: #c7cde8; }
    .user-area { font-size: 10px; color: #9aa4d4; }

    /* Botón salir */
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 29, 61, 0.15);
      border: 1px solid #ff1d3d;
      color: #ffffff;
      border-radius: 20px;
      padding: 6px 14px;
      margin-right: 12px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: background 0.2s ease;
    }
    .logout-btn:hover { background: rgba(255, 29, 61, 0.35); }
    .logout-btn ion-icon { font-size: 1.1rem; }

    @media (max-width: 768px) {
      .header-title { display: none; }
      .header-logo { height: 34px; }
      .user-email, .user-area { display: none; }
      .user-name { font-size: 11px; }
      .logout-btn span { display: none; }
      .logout-btn { padding: 6px 10px; margin-right: 6px; }
    }

    /* ===== Tab bar institucional ===== */
    .custom-tab-bar {
      --background: #25306b;
      border-top: 3px solid #ff1d3d;
    }

    .custom-tab-button {
      --color: #9aa4d4;
      --color-selected: #ffffff;
      --background: transparent;
      --background-focused: rgba(255, 255, 255, 0.08);
      --ripple-color: rgba(255, 255, 255, 0.2);
      transition: all 0.2s ease;
    }

    .custom-tab-button.tab-selected {
      --color-selected: #ffffff;
    }

    .tab-icon {
      font-size: 1.4rem !important;
    }

    .custom-tab-button.tab-selected .tab-icon {
      transform: scale(1.08);
    }

    .tab-label {
      font-size: 0.75rem !important;
      font-weight: 600 !important;
      margin-top: 4px !important;
    }
  `],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar, IonButton, IonFab, IonFabButton, IonChip, IonButtons, CommonModule]
})
export class TabsComponent implements OnInit {
  usuario: any = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    addIcons({ addCircleOutline, listOutline, logOutOutline, personCircleOutline, calendarOutline });
  }

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

  /**
   * Verifica si el usuario es funcionario
   * Los funcionarios solo ven "Reservas del Día", no "Mis Reservas"
   */
  esFuncionario(): boolean {
    return this.usuario?.rol === 'funcionario';
  }
}