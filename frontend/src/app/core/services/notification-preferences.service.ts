import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificationPref {
  type: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private http = inject(HttpClient);
  private apiUrl = '/api/users/me/preferences';

  getPreferences(): Observable<{ preferences: Record<string, boolean> }> {
    return this.http.get<{ preferences: Record<string, boolean> }>(this.apiUrl);
  }

  updatePreference(type: string, channel: string, enabled: boolean): Observable<{ preferences: Record<string, boolean> }> {
    return this.http.patch<{ preferences: Record<string, boolean> }>(this.apiUrl, {
      [`${type}_${channel}`]: enabled,
    });
  }
}
