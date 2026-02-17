import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService, RestaurantTable, Profile } from '../../supabase.service';
import { TableDialogComponent } from './table-dialog.component';
// @ts-ignore
import AOS from 'aos';

@Component({
    selector: 'app-tables',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule
    ],
    templateUrl: './tables.component.html',
    styleUrl: './tables.component.css'
})
export class TablesComponent implements OnInit {
    tables: RestaurantTable[] = [];
    employees: Profile[] = [];
    loading = true;

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
        this.loadData();
    }

    async loadData() {
        this.loading = true;
        try {
            const [{ data: tables }, { data: employees }] = await Promise.all([
                this.supabase.getTables(),
                this.supabase.getEmployees()
            ]);

            this.tables = tables || [];
            this.employees = employees || [];
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error loading table data:', error);
            this.snackBar.open('Error loading data', 'Close', { duration: 3000 });
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    openTableDialog(table?: RestaurantTable) {
        const dialogRef = this.dialog.open(TableDialogComponent, {
            width: '450px',
            data: {
                table: table,
                employees: this.employees
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadData();
            }
        });
    }

    async updateTableStatus(table: RestaurantTable, status: 'available' | 'occupied' | 'reserved') {
        try {
            const { error } = await this.supabase.updateTable(table.id!, { status });
            if (error) throw error;
            this.snackBar.open(`Table ${table.table_number} is now ${status}`, 'Close', { duration: 2000 });
            this.loadData();
        } catch (error: any) {
            this.snackBar.open(error.message || 'Error updating status', 'Close', { duration: 3000 });
        }
    }

    async deleteTable(table: RestaurantTable) {
        if (confirm(`Are you sure you want to delete Table ${table.table_number}?`)) {
            try {
                const { error } = await this.supabase.deleteTable(table.id!);
                if (error) throw error;
                this.snackBar.open('Table deleted', 'Close', { duration: 3000 });
                this.loadData();
            } catch (error: any) {
                this.snackBar.open(error.message || 'Error deleting table', 'Close', { duration: 3000 });
            }
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800 border-green-200';
            case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
            case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }
}
