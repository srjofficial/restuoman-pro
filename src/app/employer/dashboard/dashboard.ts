import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SupabaseService } from '../../supabase.service';
import { filter, take } from 'rxjs/operators';

// @ts-ignore
import AOS from 'aos';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
    stats = {
        totalEmployees: 0,
        activeTables: 0,
        menuItems: 0,
        pendingBills: 0
    };
    loading = true;

    constructor(
        private supabase: SupabaseService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private zone: NgZone
    ) { }

    async ngOnInit() {
        AOS.init({
            duration: 800,
            once: true,
            mirror: false
        });

        // Wait for Supabase to be initialized before loading data
        this.supabase.initialized.pipe(
            filter(init => init === true),
            take(1)
        ).subscribe(async () => {
            await this.loadStats();
            this.cdr.detectChanges();
        });
    }

    async loadStats() {
        this.loading = true;
        console.log('DashboardComponent: loadStats started');

        try {
            console.log('DashboardComponent: fetching data...');
            const [{ data: employees }, { data: tables }, { data: items }, { data: bills }] = await Promise.all([
                this.supabase.getEmployees(),
                this.supabase.getTables(),
                this.supabase.getMenuItems(),
                this.supabase.getPendingBills()
            ]);

            this.stats.totalEmployees = employees?.length || 0;
            this.stats.activeTables = tables?.filter(t => t.status === 'occupied').length || 0;
            this.stats.menuItems = items?.length || 0;
            this.stats.pendingBills = bills?.length || 0;

            console.log('DashboardComponent: Stats loaded successfully:', this.stats);
            this.cdr.detectChanges();
        } catch (error) {
            console.error('DashboardComponent: Error loading stats:', error);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    navigateTo(route: string) {
        this.router.navigate([`/employer/${route}`]);
    }
}
