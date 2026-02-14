import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class MaterialIconsModule {
  private path = 'assets/icons';

  constructor(private domSanitizer: DomSanitizer, public matIconRegistry: MatIconRegistry) {
    this.matIconRegistry
      .addSvgIcon('logo', this.setPath(`${this.path}/logo.svg`))
      .addSvgIcon('approved', this.setPath(`${this.path}/approved.svg`))
      .addSvgIcon('arrow-left', this.setPath(`${this.path}/arrow-left.svg`))
      .addSvgIcon('arrow-right', this.setPath(`${this.path}/arrow-right.svg`))
      .addSvgIcon('avatar', this.setPath(`${this.path}/avatar.svg`))
      .addSvgIcon('car-crash', this.setPath(`${this.path}/car-crash.svg`))
      .addSvgIcon('check', this.setPath(`${this.path}/check.svg`))
      .addSvgIcon('diagram', this.setPath(`${this.path}/diagram.svg`))
      .addSvgIcon('document', this.setPath(`${this.path}/document.svg`))
      .addSvgIcon('document-ok', this.setPath(`${this.path}/document-ok.svg`))
      .addSvgIcon('ellipse', this.setPath(`${this.path}/ellipse.svg`))
      .addSvgIcon('envelope', this.setPath(`${this.path}/envelope.svg`))
      .addSvgIcon('person', this.setPath(`${this.path}/person.svg`))
      .addSvgIcon('person-call', this.setPath(`${this.path}/person-call.svg`))
      .addSvgIcon('phone', this.setPath(`${this.path}/phone.svg`))
      .addSvgIcon('reload', this.setPath(`${this.path}/reload.svg`))
      .addSvgIcon('screen-point', this.setPath(`${this.path}/screen-point.svg`))
      .addSvgIcon('screen-search', this.setPath(`${this.path}/screen-search.svg`))
      .addSvgIcon('security', this.setPath(`${this.path}/security.svg`))
      .addSvgIcon('ticket', this.setPath(`${this.path}/ticket.svg`))
      .addSvgIcon('two-documents', this.setPath(`${this.path}/two-documents.svg`))
      .addSvgIcon('facebook', this.setPath(`${this.path}/facebook.svg`))
      .addSvgIcon('instagram', this.setPath(`${this.path}/instagram.svg`))
      .addSvgIcon('dot', this.setPath(`${this.path}/DOT.svg`))
      .addSvgIcon('dqf', this.setPath(`${this.path}/DQF.svg`))
      .addSvgIcon('inspections', this.setPath(`${this.path}/inspections.svg`))
      .addSvgIcon('accidents-claims', this.setPath(`${this.path}/accidents-claims.svg`))
      .addSvgIcon('driver-ticket', this.setPath(`${this.path}/driver-ticket.svg`))
      .addSvgIcon('weekly-safety', this.setPath(`${this.path}/weekly-safety.svg`))
      .addSvgIcon('safety-training', this.setPath(`${this.path}/safety-training.svg`))
      .addSvgIcon('mock-audit', this.setPath(`${this.path}/mock-audit.svg`))
      .addSvgIcon('csa', this.setPath(`${this.path}/CSA.svg`))
      .addSvgIcon('crash-lines', this.setPath(`${this.path}/crash-lines.svg`))
      .addSvgIcon('hos', this.setPath(`${this.path}/hos.svg`))
      .addSvgIcon('insurance', this.setPath(`${this.path}/insurance.svg`))
      .addSvgIcon('maintenance', this.setPath(`${this.path}/maintenance.svg`))
      .addSvgIcon('unique-case', this.setPath(`${this.path}/unique-case.svg`))
      .addSvgIcon('long-term', this.setPath(`${this.path}/long-term.svg`))
      .addSvgIcon('keep-word', this.setPath(`${this.path}/keep-word.svg`))
      .addSvgIcon('place-point', this.setPath(`${this.path}/place-point.svg`))
      .addSvgIcon('compliance-and-regulatory', this.setPath(`${this.path}/compliance-and-regulatory.svg`))
      .addSvgIcon('driver-safety', this.setPath(`${this.path}/driver-safety.svg`))
      .addSvgIcon('emergency-preparedness', this.setPath(`${this.path}/emergency-preparedness.svg`))
      .addSvgIcon('fleet', this.setPath(`${this.path}/fleet.svg`))
      .addSvgIcon('ifta', this.setPath(`${this.path}/ifta.svg`))
      .addSvgIcon('insurance-carries', this.setPath(`${this.path}/insurance-carries.svg`))
      .addSvgIcon('irp', this.setPath(`${this.path}/irp.svg`))
      .addSvgIcon('maintenance-files', this.setPath(`${this.path}/maintenance-files.svg`))
      .addSvgIcon('incident-investigations-carries', this.setPath(`${this.path}/incident-investigations-carries.svg`))
      .addSvgIcon('dqf-carries', this.setPath(`${this.path}/dqf-carries.svg`));
  }

  private setPath(url: string): SafeResourceUrl {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
