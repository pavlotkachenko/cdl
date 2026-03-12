import {
  Component, ChangeDetectionStrategy, signal, computed,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'court_hearing' | 'client_meeting' | 'deposition' | 'filing_deadline';
  date: string;
  time: string;
  location?: string;
  caseNumber?: string;
  clientName?: string;
  notes?: string;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const EVENT_TYPE_COLORS: Record<CalendarEvent['type'], string> = {
  court_hearing: '#ef5350',
  client_meeting: '#42a5f5',
  deposition: '#ab47bc',
  filing_deadline: '#ffa726',
};

const EVENT_TYPE_LABELS: Record<CalendarEvent['type'], string> = {
  court_hearing: 'Court Hearing',
  client_meeting: 'Client Meeting',
  deposition: 'Deposition',
  filing_deadline: 'Filing Deadline',
};

function buildMockEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const nextMonth = month + 1;

  return [
    // 6 court hearings
    {
      id: 'evt-01',
      title: 'State v. Martinez — Speeding',
      type: 'court_hearing',
      date: new Date(year, month, 5).toISOString(),
      time: '09:00 AM',
      location: 'Harris County Courthouse, Rm 304',
      caseNumber: 'CDL-2026-04821',
      clientName: 'Miguel Martinez',
    },
    {
      id: 'evt-02',
      title: 'State v. Johnson — Overweight Load',
      type: 'court_hearing',
      date: new Date(year, month, 12).toISOString(),
      time: '10:30 AM',
      location: 'Cook County Circuit Court, Rm 1201',
      caseNumber: 'CDL-2026-05134',
      clientName: 'Derek Johnson',
    },
    {
      id: 'evt-03',
      title: 'State v. Petrov — Logbook Violation',
      type: 'court_hearing',
      date: new Date(year, month, 18).toISOString(),
      time: '01:30 PM',
      location: 'Miami-Dade Justice Building, Rm 602',
      caseNumber: 'CDL-2026-05299',
      clientName: 'Ivan Petrov',
    },
    {
      id: 'evt-04',
      title: 'State v. Nguyen — Lane Deviation',
      type: 'court_hearing',
      date: new Date(year, month, 24).toISOString(),
      time: '09:30 AM',
      location: 'Dallas County Courthouse, Rm 410',
      caseNumber: 'CDL-2026-05412',
      clientName: 'Tran Nguyen',
    },
    {
      id: 'evt-05',
      title: 'State v. Okafor — DOT Inspection Failure',
      type: 'court_hearing',
      date: new Date(year, nextMonth, 3).toISOString(),
      time: '11:00 AM',
      location: 'Fulton County Superior Court, Rm 8A',
      caseNumber: 'CDL-2026-05578',
      clientName: 'Emeka Okafor',
    },
    {
      id: 'evt-06',
      title: 'State v. Reyes — Reckless Driving',
      type: 'court_hearing',
      date: new Date(year, nextMonth, 15).toISOString(),
      time: '02:00 PM',
      location: 'Maricopa County Court, Rm 203',
      caseNumber: 'CDL-2026-05690',
      clientName: 'Carlos Reyes',
    },
    // 4 client meetings
    {
      id: 'evt-07',
      title: 'Initial Consultation — Sarah Kim',
      type: 'client_meeting',
      date: new Date(year, month, 7).toISOString(),
      time: '02:00 PM',
      location: 'Office — Conference Room B',
      clientName: 'Sarah Kim',
      notes: 'New CDL speeding case intake',
    },
    {
      id: 'evt-08',
      title: 'Case Review — James Porter',
      type: 'client_meeting',
      date: new Date(year, month, 14).toISOString(),
      time: '03:30 PM',
      location: 'Office — Conference Room A',
      caseNumber: 'CDL-2026-04950',
      clientName: 'James Porter',
      notes: 'Review plea options before trial',
    },
    {
      id: 'evt-09',
      title: 'Follow-Up — Lisa Tran',
      type: 'client_meeting',
      date: new Date(year, month, 22).toISOString(),
      time: '10:00 AM',
      location: 'Virtual — Zoom',
      caseNumber: 'CDL-2026-05100',
      clientName: 'Lisa Tran',
    },
    {
      id: 'evt-10',
      title: 'Pre-Trial Prep — Derek Johnson',
      type: 'client_meeting',
      date: new Date(year, nextMonth, 8).toISOString(),
      time: '04:00 PM',
      location: 'Office — Conference Room A',
      caseNumber: 'CDL-2026-05134',
      clientName: 'Derek Johnson',
    },
    // 3 depositions
    {
      id: 'evt-11',
      title: 'Deposition — Officer R. Chen',
      type: 'deposition',
      date: new Date(year, month, 9).toISOString(),
      time: '10:00 AM',
      location: 'Court Reporter Office, 200 Main St',
      caseNumber: 'CDL-2026-04821',
      notes: 'Arresting officer deposition for Martinez case',
    },
    {
      id: 'evt-12',
      title: 'Deposition — DOT Inspector Wallace',
      type: 'deposition',
      date: new Date(year, month, 20).toISOString(),
      time: '01:00 PM',
      location: 'Harris County Annex, Rm 105',
      caseNumber: 'CDL-2026-05578',
      notes: 'DOT inspection report review',
    },
    {
      id: 'evt-13',
      title: 'Deposition — Witness A. Brooks',
      type: 'deposition',
      date: new Date(year, nextMonth, 11).toISOString(),
      time: '09:00 AM',
      location: 'Bexar County Courthouse Annex',
      caseNumber: 'CDL-2026-05690',
    },
    // 2 filing deadlines
    {
      id: 'evt-14',
      title: 'Motion to Suppress — Martinez',
      type: 'filing_deadline',
      date: new Date(year, month, 16).toISOString(),
      time: '05:00 PM',
      caseNumber: 'CDL-2026-04821',
      clientName: 'Miguel Martinez',
      notes: 'File motion to suppress radar evidence',
    },
    {
      id: 'evt-15',
      title: 'Discovery Response — Reyes',
      type: 'filing_deadline',
      date: new Date(year, nextMonth, 6).toISOString(),
      time: '11:59 PM',
      caseNumber: 'CDL-2026-05690',
      clientName: 'Carlos Reyes',
      notes: 'Respond to prosecution discovery request',
    },
  ];
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'app-attorney-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  template: `
    <div class="calendar-page">
      <!-- Header -->
      <header class="cal-header">
        <h1>{{ 'ATT.CALENDAR_TITLE' | translate }}</h1>
        <div class="cal-nav">
          <button
            class="nav-btn"
            (click)="prevMonth()"
            [attr.aria-label]="'ATT.PREV_MONTH' | translate"
          >
            &laquo;
          </button>
          <button class="today-btn" (click)="goToday()">
            {{ 'ATT.TODAY' | translate }}
          </button>
          <span class="month-label" aria-live="polite">{{ monthYearLabel() }}</span>
          <button
            class="nav-btn"
            (click)="nextMonth()"
            [attr.aria-label]="'ATT.NEXT_MONTH' | translate"
          >
            &raquo;
          </button>
        </div>
      </header>

      <!-- Calendar Grid (hidden on small screens) -->
      <div class="cal-grid-wrapper" role="grid" [attr.aria-label]="'ATT.CALENDAR_GRID' | translate">
        <div class="cal-grid-header" role="row">
          @for (day of weekdays; track day) {
            <div class="cal-weekday" role="columnheader">{{ day }}</div>
          }
        </div>
        <div class="cal-grid" role="rowgroup">
          @for (day of daysInMonth(); track day.date.toISOString()) {
            <button
              class="cal-day"
              role="gridcell"
              [class.outside]="!day.isCurrentMonth"
              [class.today]="day.isToday"
              [class.selected]="isSelected(day)"
              [attr.aria-label]="dayAriaLabel(day)"
              [attr.aria-current]="day.isToday ? 'date' : null"
              (click)="selectDay(day)"
            >
              <span class="day-number">{{ day.dayNumber }}</span>
              @if (day.events.length > 0) {
                <span class="dot-row">
                  @for (evt of day.events; track evt.id) {
                    <span
                      class="event-dot"
                      [style.background]="eventColor(evt.type)"
                      [attr.aria-label]="eventTypeLabel(evt.type)"
                    ></span>
                  }
                </span>
              }
            </button>
          }
        </div>
      </div>

      <!-- Mobile list view -->
      <div class="mobile-list" role="list" [attr.aria-label]="'ATT.EVENTS_LIST' | translate">
        @for (day of daysWithEvents(); track day.date.toISOString()) {
          <div class="mobile-day-group" role="listitem">
            <h3 class="mobile-day-heading">{{ formatDate(day.date) }}</h3>
            @for (evt of day.events; track evt.id) {
              <div class="event-card-mini">
                <span class="type-dot" [style.background]="eventColor(evt.type)"></span>
                <div class="event-info-mini">
                  <span class="event-title-mini">{{ evt.title }}</span>
                  <span class="event-time-mini">{{ evt.time }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Selected day events -->
      @if (selectedDayEvents().length > 0) {
        <section class="selected-day-section" aria-live="polite">
          <h2>{{ 'ATT.EVENTS_ON' | translate }} {{ formatDate(selectedDay()!) }}</h2>
          @for (evt of selectedDayEvents(); track evt.id) {
            <div class="event-card" [style.border-left-color]="eventColor(evt.type)">
              <div class="event-card-header">
                <span class="type-badge" [style.background]="eventColor(evt.type)">
                  {{ eventTypeLabel(evt.type) }}
                </span>
                <span class="event-time">{{ evt.time }}</span>
              </div>
              <h3 class="event-title">{{ evt.title }}</h3>
              @if (expandedEventId() === evt.id) {
                <div class="event-details-expanded">
                  @if (evt.location) {
                    <p class="event-detail">{{ evt.location }}</p>
                  }
                  @if (evt.caseNumber) {
                    <p class="event-detail case-num">{{ evt.caseNumber }}</p>
                  }
                  @if (evt.clientName) {
                    <p class="event-detail client-name">{{ evt.clientName }}</p>
                  }
                  @if (evt.notes) {
                    <p class="event-notes">{{ evt.notes }}</p>
                  }
                </div>
              }
              <div class="event-actions">
                <button class="btn-event btn-view"
                        [class.btn-active]="expandedEventId() === evt.id"
                        [attr.aria-label]="'View event: ' + evt.title"
                        [attr.aria-expanded]="expandedEventId() === evt.id"
                        (click)="toggleEvent(evt.id)">
                  {{ 'ATT.VIEW_EVENT' | translate }}
                </button>
                <button class="btn-event btn-modify"
                        [attr.aria-label]="'Modify event: ' + evt.title"
                        (click)="toggleEvent(evt.id)">
                  {{ 'ATT.MODIFY_EVENT' | translate }}
                </button>
              </div>
            </div>
          }
        </section>
      }

      <!-- Upcoming Events -->
      <section class="upcoming-section">
        <h2>{{ 'ATT.UPCOMING_EVENTS' | translate }}</h2>
        @for (evt of upcomingEvents(); track evt.id) {
          <div class="event-card" [style.border-left-color]="eventColor(evt.type)">
            <div class="event-card-header">
              <span class="type-badge" [style.background]="eventColor(evt.type)">
                {{ eventTypeLabel(evt.type) }}
              </span>
              <span class="event-time">{{ formatIsoDate(evt.date) }} &middot; {{ evt.time }}</span>
            </div>
            <h3 class="event-title">{{ evt.title }}</h3>
            @if (expandedEventId() === evt.id) {
              <div class="event-details-expanded">
                @if (evt.location) {
                  <p class="event-detail">{{ evt.location }}</p>
                }
                @if (evt.caseNumber) {
                  <p class="event-detail case-num">{{ evt.caseNumber }}</p>
                }
                @if (evt.clientName) {
                  <p class="event-detail client-name">{{ evt.clientName }}</p>
                }
                @if (evt.notes) {
                  <p class="event-notes">{{ evt.notes }}</p>
                }
              </div>
            }
            <div class="event-actions">
              <button class="btn-event btn-view"
                      [class.btn-active]="expandedEventId() === evt.id"
                      [attr.aria-label]="'View event: ' + evt.title"
                      [attr.aria-expanded]="expandedEventId() === evt.id"
                      (click)="toggleEvent(evt.id)">
                {{ 'ATT.VIEW_EVENT' | translate }}
              </button>
              <button class="btn-event btn-modify"
                      [attr.aria-label]="'Modify event: ' + evt.title"
                      (click)="toggleEvent(evt.id)">
                {{ 'ATT.MODIFY_EVENT' | translate }}
              </button>
            </div>
          </div>
        }
        @if (upcomingEvents().length === 0) {
          <p class="no-events">{{ 'ATT.NO_UPCOMING' | translate }}</p>
        }
      </section>

      <!-- Add Event button -->
      <div class="add-event-wrapper">
        <button class="add-event-btn" [attr.aria-label]="'ATT.ADD_EVENT' | translate">
          + {{ 'ATT.ADD_EVENT' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .calendar-page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px 16px;
      font-family: 'Inter', 'Roboto', sans-serif;
    }

    /* Header */
    .cal-header {
      margin-bottom: 24px;
    }
    .cal-header h1 {
      margin: 0 0 12px;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a2e;
    }
    .cal-nav {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .nav-btn {
      background: none;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 1.1rem;
      cursor: pointer;
      color: #333;
      line-height: 1;
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .nav-btn:hover { background: #f0f0f0; }
    .nav-btn:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }
    .today-btn {
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 16px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      min-height: 44px;
    }
    .today-btn:hover { background: #1565c0; }
    .today-btn:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }
    .month-label {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a2e;
      flex: 1;
      text-align: center;
    }

    /* Calendar Grid */
    .cal-grid-wrapper {
      margin-bottom: 24px;
    }
    .cal-grid-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
    .cal-weekday {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      padding: 8px 0;
      letter-spacing: 0.05em;
    }
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-top: 1px solid #e0e0e0;
      border-left: 1px solid #e0e0e0;
    }
    .cal-day {
      background: #fff;
      border: none;
      border-right: 1px solid #e0e0e0;
      border-bottom: 1px solid #e0e0e0;
      min-height: 80px;
      padding: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      font-family: inherit;
      text-align: left;
    }
    .cal-day:hover { background: #e3f2fd; }
    .cal-day:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: -2px;
      z-index: 1;
    }
    .cal-day.outside {
      color: #bbb;
      background: #fafafa;
    }
    .cal-day.outside:hover { background: #f0f4f8; }
    .cal-day.today .day-number {
      background: #1976d2;
      color: #fff;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .cal-day.selected {
      background: #e3f2fd;
      box-shadow: inset 0 0 0 2px #1976d2;
    }
    .day-number {
      font-size: 0.875rem;
      font-weight: 500;
      color: inherit;
    }
    .dot-row {
      display: flex;
      gap: 3px;
      flex-wrap: wrap;
    }
    .event-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }

    /* Mobile list view (hidden by default, shown on small screens) */
    .mobile-list {
      display: none;
      margin-bottom: 24px;
    }
    .mobile-day-group {
      margin-bottom: 16px;
    }
    .mobile-day-heading {
      font-size: 0.875rem;
      font-weight: 600;
      color: #666;
      margin: 0 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e0e0e0;
    }
    .event-card-mini {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
    }
    .type-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .event-info-mini {
      display: flex;
      flex-direction: column;
    }
    .event-title-mini {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1a1a2e;
    }
    .event-time-mini {
      font-size: 0.75rem;
      color: #666;
    }

    /* Selected day section */
    .selected-day-section {
      margin-bottom: 32px;
    }
    .selected-day-section h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 16px;
    }

    /* Event cards */
    .upcoming-section {
      margin-bottom: 32px;
    }
    .upcoming-section h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 16px;
    }
    .event-card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-left: 4px solid #ccc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    .event-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .type-badge {
      display: inline-block;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .event-time {
      font-size: 0.8rem;
      color: #555;
      font-weight: 500;
    }
    .event-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 6px;
    }
    .event-detail {
      font-size: 0.85rem;
      color: #555;
      margin: 2px 0;
    }
    .case-num {
      font-family: 'Roboto Mono', monospace;
      color: #777;
    }
    .client-name {
      font-weight: 500;
    }
    .event-notes {
      font-size: 0.8rem;
      color: #888;
      margin: 6px 0 0;
      font-style: italic;
    }
    .no-events {
      color: #999;
      font-size: 0.875rem;
    }

    /* Event action buttons */
    .event-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .btn-event {
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      min-height: 44px;
      min-width: 44px;
      transition: background 0.2s, opacity 0.2s;
    }
    .btn-event:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }
    .btn-view {
      background: #e3f2fd;
      color: #1565c0;
    }
    .btn-view:hover {
      background: #bbdefb;
    }
    .btn-modify {
      background: #fff3e0;
      color: #e65100;
    }
    .btn-modify:hover {
      background: #ffe0b2;
    }
    .btn-active {
      background: #1565c0;
      color: #fff;
    }
    .btn-active:hover {
      background: #0d47a1;
    }
    .event-details-expanded {
      animation: slideDown 0.2s ease;
      padding-top: 4px;
    }
    @keyframes slideDown {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 200px; }
    }

    /* Add event button */
    .add-event-wrapper {
      text-align: center;
      margin-bottom: 24px;
    }
    .add-event-btn {
      background: #1976d2;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 12px 32px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      min-height: 44px;
      min-width: 44px;
    }
    .add-event-btn:hover { background: #1565c0; }
    .add-event-btn:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }

    /* Responsive: mobile list view */
    @media (max-width: 600px) {
      .cal-grid-wrapper { display: none; }
      .mobile-list { display: block; }
      .cal-header h1 { font-size: 1.25rem; }
      .month-label { font-size: 1rem; }
    }
  `,
})
export class AttorneyCalendarComponent {
  protected readonly weekdays = WEEKDAY_HEADERS;
  private readonly events = signal<CalendarEvent[]>(buildMockEvents());
  protected readonly currentMonth = signal(new Date());
  protected readonly selectedDay = signal<Date | null>(null);
  protected readonly expandedEventId = signal<string | null>(null);

  protected readonly monthYearLabel = computed(() => {
    const d = this.currentMonth();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  protected readonly daysInMonth = computed<CalendarDay[]>(() => {
    const current = this.currentMonth();
    const year = current.getFullYear();
    const month = current.getMonth();
    const today = new Date();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Days from previous month to fill first row
    const prevMonthLast = new Date(year, month, 0);
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLast.getDate() - i);
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        isToday: this.isSameDay(date, today),
        events: this.eventsForDate(date),
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        events: this.eventsForDate(date),
      });
    }

    // Fill remaining cells to complete the last row (up to 42 cells = 6 rows)
    const remainder = days.length % 7;
    if (remainder > 0) {
      const fill = 7 - remainder;
      for (let i = 1; i <= fill; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date,
          dayNumber: i,
          isCurrentMonth: false,
          isToday: this.isSameDay(date, today),
          events: this.eventsForDate(date),
        });
      }
    }

    return days;
  });

  protected readonly daysWithEvents = computed(() => {
    const current = this.currentMonth();
    const year = current.getFullYear();
    const month = current.getMonth();

    return this.daysInMonth()
      .filter(d => d.isCurrentMonth && d.events.length > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  protected readonly selectedDayEvents = computed<CalendarEvent[]>(() => {
    const sel = this.selectedDay();
    if (!sel) return [];
    return this.eventsForDate(sel);
  });

  protected readonly upcomingEvents = computed<CalendarEvent[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return this.events()
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  });

  prevMonth(): void {
    const cur = this.currentMonth();
    this.currentMonth.set(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
    this.selectedDay.set(null);
  }

  nextMonth(): void {
    const cur = this.currentMonth();
    this.currentMonth.set(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
    this.selectedDay.set(null);
  }

  goToday(): void {
    const today = new Date();
    this.currentMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.selectedDay.set(today);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay.set(day.date);
  }

  isSelected(day: CalendarDay): boolean {
    const sel = this.selectedDay();
    return sel !== null && this.isSameDay(day.date, sel);
  }

  toggleEvent(eventId: string): void {
    this.expandedEventId.set(this.expandedEventId() === eventId ? null : eventId);
  }

  eventColor(type: CalendarEvent['type']): string {
    return EVENT_TYPE_COLORS[type];
  }

  eventTypeLabel(type: CalendarEvent['type']): string {
    return EVENT_TYPE_LABELS[type];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('default', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  formatIsoDate(iso: string): string {
    return this.formatDate(new Date(iso));
  }

  dayAriaLabel(day: CalendarDay): string {
    const label = day.date.toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const count = day.events.length;
    if (count > 0) {
      return `${label}, ${count} event${count > 1 ? 's' : ''}`;
    }
    return label;
  }

  private eventsForDate(date: Date): CalendarEvent[] {
    return this.events().filter(e => {
      const eDate = new Date(e.date);
      return this.isSameDay(eDate, date);
    });
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
