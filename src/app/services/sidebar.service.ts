// src/app/services/sidebar.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  // Le menu est ouvert par défaut.
  // (Sur mobile, on pourrait le fermer par défaut, mais pour l'instant on le met à true globalement)
  private isOpenSubject = new BehaviorSubject<boolean>(true);
  isOpen$ = this.isOpenSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // Ferme automatiquement la sidebar sur mobile au chargement
      if (window.innerWidth <= 768) {
        this.isOpenSubject.next(false);
      }
    }
  }

  toggle(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  setIsOpen(value: boolean): void {
    this.isOpenSubject.next(value);
  }
}
