import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

// Define interfaces locally
export interface RecentTicket {
  id: string;
  ticketNumber?: string;
  type?: string;
  status: string;
  date: Date | string;
  location?: string;
  citationNumber?: string;
}

export interface Ticket extends RecentTicket {
  description: string;
  courtDate?: Date;
  documents: Document[];
  statusHistory: StatusHistory[];
  assignedAttorney?: string;
  resolution?: string;
}

export interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface StatusHistory {
  status: string;
  timestamp: Date;
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {

  // Mock tickets data
  private mockTickets: Ticket[] = [
    {
      id: 'tck-001',
      ticketNumber: 'TCK-001',
      type: 'Speeding',
      status: 'under_review',
      date: new Date('2026-02-05'),
      location: 'Los Angeles, CA',
      citationNumber: 'CA-SPD-123456',
      description: 'Speeding violation - 75 mph in a 55 mph zone on I-5',
      courtDate: new Date('2026-03-15'),
      documents: [
        {
          id: 'doc-001',
          fileName: 'citation-copy.pdf',
          fileType: 'application/pdf',
          fileSize: 245000,
          uploadedAt: new Date('2026-02-05')
        }
      ],
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date('2026-02-05T10:30:00'),
          note: 'Ticket submitted by driver'
        },
        {
          status: 'under_review',
          timestamp: new Date('2026-02-05T14:15:00'),
          note: 'Assigned to legal team for review'
        }
      ],
      assignedAttorney: 'Sarah Johnson'
    },
    {
      id: 'tck-002',
      ticketNumber: 'TCK-002',
      type: 'CDL Violation',
      status: 'in_progress',
      date: new Date('2026-02-03'),
      location: 'Sacramento, CA',
      citationNumber: 'CA-CDL-789012',
      description: 'Failure to maintain proper logbook records',
      documents: [
        {
          id: 'doc-002',
          fileName: 'logbook-screenshot.jpg',
          fileType: 'image/jpeg',
          fileSize: 189000,
          uploadedAt: new Date('2026-02-03')
        }
      ],
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date('2026-02-03T09:00:00'),
          note: 'Ticket submitted'
        },
        {
          status: 'under_review',
          timestamp: new Date('2026-02-03T11:30:00')
        },
        {
          status: 'in_progress',
          timestamp: new Date('2026-02-04T08:00:00'),
          note: 'Attorney working on defense strategy'
        }
      ],
      assignedAttorney: 'Michael Chen'
    },
    {
      id: 'tck-003',
      ticketNumber: 'TCK-003',
      type: 'Traffic Violation',
      status: 'resolved',
      date: new Date('2026-01-28'),
      location: 'Phoenix, AZ',
      citationNumber: 'AZ-TRF-345678',
      description: 'Improper lane change on Highway 10',
      resolution: 'Case dismissed - officer did not appear in court',
      documents: [
        {
          id: 'doc-003',
          fileName: 'citation.pdf',
          fileType: 'application/pdf',
          fileSize: 156000,
          uploadedAt: new Date('2026-01-28')
        },
        {
          id: 'doc-004',
          fileName: 'dashcam-footage.mp4',
          fileType: 'video/mp4',
          fileSize: 5420000,
          uploadedAt: new Date('2026-01-28')
        }
      ],
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date('2026-01-28T14:00:00')
        },
        {
          status: 'under_review',
          timestamp: new Date('2026-01-29T09:00:00')
        },
        {
          status: 'in_progress',
          timestamp: new Date('2026-01-30T10:00:00')
        },
        {
          status: 'resolved',
          timestamp: new Date('2026-02-07T15:30:00'),
          note: 'Case dismissed successfully'
        }
      ],
      assignedAttorney: 'Robert Martinez'
    },
    {
      id: 'tck-004',
      ticketNumber: 'TCK-004',
      type: 'Parking',
      status: 'submitted',
      date: new Date('2026-02-07'),
      location: 'San Diego, CA',
      citationNumber: 'SD-PRK-901234',
      description: 'Commercial vehicle parked in residential area overnight',
      documents: [],
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date('2026-02-07T16:45:00')
        }
      ]
    },
    {
      id: 'tck-005',
      ticketNumber: 'TCK-005',
      type: 'Weight Station',
      status: 'submitted',
      date: new Date('2026-02-08'),
      location: 'Bakersfield, CA',
      citationNumber: 'CA-WGT-567890',
      description: 'Minor overweight violation - 2,000 lbs over limit',
      documents: [
        {
          id: 'doc-005',
          fileName: 'weigh-ticket.pdf',
          fileType: 'application/pdf',
          fileSize: 98000,
          uploadedAt: new Date('2026-02-08')
        }
      ],
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date('2026-02-08T11:20:00')
        }
      ]
    }
  ];

  constructor() {}

  /**
   * Get recent tickets (limit to specified number)
   */
  getRecentTickets(limit: number = 5): Observable<RecentTicket[]> {
    const recentTickets = this.mockTickets
      .slice(0, limit)
      .map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        type: ticket.type,
        status: ticket.status,
        date: ticket.date,
        location: ticket.location,
        citationNumber: ticket.citationNumber
      }));
    
    return of(recentTickets).pipe(delay(700));
  }

  /**
   * Get all tickets with optional filters
   */
  getAllTickets(filters?: {
    status?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Observable<Ticket[]> {
    let filteredTickets = [...this.mockTickets];

    if (filters) {
      if (filters.status) {
        filteredTickets = filteredTickets.filter(t => t.status === filters.status);
      }
      if (filters.type) {
        filteredTickets = filteredTickets.filter(t => t.type === filters.type);
      }
      if (filters.dateFrom) {
        filteredTickets = filteredTickets.filter(t => new Date(t.date) >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        filteredTickets = filteredTickets.filter(t => new Date(t.date) <= filters.dateTo!);
      }
    }

    return of(filteredTickets).pipe(delay(800));
  }

  /**
   * Get ticket by ID
   */
  getTicketById(id: string): Observable<Ticket | null> {
    const ticket = this.mockTickets.find(t => t.id === id);
    return of(ticket || null).pipe(delay(600));
  }

  /**
   * Create a new ticket
   */
  createTicket(ticketData: Partial<Ticket>): Observable<Ticket> {
    const newTicket: Ticket = {
      id: `tck-${Date.now()}`,
      ticketNumber: `TCK-${String(this.mockTickets.length + 1).padStart(3, '0')}`,
      type: ticketData.type || 'Other',
      status: 'submitted',
      date: new Date(),
      location: ticketData.location || '',
      description: ticketData.description || '',
      documents: [],
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date(),
          note: 'Ticket submitted by driver'
        }
      ],
      ...ticketData
    } as Ticket;

    this.mockTickets.unshift(newTicket);
    return of(newTicket).pipe(delay(1000));
  }

  /**
   * Update ticket status
   */
  updateTicketStatus(id: string, status: string, note?: string): Observable<Ticket | null> {
    const ticket = this.mockTickets.find(t => t.id === id);
    
    if (ticket) {
      ticket.status = status;
      ticket.statusHistory.push({
        status,
        timestamp: new Date(),
        note
      });
    }

    return of(ticket || null).pipe(delay(800));
  }

  /**
   * Delete/Cancel ticket
   */
  deleteTicket(id: string): Observable<boolean> {
    const index = this.mockTickets.findIndex(t => t.id === id);
    
    if (index !== -1) {
      this.mockTickets.splice(index, 1);
      return of(true).pipe(delay(600));
    }

    return of(false).pipe(delay(600));
  }
}