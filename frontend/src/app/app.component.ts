import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    // Inicializar la sesión de Supabase
    this.supabaseService.user$.subscribe();
  }
}