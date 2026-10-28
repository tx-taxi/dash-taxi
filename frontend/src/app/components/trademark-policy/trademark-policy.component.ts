import { Component } from '@angular/core';
import { SeoService } from '@app/services/seo.service';

@Component({
  selector: 'app-trademark-policy',
  templateUrl: './trademark-policy.component.html',
  styleUrls: ['./trademark-policy.component.scss'],
  standalone: false,
})
export class TrademarkPolicyComponent {
  constructor(
    private seoService: SeoService,
  ) { }

  ngOnInit(): void {
    this.seoService.setTitle($localize`:@@tx-taxi.seo.trademark.title:Trademark & Attribution`);
    this.seoService.setDescription($localize`:@@tx-taxi.seo.trademark.description:Trademark and attribution notes for dash.tx.taxi, including upstream mempool/mempool attribution and project independence.`);
  }
}
