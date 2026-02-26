import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_id: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  recommended?: boolean;
}

export interface BillingHistory {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  invoice_url?: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/subscriptions`;
  private currentSubscription$ = new BehaviorSubject<Subscription | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get current user subscription
   */
  getCurrentSubscription(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/current`).pipe(
      tap(subscription => this.currentSubscription$.next(subscription)),
      catchError(error => {
        console.error('Error fetching current subscription:', error);
        throw error;
      })
    );
  }

  /**
   * Get current subscription as observable
   */
  getCurrentSubscription$(): Observable<Subscription | null> {
    return this.currentSubscription$.asObservable();
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/${subscriptionId}`);
  }

  /**
   * Get available subscription plans
   */
  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.apiUrl}/plans`);
  }

  /**
   * Create a new subscription
   */
  createSubscription(priceId: string, paymentMethodId: string): Observable<Subscription> {
    return this.http.post<Subscription>(this.apiUrl, {
      price_id: priceId,
      payment_method_id: paymentMethodId
    }).pipe(
      tap(subscription => this.currentSubscription$.next(subscription))
    );
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  updateSubscription(subscriptionId: string, newPriceId: string): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.apiUrl}/${subscriptionId}`, {
      price_id: newPriceId
    }).pipe(
      tap(subscription => this.currentSubscription$.next(subscription))
    );
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(subscriptionId: string, immediately: boolean = false): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.apiUrl}/${subscriptionId}/cancel`, {
      immediately
    }).pipe(
      tap(subscription => this.currentSubscription$.next(subscription))
    );
  }

  /**
   * Reactivate subscription
   */
  reactivateSubscription(subscriptionId: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.apiUrl}/${subscriptionId}/reactivate`, {});
  }

  /**
   * Get billing history
   */
  getBillingHistory(subscriptionId?: string): Observable<BillingHistory[]> {
    let params = new HttpParams();
    if (subscriptionId) {
      params = params.set('subscription_id', subscriptionId);
    }
    return this.http.get<BillingHistory[]>(`${this.apiUrl}/billing-history`, { params });
  }

  /**
   * Download invoice
   */
  downloadInvoice(invoiceId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/invoices/${invoiceId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Update payment method
   */
  updatePaymentMethod(subscriptionId: string, paymentMethodId: string): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.apiUrl}/${subscriptionId}/payment-method`, {
      payment_method_id: paymentMethodId
    });
  }

  /**
   * Get proration preview
   */
  getProrationPreview(subscriptionId: string, newPriceId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${subscriptionId}/proration-preview`, {
      price_id: newPriceId
    });
  }
}
