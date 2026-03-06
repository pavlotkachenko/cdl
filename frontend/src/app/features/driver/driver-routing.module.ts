import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DriverDashboardComponent } from './dashboard/driver-dashboard.component';
import { SubmitTicketComponent } from './submit-ticket/submit-ticket.component'; 
import { TicketsComponent } from './tickets/tickets.component';
import { ProfileComponent } from './profile/profile.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { NotificationPreferencesComponent } from './settings/notification-preferences/notification-preferences.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { LayoutComponent } from '../../core/layout/layout.component';
import { CaseDetailComponent } from './case-detail/case-detail.component';
import { HelpComponent } from './help/help.component';
import { ContactComponent } from './contact/contact.component';
import { DocumentsComponent } from './documents/documents.component';
//import { MessagesComponent } from './features/driver/messages/messages.component';


import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DriverDashboardComponent
      },
      {
        path: 'tickets',
        component: TicketsComponent
      },
      {
        path: 'tickets/:id',
        component: CaseDetailComponent
      },
      {
        path: 'cases/:caseId',
        component: CaseDetailComponent
      },
      {
        path: 'cases/:caseId/attorneys',
        loadComponent: () => import('./attorney-recommendation/attorney-recommendation.component')
          .then(m => m.AttorneyRecommendationComponent)
      },
      {
        path: 'cases/:caseId/pay',
        loadComponent: () => import('./case-payment/case-payment.component')
          .then(m => m.CasePaymentComponent)
      },
      {
        path: 'cases/:caseId/payment-success',
        loadComponent: () => import('./payment-success/payment-success.component')
          .then(m => m.PaymentSuccessComponent)
      },
      {
        path: 'submit-ticket',
        component: SubmitTicketComponent
      },
      {
        path: 'analytics',
        component: AnalyticsComponent
      },
      // === MERGED MESSAGES ROUTES ===
      {
        path: 'messages',
        loadComponent: () => import('./messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'messages/:conversationId',
        loadComponent: () => import('./messages/messages.component').then(m => m.MessagesComponent)
      },
      // ==============================
      {
        path: 'notifications',
        component: NotificationsComponent
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'settings/notifications',
        component: NotificationPreferencesComponent
      },
      {
        path: 'documents',
        component: DocumentsComponent
      },
      {
        path: 'help',
        component: HelpComponent
      },
      {
        path: 'contact',
        component: ContactComponent
      },
      {
        path: 'payments',
        loadComponent: () => import('../shared/payment/payment-history/payment-history.component').then(m => m.PaymentHistoryComponent)
      },
      {
        path: 'settings',
        redirectTo: 'settings/notifications'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DriverRoutingModule { }