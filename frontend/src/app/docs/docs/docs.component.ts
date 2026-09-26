import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SeoService } from '@app/services/seo.service';
import { OpenGraphService } from '@app/services/opengraph.service';

type DocsTab = 'guide' | 'rest' | 'websocket';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss'],
  standalone: false,
})
export class DocsComponent implements OnInit, OnDestroy {
  activeTab: DocsTab = 'guide';
  sections: { id: string; label: string }[] = [];
  private navigationSubscription: Subscription;

  @HostBinding('attr.dir') dir = 'ltr';

  constructor(
    private router: Router,
    private seo: SeoService,
    private og: OpenGraphService,
  ) {}

  ngOnInit(): void {
    this.updatePage();
    this.navigationSubscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.updatePage());
    document.querySelector<HTMLElement>('html').style.scrollBehavior = 'smooth';
  }

  ngOnDestroy(): void {
    this.navigationSubscription?.unsubscribe();
    document.querySelector<HTMLElement>('html').style.scrollBehavior = 'auto';
  }

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    const target = document.getElementById(id);
    if (target) window.scrollTo({ top: target.offsetTop - (window.innerWidth <= 992 ? 120 : 80), behavior: 'smooth' });
    window.history.replaceState({}, '', `${this.router.url.split('#')[0]}#${id}`);
  }

  private updatePage(): void {
    const url = this.router.url;
    this.activeTab = url.includes('/api/websocket') ? 'websocket' : url.includes('/api') ? 'rest' : 'guide';
    const pages = {
      guide: { title: 'Dash Explorer Guide', description: 'Dash explorer coverage, confirmations, special transactions, and data limits.', sections: [['overview', 'Overview'], ['confirmations', 'Confirmations'], ['coverage', 'Coverage'], ['special-transactions', 'Special transactions'], ['sources', 'Sources']] },
      rest: { title: 'Dash REST API', description: 'Read-only REST API documentation for dash.tx.taxi.', sections: [['rest-overview', 'Overview'], ['blocks', 'Blocks'], ['transactions', 'Transactions'], ['addresses', 'Addresses'], ['live-data', 'Live data']] },
      websocket: { title: 'Dash WebSocket API', description: 'WebSocket documentation for observed Dash explorer updates.', sections: [['websocket-overview', 'Overview'], ['websocket-connect', 'Connect'], ['websocket-events', 'Events']] },
    }[this.activeTab];
    this.sections = pages.sections.map(([id, label]) => ({ id, label }));
    this.seo.setTitle(pages.title);
    this.seo.setDescription(pages.description);
    this.og.setManualOgImage('dashboard.png');
  }
}
