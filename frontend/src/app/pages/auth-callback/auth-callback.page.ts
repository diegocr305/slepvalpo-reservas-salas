import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-auth-callback',
  template: `
    <ion-content class="ion-padding ion-text-center">
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
        <ion-spinner></ion-spinner>
        <p style="margin-top: 20px;">Completando inicio de sesión...</p>
      </div>
    </ion-content>
  `,
  standalone: true,
  imports: [IonContent, IonSpinner]
})
export class AuthCallbackPage implements OnInit {

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // Esperar a que Supabase procese la autenticación
      const { data: { session }, error } = await this.supabaseService.supabase.auth.getSession();
      
      if (error) {
        console.error('Error en callback:', error);
        this.router.navigate(['/login']);
        return;
      }

      if (session?.user) {
        // Usuario autenticado correctamente
        this.router.navigate(['/tabs/reservar']);
      } else {
        // No hay sesión, regresar al login
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error procesando callback:', error);
      this.router.navigate(['/login']);
    }
  }
}