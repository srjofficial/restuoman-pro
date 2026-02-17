import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SupabaseService, Profile } from '../supabase.service';

@Component({
    selector: 'app-employer',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, RouterOutlet],
    templateUrl: './employer.html',
    styleUrl: './employer.css'
})
export class EmployerComponent implements OnInit {
    profile: Profile | null = null;

    constructor(
        private supabase: SupabaseService,
        private router: Router
    ) { }

    async ngOnInit() {
        this.supabase.currentProfile.subscribe((profile: Profile | null) => {
            this.profile = profile;
        });
    }

    signOut() {
        this.supabase.signOut();
        this.router.navigate(['/login']);
    }
}
