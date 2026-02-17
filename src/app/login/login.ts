import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService } from '../supabase.service';
import { AuthDialogComponent } from '../shared/auth-dialog/auth-dialog.component';
import { filter, switchMap, take } from 'rxjs/operators';
// @ts-ignore
import AOS from 'aos';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterLink, MatDialogModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isSubmitting = false;
  showSuccess = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabase: SupabaseService,
    private dialog: MatDialog
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  ngOnInit() {
    AOS.init();

    // Auto-redirect if already logged in - wait for profile to decide where to go
    this.supabase.initialized.pipe(
      filter(init => init === true),
      switchMap(() => this.supabase.currentProfile),
      take(1)
    ).subscribe(profile => {
      if (profile) {
        this.redirectByRole(profile.role);
      }
    });
  }

  private redirectByRole(role: string) {
    if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (role === 'employer') {
      this.router.navigate(['/employer']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  get f() { return this.loginForm.controls; }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleRemember() {
    const current = this.loginForm.get('remember')?.value;
    this.loginForm.patchValue({ remember: !current });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      const { email, password } = this.loginForm.value;

      try {
        const { data, error } = await this.supabase.signInWithPassword(email, password);

        if (error) {
          console.error("Login Error:", error.message);

          if (error.message.includes("Email not confirmed")) {
            alert("Please confirm your email address before logging in. Check your inbox.");
            return;
          }

          if (error.message.includes("Invalid login credentials")) {
            this.openAuthDialog();
          } else {
            alert(error.message);
          }
          return;
        }

        this.showSuccess = true;



        // Wait for profile to load before redirecting
        this.supabase.currentProfile.pipe(
          filter(p => p !== null),
          take(1)
        ).subscribe(profile => {
          setTimeout(() => {
            if (profile) this.redirectByRole(profile.role);
            else this.router.navigate(['/home']);
          }, 1000);
        });

      } catch (err) {
        // Error handled by dialog or silent catch
        console.error("Login failed", err);
      } finally {
        this.isSubmitting = false;
      }
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }

  openAuthDialog() {
    this.dialog.open(AuthDialogComponent, {
      width: '400px',
      data: { type: 'login-failed' }
    });
  }
}
