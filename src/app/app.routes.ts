import { Routes } from '@angular/router';
import {LoginComponent} from './login-component/login-component';
import {MainComponent} from './pages/main-component/main-component';
import {DashboardComponent} from './pages/dashboard-component/dashboard-component';
import {DiscoveriesComponent} from './pages/discoveries-component/discoveries-component';
import {AgentsComponent} from './pages/agents-component/agents-component';
import { ChangePassword} from './components/change-password/change-password';

export const routes: Routes = [
  { path: '',  pathMatch: 'full', component:LoginComponent},
  { path: 'login', pathMatch: 'full', component:LoginComponent },
    { path: 'rq/:req_uuid/cpw', component: ChangePassword},
  { path: 'main', component:MainComponent,
  children: [
    {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'discoveries', component: DiscoveriesComponent},
    {path: 'agents', component: AgentsComponent}
    ]
  },
];
