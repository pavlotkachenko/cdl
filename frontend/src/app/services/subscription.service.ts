import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Subscription {
  id: string;
  user_id: string;
  plan_name?: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'canceling' | 'incomplete';
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  price_per_month?: number;
  customer_type?: string;
  created_at: string;
  // Legacy Stripe fields (may be absent from newer API responses)
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  updated_at?: string;
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

export interface CheckoutResult {
  url: string;
  subscription?: Subscription;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/subscriptions`;
  private currentSubscription$ = new BehaviorSubject<Subscription | null>(null);

  getCurrentSubscription(): Observable<Subscription> {
    return this.http.get<{ subscription: Subscription }>(`${this.apiUrl}/current`).pipe(
      map(r => r.subscription),
      tap(s => this.currentSubscription$.next(s)),
    );
  }

  getPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<{ plans: SubscriptionPlan[] }>(`${this.apiUrl}/plans`).pipe(
      map(r => r.plans),
    );
  }

  createCheckoutSession(priceId: string): Observable<CheckoutResult> {
    return this.http.post<CheckoutResult>(`${this.apiUrl}/checkout`, { price_id: priceId });
  }

  cancelSubscription(subscriptionId: string, immediately = false): Observable<Subscription> {
    return this.http.post<{ subscription: Subscription }>(
      `${this.apiUrl}/${subscriptionId}/cancel`, { immediately },
    ).pipe(
      map(r => r.subscription),
      tap(s => this.currentSubscription$.next(s)),
    );
  }

  /** Kept for backwards compatibility with existing code. */
  updateSubscription(subscriptionId: string, newPriceId: string): Observable<Subscription> {
    return this.http.put<{ subscription: Subscription }>(`${this.apiUrl}/${subscriptionId}`, {
      price_id: newPriceId,
    }).pipe(map(r => r.subscription));
  }

  getCurrentSubscription$(): Observable<Subscription | null> {
    return this.currentSubscription$.asObservable();
  }
}
