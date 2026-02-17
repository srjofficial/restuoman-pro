import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../environments/environment';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import emailjs from '@emailjs/browser';

export interface Profile {
    id?: string;
    username: string;
    website: string;
    avatar_url: string;
    role: 'admin' | 'employer' | 'employee';
    employer_id?: string;
    restaurant_name?: string;
    is_active?: boolean;
    phone?: string;
    address?: string;
    created_at?: string;
    updated_at?: string;
}

export interface MenuCategory {
    id?: string;
    employer_id: string;
    name: string;
    description?: string;
    display_order?: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface MenuItem {
    id?: string;
    category_id: string;
    name: string;
    description?: string;
    price: number;
    is_available?: boolean;
    image_url?: string;
    ingredients?: string;
    quantity?: number;
    unit?: string;
    created_at?: string;
    updated_at?: string;
}

export interface RestaurantTable {
    id?: string;
    employer_id: string;
    table_number: number;
    capacity?: number;
    assigned_employee_id?: string;
    status?: 'available' | 'occupied' | 'reserved';
    created_at?: string;
    updated_at?: string;
    // Joined data
    assigned_employee?: Profile;
}

export interface Bill {
    id?: string;
    table_id: string;
    employee_id: string;
    employer_id: string;
    total_amount?: number;
    tax_amount?: number;
    grand_total?: number;
    status?: 'open' | 'paid' | 'cancelled';
    notes?: string;
    created_at?: string;
    paid_at?: string;
}

export interface BillItem {
    id?: string;
    bill_id: string;
    menu_item_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    created_at?: string;
}

export interface Message {
    id?: string;
    sender_id: string;
    receiver_id: string;
    subject?: string;
    message: string;
    is_read?: boolean;
    created_at?: string;
}

export interface EmployeeInvitation {
    id?: string;
    employer_id: string;
    email: string;
    token: string;
    expires_at: string;
    used?: boolean;
    created_at?: string;
}

@Injectable({
    providedIn: 'root',
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private _currentUser = new BehaviorSubject<User | null>(null);
    private _currentProfile = new BehaviorSubject<Profile | null>(null);
    private _allProfiles = new BehaviorSubject<Profile[]>([]);
    private _initialized = new BehaviorSubject<boolean>(false);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        // Initialize user session
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            this.handleAuthChange(session);
        });

        // Listen for auth changes
        this.supabase.auth.onAuthStateChange((_, session) => {
            this.handleAuthChange(session);
        });
    }

    private async handleAuthChange(session: any) {
        const user = session?.user ?? null;
        this._currentUser.next(user);
        if (user) {
            await this.refreshProfiles(user.id);
        } else {
            this._currentProfile.next(null);
            this._allProfiles.next([]);
        }
        this._initialized.next(true);
    }

    get initialized() {
        return this._initialized.asObservable();
    }

    get currentUser() {
        return this._currentUser.asObservable();
    }

    get currentProfile() {
        return this._currentProfile.asObservable();
    }

    get allProfiles() {
        return this._allProfiles.asObservable();
    }

    get session() {
        return this.supabase.auth.getSession().then(({ data: { session } }) => session);
    }


    async refreshProfiles(userId: string) {
        console.log('Refreshing profiles for user:', userId);
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId); // For now, assuming 1:1, but structure allows 1:N if DB changes

        console.log('Profile query result:', { data, error });

        // In a real 1:N scenario, we would select by user_id FK, not ID PK.
        // Assuming current schema has 'id' as PK which matches auth.uid.
        // To support Multiple Profiles, we actually need a schema change or a different table logic.
        // For this task, we will simulate "switching" by potentially having multiple rows if the DB allowed it,
        // or just stick to the single profile for now but structure the service to support lists.

        // CORRECTION: The user explicitly asked for "accounts created with the same email".
        // In Supabase Auth, 1 Email = 1 User.
        // To have "multiple accounts", we need a table 'profiles' where 'user_id' = auth.uid().
        // If the current 'profiles' table uses 'id' as PK referencing auth.uid(), it only supports 1 profile.
        // I will assume for now we might only find 1, but I'll return it as a list.

        if (data && data.length > 0) {
            this._allProfiles.next(data);
            this._currentProfile.next(data[0]);
            console.log('Profile successfully loaded:', data[0]);
        } else {
            console.log('No profile found or error fetching profile:', error);
            this._allProfiles.next([]);
            this._currentProfile.next(null);
        }
    }

    authChanges(callback: (event: any, session: any) => void) {
        return this.supabase.auth.onAuthStateChange(callback);
    }

    signIn(email: string) {
        return this.supabase.auth.signInWithOtp({ email });
    }

    signInWithPassword(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({ email, password });
    }

    signUp(email: string, password: string) {
        return this.supabase.auth.signUp({ email, password });
    }

    signOut() {
        return this.supabase.auth.signOut();
    }

    async updateProfile(profile: Profile) {
        const user = this._currentUser.value;
        const update = {
            ...profile,
            id: user?.id, // This forces 1:1 if ID must match UID
            updated_at: new Date(),
        };

        console.log('SupabaseService: Updating profile with data:', update);

        const result = await this.supabase.from('profiles').upsert(update);

        console.log('SupabaseService: Upsert result:', result);

        // Refresh the current profile after update
        if (!result.error && user?.id) {
            const { data } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            console.log('SupabaseService: Fetched updated profile:', data);

            if (data) {
                this._currentProfile.next(data);
            }
        }

        return result;
    }

    switchProfile(profile: Profile) {
        this._currentProfile.next(profile);
    }

    // Placeholder for creating a NEW profile under same user if DB supports it
    async createSecondaryProfile(profile: Profile) {
        // This would require the DB 'profiles' table to have a PK different from user_id,
        // and a user_id FK column.
        // For now, I'll essentially re-use upsert but in a real app this needs schema migration.
        return this.updateProfile(profile);
    }

    // Employer Management Methods
    async getEmployers() {
        await this.session;
        console.log('SupabaseService: getEmployers calling with session');
        return this.supabase
            .from('profiles')
            .select('*')
            .eq('role', 'employer')
            .order('created_at', { ascending: false });
    }

    async createEmployer(employerData: {
        email: string;
        password: string;
        restaurant_name: string;
        phone: string;
        address?: string;
    }) {
        try {
            console.log('Creating employer:', employerData.email);
            // Step 1: Create auth user
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: employerData.email,
                password: employerData.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Failed to create user');

            // Step 2: Create profile immediately
            const { data: profileData, error: profileError } = await this.supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    username: employerData.email.split('@')[0],
                    role: 'employer',
                    restaurant_name: employerData.restaurant_name,
                    phone: employerData.phone,
                    address: employerData.address || '',
                    website: '',
                    avatar_url: '',
                    is_active: true
                })
                .select()
                .single();

            if (profileError) {
                console.error('Profile creation failed:', profileError);
                throw profileError;
            }

            console.log('Employer profile created successfully:', profileData);
            return { data: profileData, error: null };
        } catch (error) {
            console.error('Error in createEmployer:', error);
            return { data: null, error };
        }
    }

    async updateEmployer(id: string, employerData: Partial<Profile>) {
        return this.supabase
            .from('profiles')
            .update(employerData)
            .eq('id', id);
    }

    async deleteEmployer(id: string) {
        return this.supabase
            .from('profiles')
            .delete()
            .eq('id', id);
    }

    async toggleEmployerStatus(id: string, isActive: boolean) {
        return this.supabase
            .from('profiles')
            .update({ is_active: isActive })
            .eq('id', id);
    }

    // Employee Management Methods
    async getEmployees() {
        await this.session;
        const currentUser = await this.getCurrentUser();
        console.log('SupabaseService: getEmployees for', currentUser?.id);
        return this.supabase
            .from('profiles')
            .select('*')
            .eq('employer_id', currentUser?.id)
            .eq('role', 'employee')
            .order('created_at', { ascending: false });
    }

    // Invitation Management Methods
    async getInvitations() {
        await this.session;
        const currentUser = await this.getCurrentUser();
        return this.supabase
            .from('employee_invitations')
            .select('*')
            .eq('employer_id', currentUser?.id)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });
    }

    async createInvitation(email: string) {
        await this.session;
        const currentUser = await this.getCurrentUser();
        const currentProfile = this._currentProfile.getValue();

        // Generate a random token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        // Create invitation in database
        const result = await this.supabase
            .from('employee_invitations')
            .insert({
                employer_id: currentUser?.id,
                email,
                token,
                expires_at: expiresAt.toISOString(),
                used: false
            })
            .select()
            .single();

        // If invitation created successfully, send email
        if (!result.error) {
            try {
                const inviteLink = `${window.location.origin}/signup?token=${token}`;

                await emailjs.send(
                    environment.emailjs.serviceId,
                    environment.emailjs.templateId,
                    {
                        name: currentProfile?.restaurant_name || 'Restaurant',
                        email: email,
                        invite_link: inviteLink,
                        restaurant_name: currentProfile?.restaurant_name || 'Restaurant',
                        expires_date: expiresAt.toLocaleDateString()
                    },
                    environment.emailjs.publicKey
                );

                console.log('✅ Invitation email sent to:', email);
            } catch (emailError) {
                console.error('❌ Failed to send email:', emailError);
                // Don't fail the whole operation if email fails
                // Invitation still created, can copy link manually
            }
        }

        return result;
    }

    async deleteInvitation(id: string) {
        await this.session;
        return this.supabase
            .from('employee_invitations')
            .delete()
            .eq('id', id);
    }

    async getInvitationByToken(token: string) {
        return this.supabase
            .from('employee_invitations')
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .single();
    }

    async markInvitationUsed(token: string) {
        return this.supabase
            .from('employee_invitations')
            .update({ used: true })
            .eq('token', token);
    }

    // Table Management Methods
    async getTables() {
        await this.session;
        const currentUser = await this.getCurrentUser();
        return this.supabase
            .from('restaurant_tables')
            .select('*, assigned_employee:profiles!restaurant_tables_assigned_employee_id_fkey(*)')
            .eq('employer_id', currentUser?.id)
            .order('table_number', { ascending: true });
    }

    async createTable(table: Partial<RestaurantTable>) {
        await this.session;
        const currentUser = await this.getCurrentUser();
        return this.supabase
            .from('restaurant_tables')
            .insert({
                ...table,
                employer_id: currentUser?.id,
                status: table.status || 'available'
            })
            .select()
            .single();
    }

    async updateTable(id: string, updates: Partial<RestaurantTable>) {
        await this.session;
        return this.supabase
            .from('restaurant_tables')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
    }

    async deleteTable(id: string) {
        await this.session;
        return this.supabase
            .from('restaurant_tables')
            .delete()
            .eq('id', id);
    }

    // Menu Management Methods
    async getMenuItems() {
        const currentUser = await this.getCurrentUser();
        return this.supabase
            .from('menu_items')
            .select(`
                *,
                category:menu_categories(*)
            `)
            .eq('category.employer_id', currentUser?.id);
    }

    // Bills Management Methods
    async getPendingBills() {
        const currentUser = await this.getCurrentUser();
        return this.supabase
            .from('bills')
            .select('*')
            .eq('employer_id', currentUser?.id)
            .eq('status', 'open')
            .order('created_at', { ascending: false });
    }

    private async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    // Menu Categories Methods
    async getMenuCategories() {
        const currentUser = await this.getCurrentUser();
        return this.supabase
            .from('menu_categories')
            .select('*')
            .eq('employer_id', currentUser?.id)
            .order('display_order', { ascending: true });
    }

    async createMenuCategory(categoryData: { name: string; description?: string }) {
        const currentUser = await this.getCurrentUser();
        return this.supabase
            .from('menu_categories')
            .insert({
                ...categoryData,
                employer_id: currentUser?.id,
                display_order: 0
            })
            .select()
            .single();
    }

    async updateMenuCategory(id: string, categoryData: Partial<{ name: string; description: string }>) {
        return this.supabase
            .from('menu_categories')
            .update(categoryData)
            .eq('id', id)
            .select()
            .single();
    }

    async deleteMenuCategory(id: string) {
        return this.supabase
            .from('menu_categories')
            .delete()
            .eq('id', id);
    }

    // Menu Items Methods
    async getMenuItemsByCategory(categoryId: string) {
        return this.supabase
            .from('menu_items')
            .select('*')
            .eq('category_id', categoryId)
            .order('name', { ascending: true });
    }

    async createMenuItem(itemData: Partial<MenuItem>) {
        return this.supabase
            .from('menu_items')
            .insert({
                ...itemData,
                is_available: itemData.is_available !== undefined ? itemData.is_available : true
            })
            .select()
            .single();
    }

    async updateMenuItem(id: string, itemData: Partial<MenuItem>) {
        return this.supabase
            .from('menu_items')
            .update({
                ...itemData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
    }

    async deleteMenuItem(id: string) {
        return this.supabase
            .from('menu_items')
            .delete()
            .eq('id', id);
    }

    uploadAvatar(filePath: string, file: File) {
        return this.supabase.storage.from('avatars').upload(filePath, file);
    }

    downLoadImage(path: string) {
        return this.supabase.storage.from('avatars').download(path);
    }
}
