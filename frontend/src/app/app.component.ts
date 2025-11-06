import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService) {}

  ngOnInit() {
    // Inicializar servicios de autenticación
    console.log('🚀 Iniciando aplicación SLEP Reservas');
  }
}