// ============================================
// Help & Support Component (Redesigned)
// Location: frontend/src/app/features/driver/help/help.component.ts
// Sprint 067 — Help Center Redesign
// ============================================

import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  afterNextRender,
  inject,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

// ── Interfaces ──────────────────────────────────────────────

interface FAQ {
  question: string;
  answer: string;
  category: string;
  icon: string;
}

interface SupportCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
}

interface ContactMethod {
  emoji: string;
  title: string;
  value: string;
  description: string;
  availability: string;
  responseTime: string;
  action: string;
}

interface Resource {
  emoji: string;
  label: string;
  route: string;
}

interface CategoryTab {
  id: string;
  label: string;
}

// ── Component ───────────────────────────────────────────────

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
})
export class HelpComponent {
  private readonly router = inject(Router);

  // ── Signals ─────────────────────────────────────────────

  searchQuery = signal('');
  selectedCategory = signal('all');
  expandedFaqIndex = signal<number | null>(null);

  // ── Data ────────────────────────────────────────────────

  readonly categories: SupportCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      emoji: '🚀',
      description: 'Learn the basics of CDL Ticket Management and set up your account.',
    },
    {
      id: 'submit-ticket',
      title: 'Submit a Ticket',
      emoji: '➕',
      description: 'How to submit traffic tickets and upload supporting documents.',
    },
    {
      id: 'track-cases',
      title: 'Track Cases',
      emoji: '📋',
      description: 'Monitor your case progress, statuses, and attorney communications.',
    },
    {
      id: 'documents',
      title: 'Documents',
      emoji: '📁',
      description: 'Manage uploads, file types, security, and document organization.',
    },
    {
      id: 'billing',
      title: 'Billing & Payments',
      emoji: '💳',
      description: 'Pricing, payment methods, refunds, and payment plan information.',
    },
    {
      id: 'contact',
      title: 'Contact Support',
      emoji: '🎧',
      description: 'Reach our team via email, phone, live chat, or support tickets.',
    },
  ];

  readonly faqs: FAQ[] = [
    {
      category: 'getting-started',
      icon: '🚀',
      question: 'How do I get started with CDL Ticket Management?',
      answer:
        'Simply create an account, submit your traffic ticket information, and upload any relevant documents. Our team will review your case and assign an attorney within 24 hours.',
    },
    {
      category: 'getting-started',
      icon: '🚀',
      question: 'What types of violations do you handle?',
      answer:
        "We handle all types of CDL violations including speeding tickets, DUI/DWI, reckless driving, improper lane changes, log book violations, and more. If you have a commercial driver's license, we can help.",
    },
    {
      category: 'getting-started',
      icon: '🚀',
      question: 'How long does the process take?',
      answer:
        'Case resolution times vary depending on the violation type and jurisdiction. Simple violations may be resolved in 2-4 weeks, while more complex cases can take 2-3 months. You can track progress in real-time through your dashboard.',
    },
    {
      category: 'submit-ticket',
      icon: '➕',
      question: 'What information do I need to submit a ticket?',
      answer:
        "You'll need your citation number, date of violation, location, violation type, and any supporting documents. Photos of the citation, your CDL, and any evidence are helpful.",
    },
    {
      category: 'submit-ticket',
      icon: '➕',
      question: 'Can I submit multiple tickets at once?',
      answer:
        'Yes! You can submit as many tickets as needed. Each case will be handled separately and you can track them all from your dashboard.',
    },
    {
      category: 'submit-ticket',
      icon: '➕',
      question: "What if I don't have all the documents right away?",
      answer:
        'You can submit your case with the information you have and upload additional documents later through the case detail page.',
    },
    {
      category: 'track-cases',
      icon: '📋',
      question: 'How do I check the status of my case?',
      answer:
        'Go to "My Cases" in the sidebar. Click on any case to see detailed status, attorney comments, and all case activity. You\'ll also receive email and in-app notifications for important updates.',
    },
    {
      category: 'track-cases',
      icon: '📋',
      question: 'What do the different case statuses mean?',
      answer:
        'New: Just submitted. Under Review: Our team is reviewing. In Progress: Attorney is working on it. Resolved: Case completed. Rejected: Unable to assist with this case.',
    },
    {
      category: 'track-cases',
      icon: '📋',
      question: 'Can I communicate with my assigned attorney?',
      answer:
        'Yes! Use the comments section on your case detail page to ask questions and get updates from your attorney.',
    },
    {
      category: 'documents',
      icon: '📁',
      question: 'What types of documents can I upload?',
      answer:
        'We accept PDFs, images (JPG, PNG), and common document formats. Maximum file size is 10MB per file.',
    },
    {
      category: 'documents',
      icon: '📁',
      question: 'Are my documents secure?',
      answer:
        'Absolutely. All documents are encrypted and stored securely. Only you and your assigned attorney can access your case files.',
    },
    {
      category: 'documents',
      icon: '📁',
      question: 'Can I delete documents after uploading?',
      answer:
        'Yes, you can manage your documents from the case detail page. However, we recommend keeping all evidence uploaded for the best case outcome.',
    },
    {
      category: 'billing',
      icon: '💳',
      question: 'How much does the service cost?',
      answer:
        "Pricing varies by case type and complexity. You'll receive a quote before any work begins. Most cases range from $200-$800.",
    },
    {
      category: 'billing',
      icon: '💳',
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards, debit cards, and bank transfers. Payment plans are available for cases over $500.',
    },
    {
      category: 'billing',
      icon: '💳',
      question: 'Do you offer refunds?',
      answer:
        "If we're unable to take your case or achieve any benefit, you receive a full refund. See our Terms of Service for complete refund policy.",
    },
  ];

  readonly contactMethods: ContactMethod[] = [
    {
      emoji: '📧',
      title: 'Email Support',
      value: 'support@cdltickets.com',
      description: "Send us a detailed message and we'll get back to you.",
      availability: 'Available 24/7',
      responseTime: 'Response within 24 hours',
      action: 'mailto:support@cdltickets.com',
    },
    {
      emoji: '📞',
      title: 'Phone Support',
      value: '1-800-CDL-HELP',
      description: 'Speak directly with a support representative.',
      availability: 'Mon\u2013Fri, 8 AM \u2013 8 PM EST',
      responseTime: 'Avg. wait < 5 minutes',
      action: 'tel:1-800-235-4357',
    },
    {
      emoji: '💬',
      title: 'Live Chat',
      value: 'Start a Chat',
      description: 'Get instant help from our support team.',
      availability: 'Mon\u2013Fri, 9 AM \u2013 6 PM EST',
      responseTime: 'Instant connection',
      action: '#chat',
    },
    {
      emoji: '📝',
      title: 'Support Ticket',
      value: 'Submit a Request',
      description: 'Create a detailed support ticket for complex issues.',
      availability: 'Available 24/7',
      responseTime: 'Response within 12 hours',
      action: '/driver/contact',
    },
  ];

  readonly resources: Resource[] = [
    { emoji: '➕', label: 'Submit a Ticket', route: '/driver/submit-ticket' },
    { emoji: '⚖️', label: 'My Cases', route: '/driver/tickets' },
    { emoji: '📊', label: 'Analytics', route: '/driver/analytics' },
    { emoji: '👤', label: 'My Profile', route: '/driver/profile' },
    { emoji: '🔒', label: 'Privacy Policy', route: '/privacy' },
    { emoji: '📄', label: 'Terms of Service', route: '/terms' },
  ];

  readonly categoryTabs: CategoryTab[] = [
    { id: 'all', label: 'All Topics' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'submit-ticket', label: 'Submit Ticket' },
    { id: 'track-cases', label: 'Track Cases' },
    { id: 'documents', label: 'Documents' },
    { id: 'billing', label: 'Billing' },
  ];

  // ── Computed ────────────────────────────────────────────

  filteredFAQs = computed(() => {
    let faqs = this.faqs;

    const cat = this.selectedCategory();
    if (cat !== 'all') {
      faqs = faqs.filter(f => f.category === cat);
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      faqs = faqs.filter(
        f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
      );
    }

    return faqs;
  });

  hasResults = computed(() => this.filteredFAQs().length > 0);

  articleCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const cat of this.categories) {
      counts[cat.id] = this.faqs.filter(f => f.category === cat.id).length;
    }
    return counts;
  });

  // ── Lifecycle ───────────────────────────────────────────

  constructor() {
    afterNextRender(() => {
      if (window.location.hash) {
        const el = document.querySelector(window.location.hash);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ── Methods ─────────────────────────────────────────────

  selectCategory(id: string): void {
    this.selectedCategory.set(id);
    this.expandedFaqIndex.set(null);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.selectedCategory.set('all');
    this.expandedFaqIndex.set(null);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.expandedFaqIndex.set(null);
  }

  selectCategoryAndScroll(id: string): void {
    this.selectedCategory.set(id);
    this.expandedFaqIndex.set(null);
    this.scrollToFaq();
  }

  scrollToFaq(): void {
    document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleFaq(index: number): void {
    this.expandedFaqIndex.update(current => (current === index ? null : index));
  }

  onFaqKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleFaq(index);
    }
  }

  onCategoryCardKeydown(event: KeyboardEvent, id: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectCategoryAndScroll(id);
    }
  }

  openContactMethod(method: ContactMethod): void {
    if (method.action.startsWith('#')) {
      return;
    }
    if (method.action.startsWith('/')) {
      this.router.navigate([method.action]);
    } else {
      window.open(method.action, '_blank');
    }
  }

  onContactKeydown(event: KeyboardEvent, method: ContactMethod): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openContactMethod(method);
    }
  }
}
