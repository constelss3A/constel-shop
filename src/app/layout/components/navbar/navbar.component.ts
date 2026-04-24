import { Component, OnDestroy, OnInit, AfterViewInit, NgZone, ChangeDetectorRef, HostBinding, HostListener, ViewEncapsulation } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';

import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { AuthenticationService } from 'app/auth/service';
import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';
import { CoreConfigService } from '@core/services/config.service';
import { CoreMediaService } from '@core/services/media.service';

import { User } from 'app/auth/models';

import { coreConfig } from 'app/app-config';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

declare const google: any;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  public horizontalMenu: boolean;
  public hiddenMenu: boolean;

  public coreConfig: any;
  public currentSkin: string;
  public prevSkin: string;

  public currentUser: User;
  public isCheckoutRoute = false;

  public languageOptions: any;
  public navigation: any;
  public selectedLanguage: any;

  @HostBinding('class.fixed-top')
  public isFixed = false;

  @HostBinding('class.navbar-static-style-on-scroll')
  public windowScrolled = false;

  // Add .navbar-static-style-on-scroll on scroll using HostListener & HostBinding
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (
      (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop > 100) &&
      this.coreConfig.layout.navbar.type == 'navbar-static-top' &&
      this.coreConfig.layout.type == 'horizontal'
    ) {
      this.windowScrolled = true;
    } else if (
      (this.windowScrolled && window.pageYOffset) ||
      document.documentElement.scrollTop ||
      document.body.scrollTop < 10
    ) {
      this.windowScrolled = false;
    }
  }

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {Router} _router
   * @param {AuthenticationService} _authenticationService
   * @param {CoreConfigService} _coreConfigService
   * @param {CoreSidebarService} _coreSidebarService
   * @param {CoreMediaService} _coreMediaService
   * @param {MediaObserver} _mediaObserver
   * @param {TranslateService} _translateService
   */
  constructor(
    private _router: Router,
    private _ngZone: NgZone,
    private _cd: ChangeDetectorRef,
    private _authenticationService: AuthenticationService,
    private _coreConfigService: CoreConfigService,
    private _coreMediaService: CoreMediaService,
    private _coreSidebarService: CoreSidebarService,
    private _mediaObserver: MediaObserver,
    public _translateService: TranslateService
  ) {
    this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));

    this.languageOptions = {
      en: {
        title: 'English',
        flag: 'us'
      },
      fr: {
        title: 'French',
        flag: 'fr'
      },
      de: {
        title: 'German',
        flag: 'de'
      },
      pt: {
        title: 'Portuguese',
        flag: 'pt'
      }
    };

    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle sidebar open
   *
   * @param key
   */
  toggleSidebar(key): void {
    this._coreSidebarService.getSidebarRegistry(key).toggleOpen();
  }

  /**
   * Set the language
   *
   * @param language
   */
  setLanguage(language): void {
    // Set the selected language for the navbar on change
    this.selectedLanguage = language;

    // Use the selected language id for translations
    this._translateService.use(language);

    this._coreConfigService.setConfig({ app: { appLanguage: language } }, { emitEvent: true });
  }

  /**
   * Toggle Dark Skin
   */
  toggleDarkSkin() {
    // Get the current skin
    this._coreConfigService
      .getConfig()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(config => {
        this.currentSkin = config.layout.skin;
      });

    // Toggle Dark skin with prevSkin skin
    this.prevSkin = localStorage.getItem('prevSkin');

    if (this.currentSkin === 'dark') {
      this._coreConfigService.setConfig(
        { layout: { skin: this.prevSkin ? this.prevSkin : 'default' } },
        { emitEvent: true }
      );
    } else {
      localStorage.setItem('prevSkin', this.currentSkin);
      this._coreConfigService.setConfig({ layout: { skin: 'dark' } }, { emitEvent: true });
    }
  }

  /**
   * Inicializa o Google Sign-In
   */
  ngAfterViewInit(): void {
    if (!this.currentUser) {
      this.waitForGoogleAndInit();
    }
  }

  private googleReady = false;

  private initGoogleSignIn(): void {
    google.accounts.id.initialize({
      client_id: '610456046637-h2s9nfskkg8jad5t2jpi1lg5t3n0b509.apps.googleusercontent.com',
      callback: (res: any) => this._ngZone.run(() => this.handleGoogleResponse(res)),
    });
    const btnEl = document.getElementById('google-btn');
    if (btnEl) {
      google.accounts.id.renderButton(btnEl, { size: 'large' });
    }
    this.googleReady = true;
  }

  private waitForGoogleAndInit(): void {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      this.initGoogleSignIn();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com"]');
      if (script) {
        script.addEventListener('load', () => this.initGoogleSignIn());
      }
    }
  }

  loginWithGoogle(): void {
    if (this.googleReady && typeof google !== 'undefined') {
      google.accounts.id.prompt((notification: any) => {
        console.log('Google prompt:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: clica no botão oculto do Google
          const btnEl = document.getElementById('google-btn');
          if (btnEl) {
            btnEl.style.display = 'block';
            btnEl.style.position = 'absolute';
            btnEl.style.opacity = '0.01';
            const iframe = btnEl.querySelector('iframe');
            if (iframe) {
              btnEl.style.display = 'none';
            }
          }
        }
      });
    } else {
      this.waitForGoogleAndInit();
      setTimeout(() => this.loginWithGoogle(), 600);
    }
  }

  private handleGoogleResponse(response: any): void {
    console.log('Google credential recebido');
    this._authenticationService.loginWithGoogle(response.credential);
    this.currentUser = this._authenticationService.currentUserValue;
    this._cd.detectChanges();
  }

  /**
   * Logout method
   */
  logout() {
    this._authenticationService.logout();
    this._router.navigate(['/']);
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // subscribe to currentUser changes (login/logout from anywhere)
    this._authenticationService.currentUser
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(user => {
        this.currentUser = user;
        this._cd.detectChanges();
      });

    this.isCheckoutRoute = this._router.url.includes('/e-commerce/checkout');
    this._router.events.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
      this.isCheckoutRoute = this._router.url.includes('/e-commerce/checkout');
    });

    // Subscribe to the config changes
    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;
      this.horizontalMenu = config.layout.type === 'horizontal';
      this.hiddenMenu = config.layout.menu.hidden === true;
      this.currentSkin = config.layout.skin;

      // Fix: for vertical layout if default navbar fixed-top than set isFixed = true
      if (this.coreConfig.layout.type === 'vertical') {
        setTimeout(() => {
          if (this.coreConfig.layout.navbar.type === 'fixed-top') {
            this.isFixed = true;
          }
        }, 0);
      }
    });

    // Horizontal Layout Only: Add class fixed-top to navbar below large screen
    if (this.coreConfig.layout.type == 'horizontal') {
      // On every media(screen) change
      this._coreMediaService.onMediaUpdate.pipe(takeUntil(this._unsubscribeAll)).subscribe(() => {
        const isFixedTop = this._mediaObserver.isActive('bs-gt-xl');
        if (isFixedTop) {
          this.isFixed = false;
        } else {
          this.isFixed = true;
        }
      });
    }

    // Set the selected language from default languageOptions
    this.selectedLanguage = _.find(this.languageOptions, {
      id: this._translateService.currentLang
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
