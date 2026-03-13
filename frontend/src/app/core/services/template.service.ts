import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Template {
  id: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private apiUrl = '/api/templates';

  constructor(private http: HttpClient) {}

  getTemplates(category?: string): Observable<any> {
    const params: Record<string, string> = {};
    if (category) params['category'] = category;
    return this.http.get<any>(this.apiUrl, { params });
  }

  getTemplatesByCategory(category: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/category/${category}`);
  }

  getTemplate(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  renderForCase(templateId: string, caseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${templateId}/render/${caseId}`);
  }
}
