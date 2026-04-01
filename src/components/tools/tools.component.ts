import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PrinterService } from '../../services/printer/printer.service';
import { SocketService } from '../../services/socket/socket.service';
import { PrinterState } from '../../model';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
  standalone: false,
})
export class ToolsComponent {
  mode: string | null = null;

  zOffsetActual = -2.50;
  zOffsetEdited = -2.50;
  lastAction: string = '';

  selectedStep = 0.05;
  stepOptions = [0.001, 0.01, 0.05];
  isPrinting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private printerService: PrinterService,
    private socketService: SocketService, 
  ) {}

  ngOnInit() {
    console.log('ToolsComponent ngOnInit running');

    this.route.paramMap.subscribe(params => {
      this.mode = params.get('mode');
    });

    this.socketService.getPrinterStatusText().subscribe(text => {
      console.log('printer text:', text);

      const match = text.match(/Probe Offset.*Z(-?\d+(\.\d+)?)/i);
      if (match) {
        const value = parseFloat(match[1]);
        this.zOffsetActual = value;
        this.zOffsetEdited = value;
      }
    });

    this.socketService.getPrinterStatusSubscribable().subscribe(status => {
      this.isPrinting = status.status === PrinterState.printing;
    });

    this.printerService.executeGCode('M851');
  }

  goToMainScreen() {
    if (this.mode) {
      this.router.navigate(['/tools']);
    } else {
      this.router.navigate(['/main-screen']);
    }
  }

  adjustOffset(increase: boolean) {
  const delta = increase ? this.selectedStep : -this.selectedStep;
  this.zOffsetEdited = Math.round((this.zOffsetEdited + delta) * 1000) / 1000;
  }

  homePrinter() {
    this.printerService.executeGCode('G28');
  }

  goToZ0() {
    this.printerService.executeGCode('G90');
    this.printerService.executeGCode('G1 Z0');
  }

  saveOffset() {
    this.printerService.executeGCode(`M851 Z${this.zOffsetEdited.toFixed(2)}`);
    setTimeout(() => {
      this.printerService.executeGCode('M500');
    }, 1000);

    this.zOffsetActual = this.zOffsetEdited;
  }

  resetEditedOffset() {
    this.zOffsetEdited = this.zOffsetActual;
  }

  setStep(step: number) {
  this.selectedStep = step;
  }

  canSave(): boolean {
    return this.zOffsetEdited !== this.zOffsetActual;
  }

  moveToBedPoint(x: number, y: number) {
    this.printerService.executeGCode('G90');
    this.printerService.executeGCode(`G1 X${x} Y${y} F6000`);
  }

  moveBedZUp() {
    this.printerService.executeGCode('G90');
    this.printerService.executeGCode('G1 Z10 F6000');
  }

  moveBedZDown() {
    this.printerService.executeGCode('G90');
    this.printerService.executeGCode('G1 Z0 F6000');
  }

  goToHomeCorner() {
    this.printerService.executeGCode('G90');
    this.printerService.executeGCode('G1 Z10 F3000');
    this.printerService.executeGCode('G1 X0 Y0 F6000');
  }

  presentBed() {
    this.printerService.executeGCode('G90');
    this.printerService.executeGCode('G1 Z10 F3000');
    this.printerService.executeGCode('G1 X0 Y210 F6000');
  }
  
}