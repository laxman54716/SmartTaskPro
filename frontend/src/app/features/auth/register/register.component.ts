import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  userData: RegisterRequest = { username: '', email: '', password: '' };
  errorMessage = '';
  isLoading = false;
  
  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.register(this.userData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        // Backend validation errors come as { fieldName: "error message" } map
        if (err.error && typeof err.error === 'object' && !err.error.message) {
          const messages = Object.entries(err.error)
            .map(([field, msg]) => `${msg}`)
            .join('. ');
          this.errorMessage = messages || 'Registration failed. Please try again.';
        } else if (err.error?.message) {
          // ConflictException (username/email already exists) returns { message: "..." }
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
        console.error('Registration error', err);
      }
    });
  }
}
