import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, Profile } from '../supabase.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, take } from 'rxjs/operators';

// @ts-ignore
import AOS from 'aos';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        ReactiveFormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatTooltipModule
    ],
    templateUrl: './admin.html',
    styleUrl: './admin.css'
})
export class AdminComponent implements OnInit {
    employers: Profile[] = [];
    loadingList = false;
    submitting = false;
    showAddForm = false;
    employerForm!: FormGroup;
    deletingId: string | null = null;
    togglingId: string | null = null;

    constructor(
        private supabase: SupabaseService,
        private router: Router,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef,
        private zone: NgZone
    ) {
        this.initForm();
    }

    async ngOnInit() {
        AOS.init({
            duration: 800,
            once: true,
            mirror: false
        });
        console.log('Admin component initialized');

        // Wait for Supabase to be initialized before loading data
        this.supabase.initialized.pipe(
            filter(init => init === true),
            take(1)
        ).subscribe(async () => {
            await this.loadEmployers();
            this.cdr.detectChanges();
        });
    }

    get activeEmployersCount(): number {
        return this.employers.filter(e => e.is_active).length;
    }

    async loadEmployers() {
        if (this.loadingList) {
            console.log('AdminComponent: loadEmployers already in progress, skipping');
            return;
        }

        this.loadingList = true;
        console.log('AdminComponent: loadEmployers started');

        try {
            console.log('AdminComponent: calling supabase.getEmployers()...');
            const { data, error } = await this.supabase.getEmployers();

            if (error) {
                console.error('AdminComponent: Error in loadEmployers:', error);
                throw error;
            }

            this.employers = data || [];
            console.log('AdminComponent: Successfully loaded', this.employers.length, 'employers');
            this.cdr.detectChanges();
        } catch (error) {
            console.error('AdminComponent: Exception in loadEmployers:', error);
        } finally {
            this.loadingList = false;
            this.cdr.detectChanges();
        }
    }

    async deleteEmployer(id: string) {
        if (!confirm('Are you sure you want to deactivate this employer? This will prevent them from logging in.')) return;

        this.deletingId = id;
        try {
            // Soft delete: mark as inactive instead of deleting
            // This is because we can't delete auth users from client side
            const { error } = await this.supabase.updateEmployer(id, { is_active: false });
            if (error) throw error;

            await this.loadEmployers();
            alert('Employer deactivated successfully');
        } catch (error) {
            console.error('Error deactivating employer:', error);
            alert('Failed to deactivate employer');
        } finally {
            this.deletingId = null;
        }
    }

    async toggleStatus(employer: Profile) {
        this.togglingId = employer.id!;
        try {
            const { error } = await this.supabase.toggleEmployerStatus(
                employer.id!,
                !employer.is_active
            );
            if (error) throw error;

            await this.loadEmployers();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Failed to update status');
        } finally {
            this.togglingId = null;
        }
    }

    initForm() {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        this.employerForm = this.fb.group({
            email: ['', [Validators.required, Validators.pattern(emailPattern)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            restaurantName: ['', Validators.required],
            phone: ['', Validators.required],
            address: ['']
        });
    }

    toggleAddForm() {
        this.showAddForm = !this.showAddForm;
        if (!this.showAddForm) {
            this.employerForm.reset();
        }
    }

    async addEmployer() {
        if (this.employerForm.invalid) {
            Object.keys(this.employerForm.controls).forEach(key => {
                this.employerForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.submitting = true;
        try {
            const formValue = this.employerForm.value;

            const { data, error } = await this.supabase.createEmployer({
                email: formValue.email,
                password: formValue.password,
                restaurant_name: formValue.restaurantName,
                phone: formValue.phone,
                address: formValue.address
            });

            if (error) throw error;

            alert('Employer created successfully!');
            this.toggleAddForm();
            await this.loadEmployers();
        } catch (error: any) {
            console.error('Error creating employer:', error);

            // Check for rate limit error
            if (error.message && error.message.includes('rate limit')) {
                alert('⚠️ Email rate limit exceeded!\n\nPlease wait a moment before creating another employer, or increase the rate limit in your Supabase Dashboard:\n\nAuthentication → Rate Limits → Increase signup limit');
            } else if (error.message && error.message.includes('already registered')) {
                alert('This email is already registered. Please use a different email address.');
            } else {
                alert(error.message || 'Failed to create employer');
            }
        } finally {
            this.submitting = false;
        }
    }

    signOut() {
        this.supabase.signOut();
        this.router.navigate(['/login']);
    }
}
