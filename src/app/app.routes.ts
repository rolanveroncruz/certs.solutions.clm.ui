import { Routes } from '@angular/router';
import {App} from './app';
import {LoginComponent} from './login-component/login-component';
import {LandingPageComponent} from './landing-page-component/landing-page-component';

export const routes: Routes = [
  { path: '',  pathMatch: 'full', component:LandingPageComponent},
  { path: 'login', pathMatch: 'full', component:LoginComponent },


];
