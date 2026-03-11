import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

const LANG_KEY = 'cdl_lang';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLandingPage = false;
  title = 'cdl-ticket-management';

  constructor(
    private router: Router,
    private translate: TranslateService,
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isLandingPage = event.urlAfterRedirects === '/';
      });
  }

  ngOnInit(): void {
    const saved = localStorage.getItem(LANG_KEY);
    this.translate.use(saved || 'en');
  }
}
