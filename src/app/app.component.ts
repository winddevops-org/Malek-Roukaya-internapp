import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SuperAdminComponent } from './super-admin/super-admin.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,SuperAdminComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'proj_ang';
}
