import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PrinterService } from '../../services/printer/printer.service';
import { OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket/socket.service';

@Component({
  selector: 'app-filament-change',
  templateUrl: './filament-change.component.html',
  styleUrls: ['./filament-change.component.scss'],
  standalone: false,
})

export class FilamentChangeComponent implements OnInit, OnDestroy {
  stage: 'heating' | 'retracting' | 'swap' | 'loading' | 'done' = 'heating';

  constructor(
    private router: Router,
    private printerService: PrinterService,
    private socketService: SocketService,
  ) {}

  cancelFilamentChange() {
    this.printerService.executeGCode('M104 S0');
    this.router.navigate(['/main-screen']);
  }

  private subscriptions: Subscription = new Subscription();

    currentNozzleTemp = 0;
    targetNozzleTemp = 220;

  ngOnInit() {
    this.printerService.executeGCode(`M104 S${this.targetNozzleTemp}`);

    this.subscriptions.add(
        this.socketService.getPrinterStatusSubscribable().subscribe(status => {
            if (status?.tools?.[0]?.current !== undefined) {
            this.currentNozzleTemp = status.tools[0].current;

                if (
                    this.stage === 'heating' &&
                    this.currentNozzleTemp >= this.targetNozzleTemp - 2
                ) {
                    this.startRetraction();
                }
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    startRetraction() {
        this.stage = 'retracting';

        this.printerService.executeGCode('G90');
        this.printerService.executeGCode('G1 E-100 F300');

        setTimeout(() => {
            this.stage = 'swap';
        }, 4000);
    }

    startLoading() {
        this.stage = 'loading';

        this.printerService.executeGCode('G90');
        this.printerService.executeGCode('G1 E200 F300');

        setTimeout(() => {
            this.stage = 'done';
        }, 7000);
    }

    finishFilamentChange() {
    this.printerService.executeGCode('M104 S0');
    this.router.navigate(['/main-screen']);
    }
}