import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService, Profile } from '../supabase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatIconModule, ImageCropperComponent, MatProgressSpinnerModule],
    templateUrl: './profile.html',
    styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
    profileForm: FormGroup;
    loading = false;
    avatarUrl: string | null = null;
    session: Promise<any>;
    profiles: Profile[] = [];
    currentUser$;
    currentProfile$;

    imageChangedEvent: any = '';
    croppedImage: Blob | null = null;
    showCropper = false;

    constructor(
        private readonly supabase: SupabaseService,
        private readonly formBuilder: FormBuilder,
        private readonly snackBar: MatSnackBar,
        public readonly router: Router,
        private readonly cdr: ChangeDetectorRef
    ) {
        this.currentUser$ = this.supabase.currentUser;
        this.currentProfile$ = this.supabase.currentProfile;
        this.session = this.supabase.session;
        this.profileForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            website: [''],
            avatar_url: ['']
        });
    }

    async ngOnInit(): Promise<void> {
        const session = await this.session;
        if (session) {
            this.getProfile(session);
        } else {
            this.router.navigate(['/login']);
        }

        // Subscribe to all profiles
        this.supabase.allProfiles.subscribe(profiles => {
            this.profiles = profiles;
        });
    }

    async getProfile(session: any) {
        this.supabase.currentProfile.subscribe(profile => {
            if (profile) {
                this.profileForm.patchValue({
                    username: profile.username,
                    website: profile.website,
                    avatar_url: profile.avatar_url,
                });
                if (profile.avatar_url) {
                    this.downloadImage(profile.avatar_url);
                }
            }
        });
    }

    async createNewProfile() {
        try {
            this.loading = true;
            const newProfile: Profile = {
                username: `User ${Math.floor(Math.random() * 1000)}`,
                website: '',
                avatar_url: '',
                role: 'employee'
            };
            this.showMessage("To add multiple profiles, database schema update is required. (1:N User:Profiles)");
        } catch (e: any) {
            this.showMessage(e.message);
        } finally {
            this.loading = false;
        }
    }

    switchProfile(profile: Profile) {
        this.supabase.switchProfile(profile);
        this.profileForm.patchValue(profile);
        if (profile.avatar_url) this.downloadImage(profile.avatar_url);
        else this.avatarUrl = null;
        this.showMessage(`Switched to ${profile.username}`);
    }

    async updateProfile(): Promise<void> {
        try {
            this.loading = true;
            const { username, website, avatar_url } = this.profileForm.value;

            console.log('Saving profile with values:', { username, website, avatar_url });

            const { error } = await this.supabase.updateProfile({
                username,
                website,
                avatar_url,
                role: 'employee'
            });

            if (error) {
                console.error('Profile save error:', error);
                throw error;
            }

            console.log('Profile saved successfully');
            this.showMessage('Profile updated successfully!');
        } catch (error) {
            if (error instanceof Error) {
                this.showMessage(error.message);
            }
        } finally {
            this.loading = false;
        }
    }

    // Triggered when file input changes
    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
        this.showCropper = true;
    }

    imageCropped(event: ImageCroppedEvent) {
        this.croppedImage = event.blob || null;
    }

    imageLoaded(image: LoadedImage) {
        // show cropper
    }

    cropperReady() {
        // cropper ready
    }

    loadImageFailed() {
        this.showMessage('Failed to load image');
    }

    cancelCrop() {
        this.showCropper = false;
        this.imageChangedEvent = '';
        this.croppedImage = null;
    }

    async saveCroppedImage() {
        if (!this.croppedImage) return;

        try {
            this.loading = true;
            const fileExt = 'png';
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const fileToUpload = new File([this.croppedImage], fileName, { type: 'image/png' });

            const { error } = await this.supabase.uploadAvatar(filePath, fileToUpload);

            if (error) throw error;

            // Update form
            this.profileForm.patchValue({ avatar_url: filePath });
            this.profileForm.markAsDirty();

            // Close modal IMMEDIATELY
            this.showCropper = false;
            this.imageChangedEvent = '';
            this.croppedImage = null;
            this.loading = false;

            // Show success message
            this.showMessage('Avatar updated!');

            // Download and update in background
            await this.downloadImage(filePath);
            this.cdr.detectChanges();

            // Auto-save profile
            await this.updateProfile();

        } catch (error) {
            this.showCropper = false;
            this.imageChangedEvent = '';
            this.croppedImage = null;
            this.loading = false;

            if (error instanceof Error) {
                this.showMessage(error.message);
            }
        }
    }

    // Legacy direct upload (kept but replaced by crop flow in UI)
    async uploadAvatar(event: any) {
        this.fileChangeEvent(event);
    }

    async downloadImage(path: string) {
        try {
            const { data } = await this.supabase.downLoadImage(path);
            if (data instanceof Blob) {
                this.avatarUrl = URL.createObjectURL(data);
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error downloading image: ', error.message);
            }
        }
    }

    async signOut() {
        await this.supabase.signOut();
        this.router.navigate(['/login']);
    }

    showMessage(message: string) {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
        });
    }
}
