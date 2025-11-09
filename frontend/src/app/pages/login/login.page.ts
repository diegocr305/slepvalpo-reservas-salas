import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonButton, IonIcon, IonText, IonSpinner } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonButton, IonIcon, IonText, IonSpinner]
})
export class LoginPage implements OnInit {
  loading = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    // Si ya está autenticado, redirigir
    this.supabaseService.user$.subscribe(user => {
      if (user) {
        this.loading = false; // Asegurar que loading se desactive
        this.router.navigate(['/tabs/reservar']);
      }
    });
  }

  async loginWithGoogle() {
    try {
      this.loading = true;
      const { error } = await this.supabaseService.signInWithGoogle();
      
      if (error) {
        console.error('Error en login:', error);
        alert('Error al iniciar sesión: ' + error.message);
        this.loading = false;
      }
      // No ponemos loading = false aquí porque el login con Google redirige
      // El loading se desactivará cuando el usuario regrese autenticado
    } catch (error) {
      console.error('Error:', error);
      alert('Error inesperado al iniciar sesión');
      this.loading = false;
    }
  }
}