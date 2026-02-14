// ============================================
// Help & Support Component
// Location: frontend/src/app/features/driver/help/help.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

interface SupportCategory {
  title: string;
  icon: string;
  description: string;
  link: string;
}

@Component({
  selector: 'app-help',
  standalone: true,
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTabsModule
  ]
})
export class HelpComponent implements OnInit {
  
  searchQuery = '';
  selectedCategory = 'all';

  supportCategories: SupportCategory[] = [
    {
      title: 'Getting Started',
      icon: 'rocket_launch',
      description: 'Learn the basics of using CDL Ticket Management',
      link: '#getting-started'
    },
    {
      title: 'Submit a Ticket',
      icon: 'add_circle',
      description: 'How to submit a new traffic violation case',
      link: '#submit-ticket'
    },
    {
      title: 'Track Your Cases',
      icon: 'track_changes',
      description: 'Monitor the status of your submitted cases',
      link: '#track-cases'
    },
    {
      title: 'Documents & Evidence',
      icon: 'folder',
      description: 'Upload and manage your case documents',
      link: '#documents'
    },
    {
      title: 'Billing & Payments',
      icon: 'payment',
      description: 'Understanding fees and payment options',
      link: '#billing'
    },
    {
      title: 'Contact Support',
      icon: 'support_agent',
      description: 'Get help from our support team',
      link: '/driver/contact'
    }
  ];

  faqs: FAQ[] = [
    {
      category: 'getting-started',
      question: 'How do I get started with CDL Ticket Management?',
      answer: 'Simply create an account, submit your traffic ticket information, and upload any relevant documents. Our team will review your case and assign an attorney within 24 hours.'
    },
    {
      category: 'getting-started',
      question: 'What types of violations do you handle?',
      answer: 'We handle all types of CDL violations including speeding tickets, DUI/DWI, reckless driving, improper lane changes, log book violations, and more. If you have a commercial driver\'s license, we can help.'
    },
    {
      category: 'getting-started',
      question: 'How long does the process take?',
      answer: 'Case resolution times vary depending on the violation type and jurisdiction. Simple violations may be resolved in 2-4 weeks, while more complex cases can take 2-3 months. You can track progress in real-time through your dashboard.'
    },
    {
      category: 'submit-ticket',
      question: 'What information do I need to submit a ticket?',
      answer: 'You\'ll need your citation number, date of violation, location, violation type, and any supporting documents. Photos of the citation, your CDL, and any evidence are helpful.'
    },
    {
      category: 'submit-ticket',
      question: 'Can I submit multiple tickets at once?',
      answer: 'Yes! You can submit as many tickets as needed. Each case will be handled separately and you can track them all from your dashboard.'
    },
    {
      category: 'submit-ticket',
      question: 'What if I don\'t have all the documents right away?',
      answer: 'You can submit your case with the information you have and upload additional documents later through the case detail page.'
    },
    {
      category: 'track-cases',
      question: 'How do I check the status of my case?',
      answer: 'Go to "My Cases" in the sidebar. Click on any case to see detailed status, attorney comments, and all case activity. You\'ll also receive email and in-app notifications for important updates.'
    },
    {
      category: 'track-cases',
      question: 'What do the different case statuses mean?',
      answer: 'New: Just submitted. Under Review: Our team is reviewing. In Progress: Attorney is working on it. Resolved: Case completed. Rejected: Unable to assist with this case.'
    },
    {
      category: 'track-cases',
      question: 'Can I communicate with my assigned attorney?',
      answer: 'Yes! Use the comments section on your case detail page to ask questions and get updates from your attorney.'
    },
    {
      category: 'documents',
      question: 'What types of documents can I upload?',
      answer: 'We accept PDFs, images (JPG, PNG), and common document formats. Maximum file size is 10MB per file.'
    },
    {
      category: 'documents',
      question: 'Are my documents secure?',
      answer: 'Absolutely. All documents are encrypted and stored securely. Only you and your assigned attorney can access your case files.'
    },
    {
      category: 'documents',
      question: 'Can I delete documents after uploading?',
      answer: 'Yes, you can manage your documents from the case detail page. However, we recommend keeping all evidence uploaded for the best case outcome.'
    },
    {
      category: 'billing',
      question: 'How much does the service cost?',
      answer: 'Pricing varies by case type and complexity. You\'ll receive a quote before any work begins. Most cases range from $200-$800.'
    },
    {
      category: 'billing',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and bank transfers. Payment plans are available for cases over $500.'
    },
    {
      category: 'billing',
      question: 'Do you offer refunds?',
      answer: 'If we\'re unable to take your case or achieve any benefit, you receive a full refund. See our Terms of Service for complete refund policy.'
    }
  ];

  contactMethods = [
    {
      icon: 'email',
      title: 'Email Support',
      value: 'support@cdltickets.com',
      description: 'Response within 24 hours',
      action: 'mailto:support@cdltickets.com'
    },
    {
      icon: 'phone',
      title: 'Phone Support',
      value: '1-800-CDL-HELP',
      description: 'Mon-Fri 8AM-8PM EST',
      action: 'tel:1-800-235-4357'
    },
    {
      icon: 'chat',
      title: 'Live Chat',
      value: 'Available Now',
      description: 'Average response: 2 minutes',
      action: '#chat'
    },
    {
      icon: 'description',
      title: 'Submit a Ticket',
      value: 'Contact Form',
      description: 'Get help with specific issues',
      action: '/driver/contact'
    }
  ];

  ngOnInit(): void {
    // Scroll to section if hash is present
    if (window.location.hash) {
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  get filteredFAQs(): FAQ[] {
    let faqs = this.faqs;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      faqs = faqs.filter(faq => faq.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      faqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    return faqs;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  openContactMethod(action: string): void {
    if (action.startsWith('#')) {
      // Handle internal actions (like chat)
      console.log('Opening:', action);
    } else if (action.startsWith('/')) {
      // Navigate to route
      window.location.href = action;
    } else {
      // External link (mailto, tel)
      window.location.href = action;
    }
  }
}
