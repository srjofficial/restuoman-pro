import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService, RestaurantTable, Profile } from '../../supabase.service';

@Component({
    selector: 'app-table-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatSnackBarModule
    ],
    template: `
    <h2 mat-dialog-title class="text-xl font-bold text-gray-900">
      {{ isEdit ? 'Edit Table ' + data.table?.table_number : 'Add New Table' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="tableForm" class="mt-4 flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
                <mat-label>Table Number</mat-label>
                <input matInput type="number" formControlName="table_number" placeholder="101">
                <mat-error *ngIf="tableForm.get('table_number')?.hasError('required')">Table number is required</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
                <mat-label>Capacity (Persons)</mat-label>
                <input matInput type="number" formControlName="capacity" placeholder="4">
                <mat-error *ngIf="tableForm.get('capacity')?.hasError('required')">Capacity is required</mat-error>
            </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="available">Available</mat-option>
            <mat-option value="occupied">Occupied</mat-option>
            <mat-option value="reserved">Reserved</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Assign Employee</mat-label>
          <mat-select formControlName="assigned_employee_id">
            <mat-option [value]="null">No Assignment</mat-option>
            <mat-option *ngFor="let employee of data.employees" [value]="employee.id">
              {{ employee.username }} ({{ employee.role }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <p class="text-xs text-gray-500">
           Tables can be assigned to staff members. Staff will only see and manage orders for their assigned tables.
        </p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-4 pt-0">
      <button mat-button (click)="onCancel()" [disabled]="isSubmitting">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" 
              [disabled]="tableForm.invalid || isSubmitting"
              class="ml-2">
        {{ isSubmitting ? 'Saving...' : (isEdit ? 'Update Table' : 'Create Table') }}
      </button>
    </mat-dialog-actions>
  `
})
export class TableDialogComponent implements OnInit {
    tableForm: FormGroup;
    isSubmitting = false;
    isEdit = false;

    constructor(
        private fb: FormBuilder,
        private supabase: SupabaseService,
        private dialogRef: MatDialogRef<TableDialogComponent>,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA) public data: { table?: RestaurantTable, employees: Profile[] }
    ) {
        this.isEdit = !!data.table;
        this.tableForm = this.fb.group({
            table_number: [data.table?.table_number || '', [Validators.required, Validators.min(1)]],
            capacity: [data.table?.capacity || 4, [Validators.required, Validators.min(1)]],
            status: [data.table?.status || 'available', [Validators.required]],
            assigned_employee_id: [data.table?.assigned_employee_id || null]
        });
    }

    ngOnInit(): void { }

    async onSave() {
        if (this.tableForm.valid) {
            this.isSubmitting = true;
            this.cdr.detectChanges();

            try {
                const formData = this.tableForm.value;
                let result;

                if (this.isEdit) {
                    result = await this.supabase.updateTable(this.data.table!.id!, formData);
                } else {
                    result = await this.supabase.createTable(formData);
                }

                if (result.error) throw result.error;

                this.snackBar.open(`Table ${formData.table_number} ${this.isEdit ? 'updated' : 'created'} successfully!`, 'Close', { duration: 3000 });
                this.dialogRef.close(true);
            } catch (error: any) {
                console.error('Error saving table:', error);
                this.snackBar.open(error.message || 'Error saving table', 'Close', { duration: 3000 });
                this.isSubmitting = false;
                this.cdr.detectChanges();
            }
        }
    }

    onCancel() {
        this.dialogRef.close(false);
    }
}
