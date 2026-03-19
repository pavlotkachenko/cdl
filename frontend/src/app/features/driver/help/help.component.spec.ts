import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { HelpComponent } from './help.component';

describe('HelpComponent', () => {
  let fixture: ComponentFixture<HelpComponent>;
  let component: HelpComponent;
  let router: Router;

  /** Query a single element */
  function el(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  /** Query all elements */
  function all(selector: string): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll(selector));
  }

  /** Get trimmed text content */
  function text(selector: string): string {
    return el(selector)?.textContent?.trim() ?? '';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Page Structure ────────────────────────────

  describe('Page Structure', () => {
    it('renders the hero section', () => {
      expect(el('.help-hero')).toBeTruthy();
    });

    it('renders hero h1 with Help Center', () => {
      expect(text('.help-hero h1')).toBe('Help Center');
    });

    it('renders the search input', () => {
      expect(el('.search-input')).toBeTruthy();
    });

    it('renders the categories section', () => {
      expect(el('.support-categories')).toBeTruthy();
    });

    it('renders the FAQ section', () => {
      expect(el('#faq')).toBeTruthy();
    });

    it('renders the contact section', () => {
      expect(el('.contact-support-section')).toBeTruthy();
    });

    it('renders the resources section', () => {
      expect(el('.resources-section')).toBeTruthy();
    });

    it('renders the footer CTA', () => {
      expect(el('.footer-cta')).toBeTruthy();
    });

    it('renders CTA link to submit-ticket', () => {
      const cta = el('.cta-button');
      expect(cta).toBeTruthy();
      expect(cta!.textContent?.trim()).toBe('Submit a Ticket');
    });
  });

  // ── Search ────────────────────────────────────

  describe('Search', () => {
    it('filters FAQs when typing in search', () => {
      const input = el('.search-input') as HTMLInputElement;
      input.value = 'refund';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const questions = all('.faq-question');
      expect(questions.length).toBe(1);
      expect(questions[0].textContent).toContain('refund');
    });

    it('resets category to all when searching', () => {
      component.selectCategory('billing');
      fixture.detectChanges();

      const input = el('.search-input') as HTMLInputElement;
      input.value = 'document';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.selectedCategory()).toBe('all');
    });

    it('shows no-results when nothing matches', () => {
      const input = el('.search-input') as HTMLInputElement;
      input.value = 'xyznonexistent';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(el('.no-results')).toBeTruthy();
      expect(text('.no-results h3')).toBe('No results found');
    });

    it('clears search and shows all FAQs via Clear Search button', () => {
      const input = el('.search-input') as HTMLInputElement;
      input.value = 'xyznonexistent';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const btn = el('.btn-clear') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();

      expect(component.searchQuery()).toBe('');
      expect(all('.faq-item').length).toBe(15);
    });
  });

  // ── Category Cards ────────────────────────────

  describe('Category Cards', () => {
    it('renders 6 category cards', () => {
      expect(all('.category-card').length).toBe(6);
    });

    it('shows correct emojis on cards', () => {
      const emojis = all('.category-emoji').map(e => e.textContent?.trim());
      expect(emojis).toEqual(['🚀', '➕', '📋', '📁', '💳', '🎧']);
    });

    it('shows correct titles on cards', () => {
      const titles = all('.category-card h3').map(e => e.textContent?.trim());
      expect(titles).toEqual([
        'Getting Started',
        'Submit a Ticket',
        'Track Cases',
        'Documents',
        'Billing & Payments',
        'Contact Support',
      ]);
    });

    it('shows article counts', () => {
      const counts = all('.article-count').map(e => e.textContent?.trim());
      expect(counts).toEqual(['3 articles', '3 articles', '3 articles', '3 articles', '3 articles', '0 articles']);
    });

    it('clicking a card sets selectedCategory', () => {
      const card = all('.category-card')[1]; // Submit a Ticket
      card.click();
      fixture.detectChanges();

      expect(component.selectedCategory()).toBe('submit-ticket');
    });

    it('cards have role=button and tabindex=0', () => {
      const card = el('.category-card');
      expect(card!.getAttribute('role')).toBe('button');
      expect(card!.getAttribute('tabindex')).toBe('0');
    });

    it('keyboard Enter triggers category selection', () => {
      const card = all('.category-card')[2]; // Track Cases
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(component.selectedCategory()).toBe('track-cases');
    });
  });

  // ── Category Tabs ─────────────────────────────

  describe('Category Tabs', () => {
    it('renders 6 tab buttons', () => {
      expect(all('.tab-btn').length).toBe(6);
    });

    it('All Topics tab is active by default', () => {
      const activeTab = el('.tab-btn.active');
      expect(activeTab!.textContent?.trim()).toBe('All Topics');
    });

    it('clicking a tab filters FAQs', () => {
      const billingTab = all('.tab-btn')[5]; // Billing
      billingTab.click();
      fixture.detectChanges();

      const questions = all('.faq-question');
      expect(questions.length).toBe(3);
      questions.forEach(q => {
        expect(
          q.textContent!.toLowerCase().includes('cost') ||
          q.textContent!.toLowerCase().includes('payment') ||
          q.textContent!.toLowerCase().includes('refund')
        ).toBe(true);
      });
    });

    it('active tab has aria-selected=true', () => {
      const tab = el('.tab-btn.active');
      expect(tab!.getAttribute('aria-selected')).toBe('true');
    });

    it('tab container has role=tablist', () => {
      const tablist = el('.category-tabs');
      expect(tablist!.getAttribute('role')).toBe('tablist');
    });
  });

  // ── FAQ Accordion ─────────────────────────────

  describe('FAQ Accordion', () => {
    it('renders all 15 FAQ items by default', () => {
      expect(all('.faq-item').length).toBe(15);
    });

    it('all FAQs are collapsed by default', () => {
      const expanded = all('.faq-answer.expanded');
      expect(expanded.length).toBe(0);
    });

    it('clicking a FAQ header expands the answer', () => {
      const header = all('.faq-header-row')[0];
      header.click();
      fixture.detectChanges();

      expect(component.expandedFaqIndex()).toBe(0);
      const answer = el('#faq-answer-0');
      expect(answer!.classList.contains('expanded')).toBe(true);
    });

    it('clicking again collapses the answer', () => {
      const header = all('.faq-header-row')[0];
      header.click();
      fixture.detectChanges();
      header.click();
      fixture.detectChanges();

      expect(component.expandedFaqIndex()).toBeNull();
      const answer = el('#faq-answer-0');
      expect(answer!.classList.contains('expanded')).toBe(false);
    });

    it('only one FAQ is expanded at a time', () => {
      all('.faq-header-row')[0].click();
      fixture.detectChanges();
      all('.faq-header-row')[2].click();
      fixture.detectChanges();

      expect(component.expandedFaqIndex()).toBe(2);
      expect(all('.faq-answer.expanded').length).toBe(1);
    });

    it('Enter key toggles FAQ expansion', () => {
      const header = all('.faq-header-row')[1];
      header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(component.expandedFaqIndex()).toBe(1);
    });

    it('Space key toggles FAQ expansion', () => {
      const header = all('.faq-header-row')[3];
      header.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();

      expect(component.expandedFaqIndex()).toBe(3);
    });

    it('FAQ header has aria-expanded attribute', () => {
      const header = all('.faq-header-row')[0];
      expect(header.getAttribute('aria-expanded')).toBe('false');

      header.click();
      fixture.detectChanges();
      expect(header.getAttribute('aria-expanded')).toBe('true');
    });

    it('FAQ answer has role=region', () => {
      const answer = el('#faq-answer-0');
      expect(answer!.getAttribute('role')).toBe('region');
    });

    it('FAQ answer has aria-labelledby pointing to header', () => {
      const answer = el('#faq-answer-0');
      expect(answer!.getAttribute('aria-labelledby')).toBe('faq-header-0');
    });

    it('chevron rotates when expanded', () => {
      const chevron = all('.faq-chevron')[0];
      expect(chevron.classList.contains('expanded')).toBe(false);

      all('.faq-header-row')[0].click();
      fixture.detectChanges();

      expect(all('.faq-chevron')[0].classList.contains('expanded')).toBe(true);
    });
  });

  // ── Contact Cards ─────────────────────────────

  describe('Contact Cards', () => {
    it('renders 4 contact cards', () => {
      expect(all('.contact-card').length).toBe(4);
    });

    it('shows correct emojis on contact cards', () => {
      const emojis = all('.contact-emoji').map(e => e.textContent?.trim());
      expect(emojis).toEqual(['📧', '📞', '💬', '📝']);
    });

    it('shows correct titles', () => {
      const titles = all('.contact-card h3').map(e => e.textContent?.trim());
      expect(titles).toEqual(['Email Support', 'Phone Support', 'Live Chat', 'Support Ticket']);
    });

    it('shows availability and response time', () => {
      const first = all('.contact-card')[0];
      expect(first.querySelector('.contact-availability')!.textContent?.trim()).toBe('Available 24/7');
      expect(first.querySelector('.contact-response')!.textContent?.trim()).toBe('Response within 24 hours');
    });

    it('clicking email card calls window.open with mailto', () => {
      const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
      all('.contact-card')[0].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith('mailto:support@cdltickets.com', '_blank');
      spy.mockRestore();
    });

    it('clicking phone card calls window.open with tel', () => {
      const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
      all('.contact-card')[1].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith('tel:1-800-235-4357', '_blank');
      spy.mockRestore();
    });

    it('clicking support ticket card navigates via router', () => {
      all('.contact-card')[3].click();
      fixture.detectChanges();

      expect(router.navigate).toHaveBeenCalledWith(['/driver/contact']);
    });

    it('contact cards have role=button and tabindex', () => {
      const card = all('.contact-card')[0];
      expect(card.getAttribute('role')).toBe('button');
      expect(card.getAttribute('tabindex')).toBe('0');
    });
  });

  // ── Resources ─────────────────────────────────

  describe('Resources', () => {
    it('renders 6 resource links', () => {
      expect(all('.resource-link').length).toBe(6);
    });

    it('shows correct labels', () => {
      const labels = all('.resource-link').map(e => e.textContent?.trim());
      expect(labels).toEqual([
        '➕ Submit a Ticket',
        '⚖️ My Cases',
        '📊 Analytics',
        '👤 My Profile',
        '🔒 Privacy Policy',
        '📄 Terms of Service',
      ]);
    });
  });

  // ── Computed Signals ──────────────────────────

  describe('Computed Signals', () => {
    it('filteredFAQs returns all 15 when category=all and no search', () => {
      expect(component.filteredFAQs().length).toBe(15);
    });

    it('filteredFAQs filters by category', () => {
      component.selectCategory('documents');
      expect(component.filteredFAQs().length).toBe(3);
      expect(component.filteredFAQs().every(f => f.category === 'documents')).toBe(true);
    });

    it('filteredFAQs filters by search query', () => {
      component.searchQuery.set('refund');
      const results = component.filteredFAQs();
      expect(results.length).toBe(1);
      expect(results[0].question).toContain('refund');
    });

    it('filteredFAQs filters by both category and search', () => {
      component.selectedCategory.set('billing');
      component.searchQuery.set('payment');
      const results = component.filteredFAQs();
      expect(results.length).toBe(1);
      expect(results[0].question).toContain('payment methods');
    });

    it('hasResults returns true when there are matches', () => {
      expect(component.hasResults()).toBe(true);
    });

    it('hasResults returns false when nothing matches', () => {
      component.searchQuery.set('xyznonexistent');
      expect(component.hasResults()).toBe(false);
    });

    it('articleCounts returns correct counts per category', () => {
      const counts = component.articleCounts();
      expect(counts['getting-started']).toBe(3);
      expect(counts['submit-ticket']).toBe(3);
      expect(counts['track-cases']).toBe(3);
      expect(counts['documents']).toBe(3);
      expect(counts['billing']).toBe(3);
      expect(counts['contact']).toBe(0);
    });
  });

  // ── Accessibility ─────────────────────────────

  describe('Accessibility', () => {
    it('search input has aria-label', () => {
      expect(el('.search-input')!.getAttribute('aria-label')).toBe('Search help topics');
    });

    it('tab container has role=tablist with aria-label', () => {
      const tablist = el('.category-tabs');
      expect(tablist!.getAttribute('role')).toBe('tablist');
      expect(tablist!.getAttribute('aria-label')).toBe('FAQ category filter');
    });

    it('tab buttons have role=tab', () => {
      const tabs = all('.tab-btn');
      tabs.forEach(tab => {
        expect(tab.getAttribute('role')).toBe('tab');
      });
    });

    it('FAQ headers have role=button', () => {
      const headers = all('.faq-header-row');
      headers.forEach(h => {
        expect(h.getAttribute('role')).toBe('button');
      });
    });

    it('emoji spans have aria-hidden=true', () => {
      const emojis = all('[aria-hidden="true"]');
      expect(emojis.length).toBeGreaterThan(0);

      const heroEmoji = el('.hero-emoji');
      expect(heroEmoji!.getAttribute('aria-hidden')).toBe('true');
    });

    it('FAQ headers have aria-controls linking to answer panels', () => {
      const header = all('.faq-header-row')[0];
      expect(header.getAttribute('aria-controls')).toBe('faq-answer-0');
    });
  });

  // ── Methods ───────────────────────────────────

  describe('Methods', () => {
    it('selectCategory sets the signal', () => {
      component.selectCategory('billing');
      expect(component.selectedCategory()).toBe('billing');
    });

    it('selectCategory resets expandedFaqIndex', () => {
      component.expandedFaqIndex.set(5);
      component.selectCategory('billing');
      expect(component.expandedFaqIndex()).toBeNull();
    });

    it('clearSearch resets all state', () => {
      component.searchQuery.set('test');
      component.selectedCategory.set('billing');
      component.expandedFaqIndex.set(3);

      component.clearSearch();

      expect(component.searchQuery()).toBe('');
      expect(component.selectedCategory()).toBe('all');
      expect(component.expandedFaqIndex()).toBeNull();
    });

    it('toggleFaq opens a FAQ', () => {
      component.toggleFaq(5);
      expect(component.expandedFaqIndex()).toBe(5);
    });

    it('toggleFaq closes when same index', () => {
      component.toggleFaq(5);
      component.toggleFaq(5);
      expect(component.expandedFaqIndex()).toBeNull();
    });

    it('toggleFaq switches to new index', () => {
      component.toggleFaq(2);
      component.toggleFaq(7);
      expect(component.expandedFaqIndex()).toBe(7);
    });

    it('chat action does not navigate or open window', () => {
      const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const chatMethod = component.contactMethods[2]; // Live Chat
      component.openContactMethod(chatMethod);

      expect(spy).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
