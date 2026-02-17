import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { map, take, filter, switchMap } from 'rxjs/operators';

export const homeGuard: CanActivateFn = (route, state) => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    return supabase.initialized.pipe(
        filter(initialized => initialized === true),
        take(1),
        switchMap(() => supabase.currentProfile.pipe(take(1))),
        map(profile => {
            if (profile) {
                if (profile.role === 'admin') {
                    router.navigate(['/admin']);
                    return false;
                } else if (profile.role === 'employer') {
                    router.navigate(['/employer']);
                    return false;
                }
            }
            return true;
        })
    );
};
