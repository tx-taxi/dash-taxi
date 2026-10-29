import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-tx-taxi-docs-intro',
  standalone: true,
  templateUrl: './tx-taxi-docs-intro.component.html',
  styleUrls: ['./tx-taxi-docs-intro.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TxTaxiDocsIntroComponent {
  @Input() context = 'documentation';
  get localizedContext(): string {
    return this.context === 'explorer' ? $localize`:@@tx-taxi.intro-context-explorer:explorer` : this.context === 'documentation' ? $localize`:@@tx-taxi.intro-context-docs:documentation` : this.context;
  }
  get contextLabel(): string {
    return this.context === 'explorer'
      ? $localize`:@@tx-taxi.intro-eyebrow-explorer:${this.chainName}:CHAIN: explorer`
      : this.context === 'documentation'
        ? $localize`:@@tx-taxi.intro-eyebrow-docs:${this.chainName}:CHAIN: documentation`
        : `${this.chainName} ${this.context}`;
  }
  @Input() chainName = '';
  @Input() chainHost = '';
  get openChainLabel(): string { return $localize`:@@tx-taxi.intro-open-chain:Open ${this.chainHost}:chainHost:`; }
}
