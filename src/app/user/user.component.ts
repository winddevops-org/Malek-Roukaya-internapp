import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserLeftSideComponent } from './user-left-side/user-left-side.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, UserLeftSideComponent, NavbarComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {}
