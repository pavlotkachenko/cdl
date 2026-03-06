import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserPreferences {
  sms_opt_in: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users/me/preferences`;

  /**
   * Update SMS opt-in preference for the current user.
   */
  updateSmsOptIn(value: boolean): Observable<{ preferences: UserPreferences }> {
    return this.http.patch<{ preferences: UserPreferences }>(this.apiUrl, { sms_opt_in: value });
  }
}
