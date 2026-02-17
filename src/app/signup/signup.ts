import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SupabaseService, EmployeeInvitation } from '../supabase.service';
import { AuthDialogComponent } from '../shared/auth-dialog/auth-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter, switchMap, take } from 'rxjs/operators';
// @ts-ignore
import AOS from 'aos';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, MatSnackBarModule, MatDialogModule],
    templateUrl: './signup.html',
    styleUrls: ['./signup.css']
})
export class SignupComponent implements OnInit {
    signupForm!: FormGroup;
    showPassword = false;
    isSubmitting = false;
    invitationToken: string | null = null;
    invitation: EmployeeInvitation | null = null;
    isValidatingToken = false;

    constructor(
        private fb: FormBuilder,
        private supabase: SupabaseService,
        private router: Router,
        private route: ActivatedRoute,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {
        this.initForm();
    }

    ngOnInit() {
        AOS.init();

        // Check for invitation token
        this.invitationToken = this.route.snapshot.queryParamMap.get('token');
        if (this.invitationToken) {
            this.validateToken();
        }

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

    async validateToken() {
        if (!this.invitationToken) return;

        this.isValidatingToken = true;
        try {
            const { data, error } = await this.supabase.getInvitationByToken(this.invitationToken);
            if (error || !data) {
                this.snackBar.open('Invalid or expired invitation link.', 'Close', { duration: 5000 });
                this.invitationToken = null;
            } else {
                this.invitation = data;
                this.signupForm.patchValue({ email: data.email });
                this.signupForm.get('email')?.disable(); // Lock email to invitation
            }
        } catch (error) {
            console.error('Error validating token:', error);
        } finally {
            this.isValidatingToken = false;
        }
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

    initForm() {
        this.signupForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    get f() { return this.signupForm.controls; }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    async onSubmit() {
        if (this.signupForm.invalid) {
            this.markFormGroupTouched(this.signupForm);
            return;
        }

        this.isSubmitting = true;
        const { email, password } = this.signupForm.value;

        try {
            const { data, error } = await this.supabase.signUp(email, password);

            if (error) {
                if (error.message.includes("already registered") || error.status === 400) {
                    this.openAuthDialog();
                } else {
                    this.snackBar.open(error.message, 'Close', { duration: 3000 });
                }
                return;
            }
            // Success - Redirect or Show content
            // For Supabase, if email confirmation is on, it says "Check your email".
            // If auto-confirm is on, we are logged in.

            if (data.user) {
                // Create initial profile
                await this.supabase.updateProfile({
                    username: email.split('@')[0], // Default username from email
                    website: '',
                    avatar_url: '',
                    role: this.invitation ? 'employee' : 'employee', // Default to employee
                    employer_id: this.invitation?.employer_id // Link if invited
                });

                if (this.invitationToken) {
                    await this.supabase.markInvitationUsed(this.invitationToken);
                }
            }

            this.snackBar.open('Signup successful! Please login.', 'Close', { duration: 5000 });
            this.router.navigate(['/login']);
        } catch (error: any) {
            this.snackBar.open(error.message || 'An error occurred', 'Close', { duration: 3000 });
        } finally {
            setTimeout(() => this.isSubmitting = false);
        }
    }

    openAuthDialog() {
        this.dialog.open(AuthDialogComponent, {
            width: '400px',
            data: { type: 'signup-failed' }
        });
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.values(formGroup.controls).forEach(control => {
            control.markAsTouched();
            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }
}
