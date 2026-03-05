import { of, throwError } from 'rxjs';
import {
  AttorneyDashboardComponent,
  KanbanCase,
} from './attorney-dashboard.component';

// -----------------------------------------------------------------------
// Direct unit tests — no TestBed needed for pure logic methods
// -----------------------------------------------------------------------

function makeComponent() {
  const caseServiceSpy = {
    getMyCases: vi.fn().mockReturnValue(of({ data: [] })),
    updateCase: vi.fn().mockReturnValue(of({})),
    acceptCase: vi.fn().mockReturnValue(of({})),
    declineCase: vi.fn().mockReturnValue(of({})),
  };
  const authServiceSpy = { currentUserValue: { id: 'u1', role: 'attorney' } };
  const dialogSpy = { open: vi.fn() };
  const routerSpy = { navigate: vi.fn() };

  const component = new AttorneyDashboardComponent(
    caseServiceSpy as any,
    authServiceSpy as any,
    dialogSpy as any,
    routerSpy as any,
  );

  return { component, caseServiceSpy, routerSpy };
}

describe('AttorneyDashboardComponent (unit)', () => {
  // -------------------------------------------------------------------
  // getPriorityColor()
  // -------------------------------------------------------------------
  it('getPriorityColor returns red for high priority', () => {
    const { component } = makeComponent();
    expect(component.getPriorityColor('high')).toBe('#f44336');
  });

  it('getPriorityColor returns orange for medium priority', () => {
    const { component } = makeComponent();
    expect(component.getPriorityColor('medium')).toBe('#ff9800');
  });

  it('getPriorityColor returns green for low priority', () => {
    const { component } = makeComponent();
    expect(component.getPriorityColor('low')).toBe('#4caf50');
  });

  it('getPriorityColor returns grey for unknown priority', () => {
    const { component } = makeComponent();
    expect(component.getPriorityColor('unknown')).toBe('#9e9e9e');
  });

  // -------------------------------------------------------------------
  // populateKanbanBoard()
  // -------------------------------------------------------------------
  it('populateKanbanBoard distributes assigned cases into "new" column', () => {
    const { component } = makeComponent();
    component.populateKanbanBoard([
      { caseId: 'c1', driverName: 'John', violationType: 'Speeding', violationDate: '2026-01-01', status: 'assigned' },
    ]);
    const newCol = component.kanbanColumns.find(c => c.id === 'new');
    expect(newCol!.cases).toHaveLength(1);
    expect(newCol!.cases[0].caseId).toBe('c1');
  });

  it('populateKanbanBoard distributes reviewing cases into "reviewing" column', () => {
    const { component } = makeComponent();
    component.populateKanbanBoard([
      { caseId: 'c2', driverName: 'Jane', violationType: 'HOS', violationDate: '2026-01-01', status: 'reviewing' },
    ]);
    const col = component.kanbanColumns.find(c => c.id === 'reviewing');
    expect(col!.cases).toHaveLength(1);
  });

  it('populateKanbanBoard resets columns before repopulating', () => {
    const { component } = makeComponent();
    // Add something to a column first
    component.kanbanColumns[0].cases.push({ caseId: 'old' } as KanbanCase);
    component.populateKanbanBoard([]);
    expect(component.kanbanColumns.every(c => c.cases.length === 0)).toBe(true);
  });

  // -------------------------------------------------------------------
  // openCaseDetails()
  // -------------------------------------------------------------------
  it('openCaseDetails navigates to /attorney/cases/:caseId', () => {
    const { component, routerSpy } = makeComponent();
    component.openCaseDetails({ caseId: 'case-1' } as KanbanCase);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/attorney/cases', 'case-1']);
  });

  // -------------------------------------------------------------------
  // toggleTemplatesSidebar()
  // -------------------------------------------------------------------
  it('toggleTemplatesSidebar flips showTemplatesSidebar', () => {
    const { component } = makeComponent();
    expect(component.showTemplatesSidebar).toBe(true);
    component.toggleTemplatesSidebar();
    expect(component.showTemplatesSidebar).toBe(false);
    component.toggleTemplatesSidebar();
    expect(component.showTemplatesSidebar).toBe(true);
  });

  // -------------------------------------------------------------------
  // loadPendingCases()
  // -------------------------------------------------------------------
  it('loadPendingCases filters cases with assigned_to_attorney status', () => {
    const { component, caseServiceSpy } = makeComponent();
    caseServiceSpy.getMyCases.mockReturnValue(
      of({
        data: [
          { id: 'c1', status: 'assigned_to_attorney' },
          { id: 'c2', status: 'reviewing' },
        ],
      }),
    );
    component.ngOnInit();
    expect(component.pendingCases).toHaveLength(1);
    expect(component.pendingCases[0].id).toBe('c1');
    component.ngOnDestroy();
  });

  // -------------------------------------------------------------------
  // acceptCase() / declineCase()
  // -------------------------------------------------------------------
  it('acceptCase calls caseService.acceptCase and removes case from pendingCases', () => {
    const { component, caseServiceSpy } = makeComponent();
    caseServiceSpy.getMyCases.mockReturnValue(of({ data: [{ id: 'c1', status: 'assigned_to_attorney' }] }));
    component.ngOnInit();
    component.acceptCase('c1');
    expect(caseServiceSpy.acceptCase).toHaveBeenCalledWith('c1');
    expect(component.pendingCases.find((c: any) => c.id === 'c1')).toBeUndefined();
    component.ngOnDestroy();
  });

  it('declineCase calls caseService.declineCase and removes case from pendingCases', () => {
    const { component, caseServiceSpy } = makeComponent();
    caseServiceSpy.getMyCases.mockReturnValue(of({ data: [{ id: 'c2', status: 'assigned_to_attorney' }] }));
    component.ngOnInit();
    component.declineCase('c2');
    expect(caseServiceSpy.declineCase).toHaveBeenCalledWith('c2');
    expect(component.pendingCases.find((c: any) => c.id === 'c2')).toBeUndefined();
    component.ngOnDestroy();
  });

  it('declineCase clears processingCaseId on error', () => {
    const { component, caseServiceSpy } = makeComponent();
    caseServiceSpy.getMyCases.mockReturnValue(of({ data: [] }));
    caseServiceSpy.declineCase.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    component.declineCase('c3');
    expect(component.processingCaseId).toBeNull();
    component.ngOnDestroy();
  });
});
