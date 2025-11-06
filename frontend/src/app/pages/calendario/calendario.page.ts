import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-calendario',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Calendario de Reservas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Calendario</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-card>
        <ion-card-header>
          <ion-card-title>📅 Calendario de Reservas</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Vista del calendario de reservas de salas.</p>
          <p><strong>Edificio Blanco:</strong> Principal, Guayaquil, San Antonio</p>
          <p><strong>Edificio Cochrane:</strong> Principal, Secundaria</p>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-header>
          <ion-card-title>🏢 Salas Disponibles</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Aquí se mostrarán las salas disponibles y sus reservas.</p>
          <p>Funcionalidad completa disponible cuando se conecte a Supabase.</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle]
})
export class CalendarioPage {}