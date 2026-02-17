import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService, Profile, EmployeeInvitation } from '../../supabase.service';
import { InviteDialogComponent } from './invite-dialog.component';
// @ts-ignore
import AOS from 'aos';

@Component({
    selector: 'app-employees',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule
    ],
    templateUrl: './employees.component.html',
    styleUrl: './employees.component.css'
})
export class EmployeesComponent implements OnInit {
    employees: Profile[] = [];
    invitations: EmployeeInvitation[] = [];
    loading = true;
    loadingInvites = false;

    displayedEmployeeColumns: string[] = ['avatar', 'username', 'email', 'joined', 'status', 'actions'];
    displayedInviteColumns: string[] = ['email', 'sent', 'expires', 'actions'];

    constructor(
        private supabase: SupabaseService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        private zone: NgZone
    ) { }

    ngOnInit(): void {
        AOS.init({
            duration: 800,
            once: true,
            mirror: false
        });
        console.log('EmployeesComponent: Initializing...');
        this.loadData();
    }

    async loadData() {
        this.loading = true;
        try {
            const [{ data: employees }, { data: invitations }] = await Promise.all([
                this.supabase.getEmployees(),
                this.supabase.getInvitations()
            ]);

            this.employees = employees || [];
            this.invitations = invitations || [];
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error loading employee data:', error);
            this.snackBar.open('Error loading employee data', 'Close', { duration: 3000 });
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    openInviteDialog() {
        const dialogRef = this.dialog.open(InviteDialogComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadData();
            }
        });
    }

    async cancelInvitation(id: string) {
        if (confirm('Are you sure you want to cancel this invitation?')) {
            try {
                const { error } = await this.supabase.deleteInvitation(id);
                if (error) throw error;
                this.snackBar.open('Invitation cancelled', 'Close', { duration: 3000 });
                this.loadData();
            } catch (error: any) {
                this.snackBar.open(error.message || 'Error cancelling invitation', 'Close', { duration: 3000 });
            }
        }
    }

    copyInviteLink(token: string) {
        const link = `${window.location.origin}/signup?token=${token}`;
        navigator.clipboard.writeText(link).then(() => {
            this.snackBar.open('Invite link copied to clipboard!', 'Close', { duration: 3000 });
        });
    }

    getStatusColor(isActive: boolean): string {
        return isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    }
}
