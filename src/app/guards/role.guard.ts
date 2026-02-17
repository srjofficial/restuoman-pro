import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { map, take, timeout, catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    const requiredRole = route.data['role'] as 'admin' | 'employer' | 'employee';

    console.log('Role guard checking for role:', requiredRole);

    return supabase.initialized.pipe(
        filter(initialized => initialized === true),
        take(1),
        timeout(3000), // Give extra time for network
        switchMap(() => supabase.currentProfile.pipe(take(1))),
        map(profile => {
            console.log('Current profile in guard:', profile);

            if (!profile) {
                console.log('No profile found, redirecting to login');
                router.navigate(['/login']);
                return false;
            }

            console.log('Profile role:', profile.role, 'Required role:', requiredRole);

            if (profile.role !== requiredRole) {
                console.log('Role mismatch, redirecting to appropriate area');
                if (profile.role === 'admin') router.navigate(['/admin']);
                else if (profile.role === 'employer') router.navigate(['/employer']);
                else router.navigate(['/profile']);
                return false;
            }

            return true;
        }),
        catchError(error => {
            console.error('Role guard error:', error);
            router.navigate(['/login']);
            return of(false);
        })
    );
};
