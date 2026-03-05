import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  AttorneyRecommendationComponent,
  AttorneyCard,
} from './attorney-recommendation.component';
import { CaseService } from '../../../core/services/case.service';

const CASE_ID = 'case-99';

const MOCK_ATTORNEYS: AttorneyCard[] = [
  {
    id: 'a1',
    fullName: 'Alice Smith',
    rating: 5,
    successRate: 0.92,
    specializations: ['CDL', 'Traffic'],
    isRecommended: true,
  },
  {
    id: 'a2',
    fullName: 'Bob Jones',
    rating: 4,
    successRate: 0.78,
    specializations: ['Traffic'],
    isRecommended: false,
  },
];

describe('AttorneyRecommendationComponent', () => {
  let fixture: ComponentFixture<AttorneyRecommendationComponent>;
  let component: AttorneyRecommendationComponent;
  let caseServiceSpy: {
    getCaseById: ReturnType<typeof vi.fn>;
    getRecommendedAttorneys: ReturnType<typeof vi.fn>;
    selectAttorney: ReturnType<typeof vi.fn>;
  };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  async function init(attorneys: AttorneyCard[] = MOCK_ATTORNEYS) {
    caseServiceSpy = {
      getCaseById: vi.fn().mockReturnValue(of({ data: { case_number: 'CDL-099' } })),
      getRecommendedAttorneys: vi.fn().mockReturnValue(of({ attorneys })),
      selectAttorney: vi.fn().mockReturnValue(of({ message: 'Selected' })),
    };

    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AttorneyRecommendationComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { caseId: CASE_ID } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AttorneyRecommendationComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('loads attorneys on init via getRecommendedAttorneys()', async () => {
    await init();
    expect(caseServiceSpy.getRecommendedAttorneys).toHaveBeenCalledWith(CASE_ID);
    expect(component.attorneys()).toHaveLength(2);
    expect(component.loading()).toBe(false);
  });

  it('renders recommended badge for isRecommended attorney', async () => {
    await init();
    const badge: HTMLElement | null = fixture.nativeElement.querySelector('.recommended-badge');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('RECOMMENDED');
  });

  it('shows empty state when attorney list is empty', async () => {
    await init([]);
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Finding Your Attorney');
  });

  it('selectAttorney() calls caseService.selectAttorney() and navigates on success', async () => {
    await init();
    component.selectAttorney('a1');
    expect(caseServiceSpy.selectAttorney).toHaveBeenCalledWith(CASE_ID, 'a1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/cases', CASE_ID]);
  });

  it('selectAttorney() shows error snackbar and clears selecting on failure', async () => {
    await init();
    caseServiceSpy.selectAttorney.mockReturnValue(throwError(() => new Error('Server error')));
    component.selectAttorney('a2');
    expect(component.selecting()).toBeNull();
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      expect.anything(),
      expect.any(Object),
    );
  });

  it('goBack() navigates to /driver/dashboard', async () => {
    await init();
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
  });
});
