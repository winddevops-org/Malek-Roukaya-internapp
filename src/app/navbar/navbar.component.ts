// src/app/navbar/navbar.component.ts
import { Component, OnInit, PLATFORM_ID, Inject, HostListener, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';
import { HttpClient } from '@angular/common/http';
import { SidebarService } from '../services/sidebar.service';
import countriesData from 'world-countries';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgxIntlTelInputModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  userName: string = 'Utilisateur';
  userType: string = 'ENTREPRISE';
  showProfileMenu = false;
  showBurger = false;

  // --- VARIABLES MODALS ---
  currentUser: any = null;
  showProfileModal = false;
  showSettingsModal = false;

  // --- VARIABLES MOT DE PASSE ---
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = '';

  showNewPassword = false;
  showConfirmPassword = false;

  newPwdFocused = false;
  confirmPwdFocused = false;

  // ngx-intl-tel-input
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.Tunisia, CountryISO.France, CountryISO.Canada];

  settingsTab: 'info' | 'password' = 'info';

  // --- VARIABLES MODIFICATION INFOS ---
  editTelephone: any = null;
  phoneIsValid = false;
  editGouvernorat = '';
  editVille = '';
  editNom = '';
  infoError = '';
  infoSuccess = '';

  // NgModel ref pour validation téléphone "propre" (comme inscription)
  @ViewChild('editPhoneCtrl') editPhoneCtrl?: NgModel;

  // PAYS --- dropdown settings
  countriesListS: any[] = [];
  filteredCountriesS: any[] = [];
  countryDropdownOpenS = false;
  countrySearchS = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private http: HttpClient,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const storedUserType = localStorage.getItem('userType');
      if (storedUserType) {
        this.userType = storedUserType;
      }
      if (this.userType === 'ENTREPRISE' || this.userType === 'USER') {
        this.showBurger = true;
      }
      if (this.userType === 'SUPER_ADMIN') {
        const superAdmin = localStorage.getItem('superAdmin');
        if (superAdmin) {
          this.currentUser = JSON.parse(superAdmin);
          this.userName = this.currentUser.nom;
        }
      } else if (this.userType === 'ENTREPRISE') {
        const entreprise = localStorage.getItem('entreprise');
        if (entreprise) {
          this.currentUser = JSON.parse(entreprise);
          this.userName = this.currentUser.nom;
        }
      } else if (this.userType === 'USER') {
        const user = localStorage.getItem('user');
        if (user) {
          this.currentUser = JSON.parse(user);
          this.userName = this.currentUser.nom;
        }
      }
    }

    this.countriesListS = countriesData.map((c: any) => ({
      name: c.name.common,
      flag: this.cca2ToFlag(c.cca2),
      code: c.cca2
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));
    this.filteredCountriesS = [...this.countriesListS];
  }

  private cca2ToFlag(code: string): string {
    if (!code || code.length !== 2) return '🏳';
    return Array.from(code.toUpperCase())
      .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
      .join('');
  }

  getFlagForCountry(name: string): string {
    const found = this.countriesListS.find(c => c.name === name);
    return found ? found.flag : '🏳';
  }

  filterCountriesS(): void {
    const term = this.countrySearchS.toLowerCase().trim();
    this.filteredCountriesS = term
      ? this.countriesListS.filter(c => c.name.toLowerCase().includes(term))
      : [...this.countriesListS];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.country-dropdown-wrapper-settings')) {
      this.countryDropdownOpenS = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('entreprise');
      localStorage.removeItem('user');
      localStorage.removeItem('superAdmin');
      localStorage.removeItem('userType');
      this.closeProfileMenu();
      this.router.navigate(['/']);
    }
  }

  openProfileModal(): void {
    this.showProfileModal = true;
    this.showSettingsModal = false;
    this.closeProfileMenu();
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  openSettingsModal(): void {
    this.showSettingsModal = true;
    this.showProfileModal = false;
    this.settingsTab = 'info';
    this.closeProfileMenu();
    this.resetPasswordForm();
    this.resetInfoForm();
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
    this.resetPasswordForm();
    this.resetInfoForm();
    this.countryDropdownOpenS = false;
  }

  resetPasswordForm(): void {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = '';
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.newPwdFocused = false;
    this.confirmPwdFocused = false;
  }

  hasMinLength(): boolean {
    return this.newPassword ? this.newPassword.length >= 8 : false;
  }
  hasUpperCase(): boolean {
    return this.newPassword ? /[A-Z]/.test(this.newPassword) : false;
  }
  hasNumber(): boolean {
    return this.newPassword ? /[0-9]/.test(this.newPassword) : false;
  }

  // Remplit correctement la valeur du champ TÉLÉPHONE pour ngx-intl-tel-input
  resetInfoForm(): void {
    // Si on a un numéro stocké, l'afficher au format international dans le champ :
    if (
      (this.userType === 'ENTREPRISE' || this.userType === 'SUPER_ADMIN' || (this.currentUser && this.currentUser.role === 'ADMIN')) &&
      this.currentUser?.telephone
    ) {
      this.editTelephone = this.currentUser.telephone;
    } else {
      this.editTelephone = null;
    }
    setTimeout(() => {
      this.onPhoneChange(this.editTelephone); // force la validation en ouvrant modale
    }, 100);

    this.editGouvernorat = this.currentUser?.gouvernorat || '';
    this.editVille = this.currentUser?.ville || '';
    this.editNom = this.currentUser?.nom || '';
    this.infoError = '';
    this.infoSuccess = '';
    this.countryDropdownOpenS = false;
  }

  clearAlerts(): void {
    this.infoError = '';
    this.infoSuccess = '';
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  // Validation 100% fiable ngx-intl-tel-input : on reproduit la logique d’inscription
  onPhoneChange(phone: any): void {
    if (this.editPhoneCtrl) {
      this.phoneIsValid = this.editPhoneCtrl.valid === true;
      return;
    }
    if (!phone || typeof phone !== 'object') {
      this.phoneIsValid = false;
      return;
    }
    if (phone.numberInstance && typeof phone.numberInstance.isValid === 'function') {
      this.phoneIsValid = phone.numberInstance.isValid();
      return;
    }
    this.phoneIsValid = false;
  }

  isValidEditPhone(phone: any): boolean {
    if (this.editPhoneCtrl) {
      return this.editPhoneCtrl.valid === true;
    }
    if (!phone || typeof phone !== 'object') return false;
    if (phone.numberInstance && typeof phone.numberInstance.isValid === 'function') {
      return phone.numberInstance.isValid();
    }
    return false;
  }

  infoFormValid(): boolean {
    if (this.userType === 'ENTREPRISE') {
      return (
        this.isValidEditPhone(this.editTelephone) &&
        this.editGouvernorat.trim().length > 0 &&
        this.editVille.trim().length > 0
      );
    }
    if (
      this.userType === 'USER' ||
      this.userType === 'SUPER_ADMIN' ||
      (this.currentUser && this.currentUser.role === 'ADMIN')
    ) {
      return this.editNom.trim().length > 0;
    }
    return false;
  }

  submitInfoChange(): void {
    if (!this.infoFormValid()) return;
    this.infoError = '';
    this.infoSuccess = '';

    let apiUrl = '';
    let body: any = {};

    const userId = this.currentUser?.id
      || this.currentUser?.idEntreprise
      || this.currentUser?.idUser
      || this.currentUser?.userId
      || this.currentUser?.entrepriseId;

    if (!userId) {
      this.infoError = "Impossible de récupérer l'identifiant. Veuillez vous reconnecter.";
      console.error('currentUser:', this.currentUser);
      return;
    }

    if (this.userType === 'ENTREPRISE') {
      apiUrl = `http://localhost:8080/api/entreprises/${userId}/infos`;
      body = {
        telephone: this.editTelephone?.e164Number || this.editTelephone || '',
        gouvernorat: this.editGouvernorat.trim(),
        ville: this.editVille.trim()
      };
    } else if (
      this.userType === 'USER' ||
      this.userType === 'SUPER_ADMIN' ||
      (this.currentUser && this.currentUser.role === 'ADMIN')
    ) {
      apiUrl = `http://localhost:8080/api/users/${userId}/infos`;
      body = { nom: this.editNom.trim() };
    } else {
      this.infoError = 'Action non supportée.';
      return;
    }

    this.http.put(apiUrl, body).subscribe({
      next: (response: any) => {
        this.infoSuccess = response.message || 'Informations mises à jour avec succès !';
        // Mettre à jour le localStorage et l'affichage
        if (this.userType === 'ENTREPRISE') {
          this.currentUser.telephone = this.editTelephone?.e164Number || body.telephone;
          this.currentUser.gouvernorat = body.gouvernorat;
          this.currentUser.ville = body.ville;
          localStorage.setItem('entreprise', JSON.stringify(this.currentUser));
        } else if (this.userType === 'USER' || this.userType === 'SUPER_ADMIN' || (this.currentUser && this.currentUser.role === 'ADMIN')) {
          this.currentUser.nom = body.nom;
          this.userName = body.nom;
          const key = this.userType === 'USER' ? 'user' : 'superAdmin';
          localStorage.setItem(key, JSON.stringify(this.currentUser));
        }
        setTimeout(() => this.closeSettingsModal(), 2000);
      },
      error: (err: any) => {
        this.infoError = err.error?.message || 'Une erreur est survenue lors de la mise à jour.';
      }
    });
  }

  submitPasswordChange(): void {
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = "Veuillez remplir tous les champs.";
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = "Les nouveaux mots de passe ne correspondent pas.";
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError = "Le nouveau mot de passe doit contenir au moins 8 caractères.";
      return;
    }

    this.passwordError = '';
    this.passwordSuccess = '';

    const userId = this.currentUser?.id
      || this.currentUser?.idEntreprise
      || this.currentUser?.idUser
      || this.currentUser?.userId
      || this.currentUser?.entrepriseId;

    if (!userId) {
      this.passwordError = "Impossible de récupérer l'identifiant. Veuillez vous reconnecter.";
      console.error('currentUser object:', this.currentUser);
      return;
    }

    let apiUrl = '';
    if (this.userType === 'ENTREPRISE') {
      apiUrl = `http://localhost:8080/api/entreprises/${userId}/password`;
    } else if (this.userType === 'USER' || this.userType === 'SUPER_ADMIN') {
      apiUrl = `http://localhost:8080/api/users/${userId}/password`;
    } else {
      this.passwordError = "Action non supportée.";
      return;
    }

    this.http.put(apiUrl, {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: (response: any) => {
        this.passwordSuccess = response.message || "Mot de passe modifié avec succès !";
        setTimeout(() => this.closeSettingsModal(), 2000);
      },
      error: (err: any) => {
        const msg = err.error?.message || err.error?.error || err.message || '';
        const status = err.status ? ` (HTTP ${err.status})` : '';
        this.passwordError = msg
          ? `${msg}${status}`
          : `Erreur lors de la modification${status}. Vérifiez la console.`;
        console.error('Erreur API password:', err);
      }
    });
  }
}
