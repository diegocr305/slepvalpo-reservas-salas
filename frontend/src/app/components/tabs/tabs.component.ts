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
      <ion-toolbar>
        <div class="header-content">
          <img src="assets/images/E01-Valparaíso-01.png" alt="Logo" class="header-logo" />
          <span class="header-title">Reservas</span>
        </div>
        
        <ion-buttons slot="end" *ngIf="usuario">
          <ion-chip color="primary" class="user-chip">
            <ion-icon name="person-circle-outline"></ion-icon>
            <ion-label class="user-label">
              <div class="user-info">
                <div class="user-name">{{usuario.nombre_completo}}</div>
                <div class="user-email">{{usuario.email}}</div>
                <div class="user-area" *ngIf="usuario.area">{{usuario.area}}</div>
              </div>
            </ion-label>
          </ion-chip>
          <ion-chip color="danger" (click)="logout()" class="logout-chip">
            <ion-icon name="log-out-outline"></ion-icon>
            <ion-label class="logout-label">Salir</ion-label>
          </ion-chip>
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
    .header-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .header-logo {
      height: 56px;
    }
    
    .header-title {
      font-size: 18px;
      font-weight: bold;
      color: #1976d2;
    }
    
    .user-chip {
      max-width: none;
    }
    
    .user-info {
      text-align: left;
      line-height: 1.2;
    }
    
    .user-name {
      font-weight: 500;
      font-size: 12px;
    }
    
    .user-email {
      font-size: 10px;
      opacity: 0.8;
    }
    
    .user-area {
      font-size: 10px;
      opacity: 0.7;
    }
    
    .logout-chip {
      cursor: pointer;
      margin-left: 8px;
    }
    
    .logout-label {
      text-align: center;
    }
    
    /* Estilos móviles */
    @media (max-width: 768px) {
      .header-title {
        display: none;
      }
      
      .header-logo {
        height: 40px;
      }
      
      .user-chip {
        max-width: 200px;
      }
      
      .user-name {
        font-size: 10px;
        font-weight: 500;
      }
      
      .user-email {
        font-size: 9px;
        opacity: 0.8;
      }
      
      .user-area {
        font-size: 9px;
        opacity: 0.7;
      }
      
      .logout-chip {
        margin-left: 4px;
      }
      
      .logout-label {
        font-size: 10px;
      }
    }
    
    /* Header con gradiente */
    .gradient-header {
      --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }
    
    .gradient-toolbar {
      --background: transparent;
      --color: white;
      --border-width: 0;
    }
    
    .gradient-header .header-logo {
      filter: brightness(1.1) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      transition: transform 0.3s ease;
    }
    
    .gradient-header .header-logo:hover {
      transform: scale(1.05);
    }
    
    .gradient-header .header-title {
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      letter-spacing: 0.5px;
      font-weight: 700;
    }
    
    /* Chips con glassmorphism */
    .user-chip-glass {
      background: rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      max-width: none;
    }
    
    .user-chip-glass:hover {
      background: rgba(255, 255, 255, 0.25) !important;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
    
    .logout-chip-glass {
      background: rgba(220, 53, 69, 0.2) !important;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(220, 53, 69, 0.3);
      color: white !important;
      cursor: pointer;
      margin-left: 8px;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.2);
      transition: all 0.3s ease;
    }
    
    .logout-chip-glass:hover {
      background: rgba(220, 53, 69, 0.4) !important;
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 8px 20px rgba(220, 53, 69, 0.4);
    }
    
    .logout-chip-glass:active {
      transform: translateY(0) scale(0.98);
    }
    
    .user-icon, .logout-icon {
      color: white !important;
      font-size: 1.2rem;
    }
    
    .gradient-header .user-name {
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .gradient-header .user-email {
      opacity: 0.9;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .gradient-header .user-area {
      opacity: 0.8;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .logout-label {
      color: white !important;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    

    
    /* Fix para logout label */
    .logout-label {
      color: var(--ion-color-danger) !important;
    }
    
    /* Estilos para Tab Bar con gradiente */
    .custom-tab-bar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      box-shadow: 0 -8px 25px rgba(102, 126, 234, 0.3) !important;
      border-top: 3px solid #4f46e5 !important;
      backdrop-filter: blur(10px);
      position: relative;
    }
    
    .custom-tab-bar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.1);
      pointer-events: none;
    }
    
    .custom-tab-button {
      --color: rgba(255, 255, 255, 0.7) !important;
      --color-selected: #ffffff !important;
      --background: transparent !important;
      --background-focused: rgba(255, 255, 255, 0.1) !important;
      --ripple-color: rgba(255, 255, 255, 0.3) !important;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .custom-tab-button.tab-selected {
      transform: translateY(-2px);
    }
    
    .custom-tab-button.tab-selected::before {
      content: '';
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      backdrop-filter: blur(10px);
      z-index: -1;
    }
    
    .tab-icon {
      font-size: 1.4rem !important;
      transition: all 0.3s ease;
    }
    
    .custom-tab-button.tab-selected .tab-icon {
      transform: scale(1.1);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    
    .tab-label {
      font-size: 0.75rem !important;
      font-weight: 500 !important;
      margin-top: 4px !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .custom-tab-button:hover {
      --background-focused: rgba(255, 255, 255, 0.15) !important;
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