import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { SupabaseService } from '../../supabase.service';
import { Router } from '@angular/router';

interface MenuCategory {
    id: string;
    employer_id: string;
    name: string;
    description: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

interface MenuItem {
    id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    is_available: boolean;
    image_url?: string;
    ingredients?: string;
    quantity?: number;
    unit?: string;
    created_at: string;
}

@Component({
    selector: 'app-menu-management',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatInputModule,
        MatFormFieldModule,
        MatTabsModule,
        MatSelectModule
    ],
    templateUrl: './menu-management.html',
    styleUrl: './menu-management.css'
})
export class MenuManagementComponent implements OnInit {
    categories: MenuCategory[] = [];
    menuItems: MenuItem[] = [];
    selectedCategory: MenuCategory | null = null;

    loadingCategories = false;
    loadingItems = false;
    submittingCategory = false;
    submittingItem = false;

    showCategoryForm = false;
    showItemForm = false;
    editingCategory: MenuCategory | null = null;
    editingItem: MenuItem | null = null;

    categoryForm!: FormGroup;
    itemForm!: FormGroup;

    constructor(
        private supabase: SupabaseService,
        private fb: FormBuilder,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        this.initForms();
    }

    async ngOnInit() {
        await this.loadCategories();
    }

    initForms() {
        this.categoryForm = this.fb.group({
            name: ['', Validators.required],
            description: ['']
        });

        this.itemForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            price: ['', [Validators.required, Validators.min(0)]],
            category_id: ['', Validators.required],
            ingredients: [''],
            quantity: [''],
            unit: ['g']
        });
    }

    async loadCategories() {
        this.loadingCategories = true;
        try {
            const { data, error } = await this.supabase.getMenuCategories();
            if (error) throw error;
            this.categories = data || [];

            if (this.categories.length > 0 && !this.selectedCategory) {
                this.selectCategory(this.categories[0]);
            }
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error loading categories:', error);
            alert('Failed to load categories');
        } finally {
            this.loadingCategories = false;
            this.cdr.detectChanges();
        }
    }

    async selectCategory(category: MenuCategory) {
        this.selectedCategory = category;
        await this.loadMenuItems(category.id);
    }

    async loadMenuItems(categoryId: string) {
        this.loadingItems = true;
        try {
            const { data, error } = await this.supabase.getMenuItemsByCategory(categoryId);
            if (error) throw error;
            this.menuItems = data || [];
            this.cdr.detectChanges();
        } catch (error) {
            console.error('Error loading menu items:', error);
            alert('Failed to load menu items');
        } finally {
            this.loadingItems = false;
            this.cdr.detectChanges();
        }
    }

    toggleCategoryForm() {
        this.showCategoryForm = !this.showCategoryForm;
        if (!this.showCategoryForm) {
            this.categoryForm.reset();
            this.editingCategory = null;
        }
    }

    toggleItemForm() {
        this.showItemForm = !this.showItemForm;
        if (!this.showItemForm) {
            this.itemForm.reset();
            this.editingItem = null;
        } else if (this.selectedCategory) {
            this.itemForm.patchValue({ category_id: this.selectedCategory.id });
        }
    }

    editCategory(category: MenuCategory) {
        this.editingCategory = category;
        this.showCategoryForm = true;
        this.categoryForm.patchValue({
            name: category.name,
            description: category.description
        });
    }

    editItem(item: MenuItem) {
        this.editingItem = item;
        this.showItemForm = true;
        this.itemForm.patchValue({
            name: item.name,
            description: item.description,
            price: item.price,
            category_id: item.category_id,
            ingredients: item.ingredients || '',
            quantity: item.quantity || '',
            unit: item.unit || 'g'
        });
    }

    async saveCategory() {
        if (this.categoryForm.invalid) {
            Object.keys(this.categoryForm.controls).forEach(key => {
                this.categoryForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.submittingCategory = true;
        try {
            const formValue = this.categoryForm.value;

            if (this.editingCategory) {
                const { error } = await this.supabase.updateMenuCategory(
                    this.editingCategory.id,
                    formValue
                );
                if (error) throw error;
                alert('Category updated successfully!');
            } else {
                const { error } = await this.supabase.createMenuCategory(formValue);
                if (error) throw error;
                alert('Category created successfully!');
            }

            this.toggleCategoryForm();
            await this.loadCategories();
        } catch (error: any) {
            console.error('Error saving category:', error);
            alert(error.message || 'Failed to save category');
        } finally {
            this.submittingCategory = false;
        }
    }

    async saveItem() {
        if (this.itemForm.invalid) {
            Object.keys(this.itemForm.controls).forEach(key => {
                this.itemForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.submittingItem = true;
        try {
            const formValue = this.itemForm.value;

            if (this.editingItem) {
                const { error } = await this.supabase.updateMenuItem(
                    this.editingItem.id,
                    formValue
                );
                if (error) throw error;
                alert('Menu item updated successfully!');
            } else {
                const { error } = await this.supabase.createMenuItem(formValue);
                if (error) throw error;
                alert('Menu item created successfully!');
            }

            this.toggleItemForm();
            if (this.selectedCategory) {
                await this.loadMenuItems(this.selectedCategory.id);
            }
        } catch (error: any) {
            console.error('Error saving menu item:', error);
            alert(error.message || 'Failed to save menu item');
        } finally {
            this.submittingItem = false;
        }
    }

    async deleteCategory(category: MenuCategory) {
        if (!confirm(`Delete category "${category.name}"? This will also delete all items in this category.`)) {
            return;
        }

        try {
            const { error } = await this.supabase.deleteMenuCategory(category.id);
            if (error) throw error;
            alert('Category deleted successfully!');
            await this.loadCategories();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            alert(error.message || 'Failed to delete category');
        }
    }

    async deleteItem(item: MenuItem) {
        if (!confirm(`Delete menu item "${item.name}"?`)) {
            return;
        }

        try {
            const { error } = await this.supabase.deleteMenuItem(item.id);
            if (error) throw error;
            alert('Menu item deleted successfully!');
            if (this.selectedCategory) {
                await this.loadMenuItems(this.selectedCategory.id);
            }
        } catch (error: any) {
            console.error('Error deleting menu item:', error);
            alert(error.message || 'Failed to delete menu item');
        }
    }

    async toggleItemAvailability(item: MenuItem) {
        try {
            const { error } = await this.supabase.updateMenuItem(item.id, {
                is_available: !item.is_available
            });
            if (error) throw error;
            if (this.selectedCategory) {
                await this.loadMenuItems(this.selectedCategory.id);
            }
        } catch (error: any) {
            console.error('Error toggling availability:', error);
            alert(error.message || 'Failed to update availability');
        }
    }

    goBack() {
        this.router.navigate(['/employer']);
    }
}
