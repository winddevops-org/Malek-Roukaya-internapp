// src/app/acceuil/acceuil.component.ts
import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';
import countriesData from 'world-countries';

import {
  EntrepriseService,
  Entreprise,
  LoginResponse
} from '../services/entreprise.service';

@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [
      CommonModule,
      FormsModule,
      NgxIntlTelInputModule,
    ],
  templateUrl: './acceuil.component.html',
  styleUrls: ['./acceuil.component.css']
})
export class AcceuilComponent implements OnInit {
  // Configurations pour ngx-intl-tel-input exposées au template
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  PhoneNumberFormat = PhoneNumberFormat;
  preferredCountries: CountryISO[] = [CountryISO.Tunisia, CountryISO.France, CountryISO.Canada];

  countriesList: any[] = [];
  filteredCountriesList: any[] = [];
  countryDropdownOpen = false;
  countrySearch = '';
  formSubmitAttempted = false;
  @ViewChild('phoneCtrl') phoneCtrl?: NgModel;

  get selectedCountry(): any {
    return this.countriesList.find(c => c.name === this.signupForm.gouvernorat) || null;
  }

  showSignupModal = false;
  showLoginModal = false;
  showSuccessModal = false;
  showForgotModal = false;
  showOtpModal = false;
  showResetPasswordModal = false;
  showForgotSuccessModal = false;

  signupError = '';
  loginError = '';
  forgotError = '';
  otpError = '';
  resetPasswordError = '';

  signupForm = {
    nom: '',
    prenom: '',
    email: '',
    telephone: null as any, // Modifié pour accueillir l'objet généré par la librairie
    gouvernorat: '',
    ville: ''
  };

  loginForm = {
    email: '',
    password: ''
  };

  forgotEmail = '';
  otpCode = '';
  newPassword = '';
  confirmNewPassword = '';


  constructor(
    private router: Router,
    private entrepriseService: EntrepriseService
  ) {}
  // Génère l'emoji drapeau depuis le code ISO 2 lettres (ex: TN → 🇹🇳)
  // Chaque lettre est convertie en Regional Indicator Symbol (U+1F1E6 + offset)
  private cca2ToFlag(code: string): string {
    if (!code || code.length !== 2) return '🏳';
    return Array.from(code.toUpperCase())
      .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
      .join('');
  }

  ngOnInit() {
    this.countriesList = countriesData.map(country => ({
      name: country.name.common,
      flag: this.cca2ToFlag(country.cca2),
      code: country.cca2
    })).sort((a, b) => a.name.localeCompare(b.name));
    this.filteredCountriesList = [...this.countriesList];
  }

  // Dropdown pays custom
  toggleCountryDropdown(): void {
    this.countryDropdownOpen = !this.countryDropdownOpen;
    if (this.countryDropdownOpen) {
      this.countrySearch = '';
      this.filteredCountriesList = [...this.countriesList];
      // Focus sur le champ de recherche après ouverture
      setTimeout(() => {
        const input = document.querySelector('.country-search-input') as HTMLInputElement;
        if (input) input.focus();
      }, 50);
    }
  }

  closeCountryDropdown(): void {
    this.countryDropdownOpen = false;
    this.countrySearch = '';
  }

  selectCountry(country: any): void {
    this.signupForm.gouvernorat = country.name;
    this.countryDropdownOpen = false;
    this.countrySearch = '';
  }

  filterCountries(): void {
    const term = this.countrySearch.toLowerCase().trim();
    if (!term) {
      this.filteredCountriesList = [...this.countriesList];
    } else {
      this.filteredCountriesList = this.countriesList.filter(c =>
        c.name.toLowerCase().includes(term)
      );
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.country-dropdown-wrapper')) {
      this.countryDropdownOpen = false;
    }
  }
  isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // ngx-intl-tel-input retourne un objet avec les champs suivants quand valide :
  // { nationalNumber, dialCode, e164Number, countryCode, number, ... }
  // Utilise le validateur Angular de ngx-intl-tel-input ([phoneValidation]="true")
  // qui s'appuie sur google-libphonenumber pour valider par pays.
  // phoneCtrl.valid = true SEULEMENT si le numéro est valide pour le pays sélectionné.
  isValidPhone(phone: any): boolean {
    // Priorité : le validateur Angular intégré de la librairie via ViewChild
    if (this.phoneCtrl) {
      return this.phoneCtrl.valid === true;
    }
    // Fallback si ViewChild pas encore initialisé (ex: ngOnInit)
    if (!phone || typeof phone !== 'object') return false;
    if (phone.numberInstance && typeof phone.numberInstance.isValid === 'function') {
      return phone.numberInstance.isValid();
    }
    return false;
  }

  get newPasswordHasMinLength(): boolean {
    return this.newPassword.length >= 8;
  }

  get newPasswordHasUppercase(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }

  get newPasswordHasNumber(): boolean {
    return /[0-9]/.test(this.newPassword);
  }

  get newPasswordIsValid(): boolean {
    return this.newPasswordHasMinLength && this.newPasswordHasUppercase && this.newPasswordHasNumber;
  }

  get newPasswordsMatch(): boolean {
    return (
      this.confirmNewPassword.length > 0 &&
      this.newPassword === this.confirmNewPassword
    );
  }

  get signupFormValid(): boolean {
    return (
      this.signupForm.nom.trim() !== '' &&
      this.signupForm.prenom.trim() !== '' &&
      this.isValidEmail(this.signupForm.email) &&
      this.isValidPhone(this.signupForm.telephone) &&
      this.signupForm.gouvernorat.trim() !== '' &&
      this.signupForm.ville.trim() !== ''
    );
  }

  get loginFormValid(): boolean {
    return (
      this.isValidEmail(this.loginForm.email) &&
      this.loginForm.password.trim() !== ''
    );
  }

  get otpFormValid(): boolean {
    return this.otpCode.trim().length === 6;
  }

  signup(): void {
    this.showSignupModal = true;
    this.showLoginModal = false;
    this.signupError = '';
  }

  login(): void {
    this.showLoginModal = true;
    this.showSignupModal = false;
    this.loginError = '';
  }

  closeModals(): void {
    this.showSignupModal = false;
    this.showLoginModal = false;
    this.showForgotModal = false;
    this.showOtpModal = false;
    this.showResetPasswordModal = false;
    this.formSubmitAttempted = false;
    this.signupError = '';
    this.loginError = '';
    this.forgotError = '';
    this.otpError = '';
    this.resetPasswordError = '';
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.formSubmitAttempted = false;
    this.signupForm = {
      nom: '', prenom: '', email: '', telephone: null, gouvernorat: '', ville: ''
    };
  }

  submitSignup(): void {
    this.formSubmitAttempted = true;
    if (!this.signupFormValid) {
      return;
    }

    this.signupError = '';

    const entreprise: Entreprise = {
      nom: this.signupForm.nom,
      matriculeFiscale: this.signupForm.prenom,
      email: this.signupForm.email,
      // Récupération de la version internationale (ex: +21612345678)
      telephone: this.signupForm.telephone.e164Number,
      gouvernorat: this.signupForm.gouvernorat,
      ville: this.signupForm.ville,
      password: ""
    };

    this.entrepriseService.inscription(entreprise).subscribe({
      next: (response: Entreprise) => {
        this.showSignupModal = false;
        this.showSuccessModal = true;
      },
      error: (error: any) => {
        if (error.status === 0) {
          this.signupError = 'Impossible de contacter le serveur.';
        } else if (error.error?.message) {
          this.signupError = error.error.message;
        } else {
          this.signupError = 'Une erreur est survenue.';
        }
      }
    });
  }

  submitLogin(): void {
    if (!this.loginFormValid) {
      return;
    }

    this.loginError = '';

    this.entrepriseService.login(this.loginForm).subscribe({
      next: (response: LoginResponse) => {
        if (response.type === 'SUPER_ADMIN') {
          localStorage.setItem('superAdmin', JSON.stringify(response));
          localStorage.setItem('userType', 'SUPER_ADMIN');
          this.closeModals();
          this.router.navigate(['/super-admin']);

        } else if (response.type === 'ENTREPRISE') {
          localStorage.setItem('entreprise', JSON.stringify(response));
          localStorage.setItem('userType', 'ENTREPRISE');
          this.closeModals();
          this.router.navigate(['/admin']);

        } else if (response.type === 'USER') {
          localStorage.setItem('user', JSON.stringify(response));
          localStorage.setItem('userType', 'USER');
          this.closeModals();
          this.router.navigate(['/user']);
        }
      },
      error: (error: any) => {
        if (error.status === 0) {
          this.loginError = 'Impossible de contacter le serveur.';
        } else if (error.error?.message) {
          this.loginError = error.error.message;
        } else {
          this.loginError = 'Email ou mot de passe incorrect.';
        }
      }
    });
  }

  switchToLogin(): void {
    this.showSignupModal = false;
    this.showLoginModal = true;
    this.signupError = '';
    this.loginError = '';
  }

  switchToSignup(): void {
    this.showLoginModal = false;
    this.showSignupModal = true;
    this.signupError = '';
    this.loginError = '';
  }

  forgotPassword(): void {
    this.showLoginModal = false;
    this.showForgotModal = true;
    this.loginError = '';
    this.forgotError = '';
  }

  closeForgotModal(): void {
    this.showForgotModal = false;
    this.forgotEmail = '';
    this.forgotError = '';
  }

  submitForgotPassword(): void {
    if (!this.isValidEmail(this.forgotEmail)) {
      this.forgotError = "L'adresse email n'est pas valide.";
      return;
    }

    this.forgotError = '';

    this.entrepriseService.requestOTP(this.forgotEmail).subscribe({
      next: (response: any) => {
        this.showForgotModal = false;
        this.showOtpModal = true;
      },
      error: (error: any) => {
        this.forgotError = error.error?.message || 'Une erreur est survenue';
      }
    });
  }

  submitOTP(): void {
    if (!this.otpFormValid) {
      return;
    }

    this.otpError = '';

    this.entrepriseService.verifyOTP(this.forgotEmail, this.otpCode).subscribe({
      next: (response: any) => {
        this.showOtpModal = false;
        this.showResetPasswordModal = true;
      },
      error: (error: any) => {
        this.otpError = error.error?.message || 'Code OTP invalide';
      }
    });
  }

  closeOtpModal(): void {
    this.showOtpModal = false;
    this.otpCode = '';
    this.otpError = '';
  }

  submitResetPassword(): void {
    if (!this.newPasswordIsValid || !this.newPasswordsMatch) {
      return;
    }

    this.resetPasswordError = '';

    this.entrepriseService.resetPassword(this.forgotEmail, this.otpCode, this.newPassword).subscribe({
      next: (response: any) => {
        this.showResetPasswordModal = false;
        this.showForgotSuccessModal = true;
        this.forgotEmail = '';
        this.otpCode = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
      },
      error: (error: any) => {
        this.resetPasswordError = error.error?.message || 'Une erreur est survenue';
      }
    });
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal = false;
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.resetPasswordError = '';
  }

  closeForgotSuccessModal(): void {
    this.showForgotSuccessModal = false;
    this.showLoginModal = true;
  }
}
