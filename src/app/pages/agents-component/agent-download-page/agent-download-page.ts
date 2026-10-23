import { Component } from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-agent-download-page',
    imports: [
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        RouterLink
    ],
  templateUrl: './agent-download-page.html',
  styleUrl: './agent-download-page.scss',
})
export class AgentDownloadPage {

}
