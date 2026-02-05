import { Component } from '@angular/core';
import {MatButton} from "@angular/material/button";
import {
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle
} from "@angular/material/card";
import {MatChip, MatChipSet} from "@angular/material/chips";
import {MatDivider, MatList, MatListItem} from "@angular/material/list";
import {MatIcon} from "@angular/material/icon";
import {MatToolbar} from "@angular/material/toolbar";
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-landing-page-component',
  imports: [
    MatButton,
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatChip,
    MatChipSet,
    MatDivider,
    MatIcon,
    MatList,
    MatListItem,
    MatToolbar,
    RouterLink
  ],
  templateUrl: './landing-page-component.html',
  styleUrl: './landing-page-component.scss',
})
export class LandingPageComponent {
  readonly currentYear = new Date().getFullYear();

}
