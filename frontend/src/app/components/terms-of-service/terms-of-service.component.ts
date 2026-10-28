import { Component } from '@angular/core';
import { SeoService } from '@app/services/seo.service';

@Component({
  selector: 'app-terms-of-service',
  templateUrl: './terms-of-service.component.html',
  standalone: false,
})
export class TermsOfServiceComponent {
  constructor(
    private seoService: SeoService,
  ) { }

  ngOnInit(): void {
    this.seoService.setTitle($localize`:@@tx-taxi.seo.terms.title:Terms of Service`);
    this.seoService.setDescription($localize`:@@tx-taxi.seo.terms.description:Terms for using dash.tx.taxi as an informational Dash block and mempool explorer.`);
  }
}
