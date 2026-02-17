import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService, Profile } from './supabase.service';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { User } from '@supabase/supabase-js';
import { NavbarComponent } from './shared/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('restuoman-pro');
  currentUser!: Observable<User | null>;
  currentProfile!: Observable<Profile | null>;
  showNavbar = true;

  constructor(private supabase: SupabaseService, private router: Router) { }

  ngOnInit() {
    this.currentUser = this.supabase.currentUser;
    this.currentProfile = this.supabase.currentProfile;

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.data['hideNavbar'];
      })
    ).subscribe((hideNavbar) => {
      this.showNavbar = !hideNavbar;
    });
  }

  async signOut() {
    await this.supabase.signOut();
  }
}
