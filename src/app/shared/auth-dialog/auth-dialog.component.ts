import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

export type AuthDialogType = 'login-failed' | 'signup-failed';

export interface AuthDialogData {
    type: AuthDialogType;
    email?: string;
}

@Component({
    selector: 'app-auth-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content>
      <p>{{ message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onAction()">{{ actionText }}</button>
    </mat-dialog-actions>
  `,
    styles: [`
    h2 { color: #1e293b; }
    p { color: #64748b; font-size: 16px; margin-bottom: 20px; }
  `]
})
export class AuthDialogComponent {
    title: string;
    message: string;
    actionText: string;

    constructor(
        public dialogRef: MatDialogRef<AuthDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AuthDialogData,
        private router: Router
    ) {
        if (data.type === 'login-failed') {
            this.title = 'Account Not Found';
            this.message = "We couldn't find an account with these credentials. Would you like to create a new account?";
            this.actionText = 'Sign Up';
        } else {
            this.title = 'Account Already Exists';
            this.message = "An account with this email already exists. Would you like to log in instead?";
            this.actionText = 'Log In';
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onAction(): void {
        this.dialogRef.close(true);
        if (this.data.type === 'login-failed') {
            this.router.navigate(['/signup']);
        } else {
            this.router.navigate(['/login']);
        }
    }
}
