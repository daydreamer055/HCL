import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './core/layout/app-shell.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { ProductsPageComponent } from './pages/products/products-page.component';
import { InventoryPageComponent } from './pages/inventory/inventory-page.component';
import { SuppliersPageComponent } from './pages/suppliers/suppliers-page.component';
import { LocationsPageComponent } from './pages/locations/locations-page.component';
import { PurchaseOrdersPageComponent } from './pages/purchase-orders/purchase-orders-page.component';
import { SalesOrdersPageComponent } from './pages/sales-orders/sales-orders-page.component';
import { BarcodeRfidPageComponent } from './pages/barcode-rfid/barcode-rfid-page.component';
import { ReportsPageComponent } from './pages/reports/reports-page.component';
import { UsersPageComponent } from './pages/users/users-page.component';
import { SettingsPageComponent } from './pages/settings/settings-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'products', component: ProductsPageComponent },
      { path: 'inventory', component: InventoryPageComponent },
      { path: 'suppliers', component: SuppliersPageComponent },
      { path: 'locations', component: LocationsPageComponent },
      { path: 'purchase-orders', component: PurchaseOrdersPageComponent },
      { path: 'sales-orders', component: SalesOrdersPageComponent },
      { path: 'barcode-rfid', component: BarcodeRfidPageComponent },
      { path: 'reports', component: ReportsPageComponent },
      { path: 'users', component: UsersPageComponent, canActivate: [adminGuard] },
      { path: 'settings', component: SettingsPageComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
