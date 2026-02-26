import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubscriptionService, Subscription, SubscriptionPlan, BillingHistory } from '../../../services/subscription.service';
import { CancelSubscriptionDialogComponent } from './cancel-subscription-dialog/cancel-subscription-dialog.component';

@Component({
  selector: 'app-subscription-management',
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.scss']
})
export class SubscriptionManagementComponent implements OnInit {
  currentSubscription: Subscription | null = null;
  availablePlans: SubscriptionPlan[] = [];
  billingHistory: BillingHistory[] = [];
  loading = false;
  billingHistoryColumns: string[] = ['date', 'amount', 'status', 'actions'];

  constructor(
    private subscriptionService: SubscriptionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
    this.loadPlans();
    this.loadBillingHistory();
  }

  loadSubscription(): void {
    this.loading = true;
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (subscription) => {
        this.currentSubscription = subscription;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subscription:', error);
        this.loading = false;
        if (error.status !== 404) {
          this.snackBar.open('Error loading subscription', 'Close', { duration: 3000 });
        }
      }
    });
  }

  loadPlans(): void {
    this.subscriptionService.getPlans().subscribe({
      next: (plans) => {
        this.availablePlans = plans;
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.snackBar.open('Error loading plans', 'Close', { duration: 3000 });
      }
    });
  }

  loadBillingHistory(): void {
    this.subscriptionService.getBillingHistory().subscribe({
      next: (history) => {
        this.billingHistory = history;
      },
      error: (error) => {
        console.error('Error loading billing history:', error);
        this.snackBar.open('Error loading billing history', 'Close', { duration: 3000 });
      }
    });
  }

  getCurrentPlan(): SubscriptionPlan | undefined {
    if (!this.currentSubscription) return undefined;
    return this.availablePlans.find(p => p.price_id === this.currentSubscription?.stripe_price_id);
  }

  getTrialDaysRemaining(): number {
    if (!this.currentSubscription?.trial_end) return 0;
    const trialEnd = new Date(this.currentSubscription.trial_end);
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isTrialing(): boolean {
    return this.currentSubscription?.status === 'trialing';
  }

  isPlanCurrent(plan: SubscriptionPlan): boolean {
    return plan.price_id === this.currentSubscription?.stripe_price_id;
  }

  canUpgrade(plan: SubscriptionPlan): boolean {
    if (!this.currentSubscription) return true;
    const currentPlan = this.getCurrentPlan();
    return currentPlan ? plan.price > currentPlan.price : false;
  }

  canDowngrade(plan: SubscriptionPlan): boolean {
    if (!this.currentSubscription) return false;
    const currentPlan = this.getCurrentPlan();
    return currentPlan ? plan.price < currentPlan.price : false;
  }

  async changePlan(plan: SubscriptionPlan): Promise<void> {
    if (!this.currentSubscription) {
      this.snackBar.open('Please create a subscription first', 'Close', { duration: 3000 });
      return;
    }

    if (this.isPlanCurrent(plan)) {
      this.snackBar.open('This is your current plan', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;

    // Get proration preview
    this.subscriptionService.getProrationPreview(this.currentSubscription.id, plan.price_id).subscribe({
      next: (preview) => {
        const action = this.canUpgrade(plan) ? 'upgrade' : 'downgrade';
        const message = `${action.charAt(0).toUpperCase() + action.slice(1)} to ${plan.name}? ${preview.proration_message || ''}`;

        if (confirm(message)) {
          this.updateSubscription(plan.price_id);
        } else {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error getting proration preview:', error);
        this.loading = false;
        this.snackBar.open('Error calculating proration', 'Close', { duration: 3000 });
      }
    });
  }

  private updateSubscription(newPriceId: string): void {
    if (!this.currentSubscription) return;

    this.subscriptionService.updateSubscription(this.currentSubscription.id, newPriceId).subscribe({
      next: (subscription) => {
        this.currentSubscription = subscription;
        this.loading = false;
        this.snackBar.open('Subscription updated successfully', 'Close', { duration: 3000 });
        this.loadBillingHistory();
      },
      error: (error) => {
        console.error('Error updating subscription:', error);
        this.loading = false;
        this.snackBar.open('Error updating subscription', 'Close', { duration: 3000 });
      }
    });
  }

  openCancelDialog(): void {
    const dialogRef = this.dialog.open(CancelSubscriptionDialogComponent, {
      width: '500px',
      data: { subscription: this.currentSubscription }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cancelSubscription(result.immediately);
      }
    });
  }

  private cancelSubscription(immediately: boolean): void {
    if (!this.currentSubscription) return;

    this.loading = true;
    this.subscriptionService.cancelSubscription(this.currentSubscription.id, immediately).subscribe({
      next: (subscription) => {
        this.currentSubscription = subscription;
        this.loading = false;
        const message = immediately 
          ? 'Subscription canceled immediately' 
          : 'Subscription will cancel at period end';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error canceling subscription:', error);
        this.loading = false;
        this.snackBar.open('Error canceling subscription', 'Close', { duration: 3000 });
      }
    });
  }

  reactivateSubscription(): void {
    if (!this.currentSubscription) return;

    this.loading = true;
    this.subscriptionService.reactivateSubscription(this.currentSubscription.id).subscribe({
      next: (subscription) => {
        this.currentSubscription = subscription;
        this.loading = false;
        this.snackBar.open('Subscription reactivated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error reactivating subscription:', error);
        this.loading = false;
        this.snackBar.open('Error reactivating subscription', 'Close', { duration: 3000 });
      }
    });
  }

  downloadInvoice(invoiceId: string): void {
    this.subscriptionService.downloadInvoice(invoiceId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoiceId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading invoice:', error);
        this.snackBar.open('Error downloading invoice', 'Close', { duration: 3000 });
      }
    });
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'active': 'primary',
      'trialing': 'accent',
      'past_due': 'warn',
      'canceled': 'basic',
      'incomplete': 'warn'
    };
    return colors[status] || 'basic';
  }
}
