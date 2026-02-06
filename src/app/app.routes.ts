import { Routes } from '@angular/router';
import {App} from './app';
import {LoginComponent} from './login-component/login-component';
import {LandingPageComponent} from './landing-page-component/landing-page-component';
import {MainComponent} from './pages/main-component/main-component';
import {DashboardComponent} from './pages/dashboard-component/dashboard-component';
import {DiscoveriesComponent} from './pages/discoveries-component/discoveries-component';
import {AgentsComponent} from './pages/agents-component/agents-component';

export const routes: Routes = [
  { path: '',  pathMatch: 'full', component:LandingPageComponent},
  { path: 'login', pathMatch: 'full', component:LoginComponent },
  { path: 'main', component:MainComponent,
  children: [
    {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
    {path: 'dashboard', component: DashboardComponent},
    {path: 'discoveries', component: DiscoveriesComponent},
    {path: 'agents', component: AgentsComponent}
    ]
  },
];
