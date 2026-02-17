import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService, Profile } from '../../supabase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  heroSquaresPlusSolid,
  heroUserGroupSolid,
  heroBars4Solid,
  heroSunSolid,
  heroGlobeAmericasSolid,
  heroPhoneSolid,
  heroNewspaperSolid,
  heroRectangleGroupSolid,
  heroTagSolid
} from '@ng-icons/heroicons/solid';
import {
  heroChevronDown,
  heroBars3,
  heroXMark
} from '@ng-icons/heroicons/outline';
import { Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, NgIconComponent],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
  providers: [provideIcons({
    heroSquaresPlusSolid,
    heroUserGroupSolid,
    heroBars4Solid,
    heroSunSolid,
    heroGlobeAmericasSolid,
    heroPhoneSolid,
    heroNewspaperSolid,
    heroRectangleGroupSolid,
    heroTagSolid,
    heroChevronDown,
    heroBars3,
    heroXMark
  })]
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  isMobileMenuOpen = false;

  navListMenuItems = [
    {
      title: "Products",
      description: "Find the perfect solution for your needs.",
      icon: "heroSquaresPlusSolid",
    },
    {
      title: "About Us",
      description: "Meet and learn about our dedication",
      icon: "heroUserGroupSolid",
    },
    {
      title: "Blog",
      description: "Find the perfect solution for your needs.",
      icon: "heroBars4Solid",
    },
    {
      title: "Services",
      description: "Learn how we can help you achieve your goals.",
      icon: "heroSunSolid",
    },
    {
      title: "Support",
      description: "Reach out to us for assistance or inquiries",
      icon: "heroGlobeAmericasSolid",
    },
    {
      title: "Contact",
      description: "Find the perfect solution for your needs.",
      icon: "heroPhoneSolid",
    },
    {
      title: "News",
      description: "Read insightful articles, tips, and expert opinions.",
      icon: "heroNewspaperSolid",
    },
    {
      title: "Products",
      description: "Find the perfect solution for your needs.",
      icon: "heroRectangleGroupSolid",
    },
    {
      title: "Special Offers",
      description: "Explore limited-time deals and bundles",
      icon: "heroTagSolid",
    },
  ];

  currentUser$: Observable<User | null>;
  currentProfile$: Observable<Profile | null>;
  avatarUrl: string | null = null;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {
    this.currentUser$ = this.supabase.currentUser;
    this.currentProfile$ = this.supabase.currentProfile;
  }

  ngOnInit(): void {
    // Subscribe to profile changes to update avatar
    this.supabase.currentProfile.subscribe(profile => {
      this.zone.run(() => {
        if (profile?.avatar_url) {
          this.downloadImage(profile.avatar_url);
        } else {
          this.avatarUrl = null;
        }
        this.cdr.detectChanges();
      });
    });
  }

  async downloadImage(path: string) {
    try {
      const { data } = await this.supabase.downLoadImage(path);
      if (data instanceof Blob) {
        this.zone.run(() => {
          this.avatarUrl = URL.createObjectURL(data);
          this.cdr.detectChanges();
        });
      }
    } catch (error) {
      console.error('Error downloading avatar in navbar:', error);
      this.avatarUrl = null;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.isMobileMenuOpen = false;
  }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
}
