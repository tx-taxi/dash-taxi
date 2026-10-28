import { Component } from '@angular/core';
import { SeoService } from '@app/services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  standalone: false,
})
export class PrivacyPolicyComponent {
  constructor(
    private seoService: SeoService,
  ) { }

  ngOnInit(): void {
    this.seoService.setTitle($localize`:@@tx-taxi.seo.privacy.title:Privacy Policy`);
    this.seoService.setDescription($localize`:@@tx-taxi.seo.privacy.description:Privacy notes for dash.tx.taxi, including public Dash data, browser preferences, server logs, and independent verification.`);
  }
}
