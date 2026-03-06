# Story CA-3 — Frontend: CSV Export

**Epic:** Carrier Fleet Analytics
**Sprint:** 021
**Priority:** MEDIUM
**Status:** DONE

## User Story

As Sarah,
I want to download a CSV of all my fleet's cases,
so I can attach it to DOT audit submissions without manual data entry.

## Acceptance Criteria

- [ ] "Export CSV" button on the analytics page
- [ ] Clicking triggers `GET /api/carriers/me/export?format=csv`
- [ ] Browser downloads `fleet-report.csv` automatically
- [ ] Button shows loading state while downloading
- [ ] Error snackBar if download fails

## Files to Modify

- `frontend/src/app/features/carrier/analytics/carrier-analytics.component.ts` — `exportCsv()` method
- `frontend/src/app/core/services/carrier.service.ts` — `exportCsv()` returns `Observable<Blob>`

## Key Implementation Notes

```typescript
exportCsv(): Observable<Blob> {
  return this.http.get(`${this.api}/export?format=csv`, { responseType: 'blob' });
}
```

Trigger download in component:
```typescript
exportCsv(): void {
  this.exporting.set(true);
  this.carrierService.exportCsv().subscribe({
    next: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'fleet-report.csv'; a.click();
      URL.revokeObjectURL(url);
      this.exporting.set(false);
    },
    error: () => { this.exporting.set(false); this.snackBar.open('Export failed', 'Close', { duration: 3000 }); }
  });
}
```
