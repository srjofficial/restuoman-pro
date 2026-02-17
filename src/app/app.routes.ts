import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { LoginComponent } from './login/login';
import { NotFoundComponent } from './not-found/not-found';
import { ProfileComponent } from './profile/profile';
import { SignupComponent } from './signup/signup';
import { AdminComponent } from './admin/admin';
import { EmployerComponent } from './employer/employer';
import { DashboardComponent } from './employer/dashboard/dashboard';
import { MenuManagementComponent } from './employer/menu-management/menu-management';
import { EmployeesComponent } from './employer/employees/employees.component';
import { TablesComponent } from './employer/tables/tables.component';
import { roleGuard } from './guards/role.guard';
import { homeGuard } from './guards/home.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent, canActivate: [homeGuard] },
    { path: 'login', component: LoginComponent, data: { hideNavbar: true } },
    { path: 'signup', component: SignupComponent, data: { hideNavbar: true } },
    { path: 'profile', component: ProfileComponent },
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [roleGuard],
        data: { role: 'admin' }
    },
    {
        path: 'employer',
        component: EmployerComponent,
        canActivate: [roleGuard],
        data: { role: 'employer' },
        children: [
            { path: '', component: DashboardComponent },
            { path: 'menu', component: MenuManagementComponent },
            { path: 'employees', component: EmployeesComponent },
            { path: 'tables', component: TablesComponent }
        ]
    },
    { path: '**', component: NotFoundComponent, data: { hideNavbar: true } }
];
