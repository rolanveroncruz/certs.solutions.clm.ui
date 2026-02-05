import { Component } from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {MatButton} from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle
} from '@angular/material/card';
import {MatDivider, MatList, MatListItem} from '@angular/material/list';

@Component({
  selector: 'app-root',
  imports: [MatToolbar, MatIcon, RouterLink, MatChipSet, MatChip, MatButton, MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardActions, MatList, MatListItem, MatDivider, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly currentYear = new Date().getFullYear();
  protected title = 'certs.solutions.clm.ui';
}
