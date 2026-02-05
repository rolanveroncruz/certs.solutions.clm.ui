import { Component } from '@angular/core';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton, MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-login-component',
  imports: [
    MatCard,
    MatCardHeader,
    MatIcon,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatCheckbox,
    MatButton,
    MatCardActions,
    MatInput,
    MatIconButton
  ],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
})
export class LoginComponent {
  readonly currentYear = new Date().getFullYear();

}
