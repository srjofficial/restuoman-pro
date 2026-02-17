import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../supabase.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title class="text-xl font-bold text-gray-900">Invite New Employee</h2>
    <mat-dialog-content>
      <form [formGroup]="inviteForm" class="mt-4">
        <mat-form-field class="w-full" appearance="outline">
          <mat-label>Email Address</mat-label>
          <input matInput type="email" formControlName="email" placeholder="employee@example.com">
          <mat-error *ngIf="inviteForm.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="inviteForm.get('email')?.hasError('email')">Please enter a valid email address</mat-error>
        </mat-form-field>
        <p class="text-xs text-gray-500 mt-2">
          An invitation link will be generated. You can share this link with the employee to allow them to create their account.
        </p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-4 pt-0">
      <button mat-button (click)="onCancel()" [disabled]="isSubmitting">Cancel</button>
      <button mat-raised-button color="primary" (click)="onInvite()" 
              [disabled]="inviteForm.invalid || isSubmitting"
              class="ml-2">
        {{ isSubmitting ? 'Inviting...' : 'Send Invitation' }}
      </button>
    </mat-dialog-actions>
  `
})
export class InviteDialogComponent {
  inviteForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private dialogRef: MatDialogRef<InviteDialogComponent>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onInvite() {
    if (this.inviteForm.valid) {
      this.isSubmitting = true;
      this.cdr.detectChanges();

      try {
        const { email } = this.inviteForm.value;
        const { error } = await this.supabase.createInvitation(email);

        if (error) throw error;

        this.snackBar.open('Invitation created successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      } catch (error: any) {
        console.error('Error creating invitation:', error);
        this.snackBar.open(error.message || 'Error creating invitation', 'Close', { duration: 3000 });
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
