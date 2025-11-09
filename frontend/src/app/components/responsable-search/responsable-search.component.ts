import { Component, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonList, IonSearchbar } from '@ionic/angular/standalone';
import { SupabaseService } from '../../services/supabase.service';

interface Usuario {
  id: string;
  nombre_completo: string;
  email: string;
}

@Component({
  selector: 'app-responsable-search',
  template: `
    <ion-searchbar 
      [debounce]="1000" 
      placeholder="Buscar responsable..."
      (ionInput)="handleInput($event)">
    </ion-searchbar>
    
    <ion-list *ngIf="results.length > 0">
      <ion-item *ngFor="let usuario of results" button (click)="selectResponsable(usuario)">
        <ion-label>
          <h3>{{ usuario.nombre_completo }}</h3>
          <p>{{ usuario.email }}</p>
        </ion-label>
      </ion-item>
    </ion-list>
    
    <div *ngIf="selectedResponsable" class="selected-responsable">
      <ion-item>
        <ion-label>
          <h3>Responsable seleccionado:</h3>
          <p>{{ selectedResponsable.nombre_completo }} ({{ selectedResponsable.email }})</p>
        </ion-label>
      </ion-item>
    </div>
  `,
  styles: [`
    .selected-responsable {
      margin-top: 8px;
    }
    .selected-responsable ion-item {
      --background: var(--ion-color-light);
      --border-color: var(--ion-color-primary);
      border: 1px solid var(--ion-color-primary);
      border-radius: 8px;
    }
  `],
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonList, IonSearchbar],
})
export class ResponsableSearchComponent {
  @Output() responsableSelected = new EventEmitter<Usuario>();
  @Input() selectedResponsable: Usuario | null = null;
  
  public results: Usuario[] = [];

  constructor(private supabaseService: SupabaseService, private cdr: ChangeDetectorRef) {}

  async handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value || '';
    
    console.log('=== HANDLE INPUT ===');
    console.log('Query:', query);
    
    if (query.length < 1) {
      this.results = [];
      this.cdr.detectChanges();
      return;
    }
    
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('usuarios')
        .select('id, nombre_completo, email')
        .ilike('nombre_completo', `%${query}%`)
        .eq('activo', true)
        .limit(10);

      console.log('DB Result:', { data, error });
      
      if (error) throw error;
      this.results = data || [];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error:', error);
      this.results = [];
      this.cdr.detectChanges();
    }
  }

  selectResponsable(usuario: Usuario) {
    console.log('Seleccionando responsable:', usuario);
    this.selectedResponsable = usuario;
    this.results = [];
    this.responsableSelected.emit(usuario);
    this.cdr.detectChanges();
    console.log('Evento emitido');
  }

  clearSelection() {
    this.selectedResponsable = null;
    this.results = [];
    this.cdr.detectChanges();
  }
}