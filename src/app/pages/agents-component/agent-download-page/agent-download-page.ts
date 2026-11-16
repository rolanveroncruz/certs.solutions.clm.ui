import { Component, inject } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {DownloadAgentDialog} from './download-agent-dialog/download-agent-dialog';
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
    private readonly dialog = inject(MatDialog);
    private readonly windowsInstallerUrl = 'https://downloads.certs.solutions/downloads/latest-agent-windows-setup.exe';

    openWindowsDownloadDialog(): void {
        this.dialog.open(DownloadAgentDialog, {
            data: {downloadUrl: this.windowsInstallerUrl},
        });
    }
}
