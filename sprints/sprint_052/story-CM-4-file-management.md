# Story CM-4: Operator File Management (Upload, List, Preview, Delete)

## Status: TODO

## Priority: P0

## Depends On: CM-1 (document upload authorization fix)

## Description
Build a file management section on the case detail page where operators can view existing
attachments, upload new files, preview images/PDFs, download files, and delete their own
uploads. The backend already has the required endpoints (`/api/files/upload`,
`/api/files/case/:caseId`, `/api/cases/:id/documents`); this story builds the frontend
UI and ensures the operator authorization from CM-1 is in place.

### User Story
> As an **operator**, I want to upload supporting documents (ticket photos, court papers,
> correspondence) to a case, view all attached files, preview images inline, and download
> or delete files, so the case record is complete.

## Backend Dependencies (from CM-1 + existing)

| Endpoint | Method | Purpose | Operator Access |
|----------|--------|---------|----------------|
| `/api/files/upload` | POST | Upload file to case (multipart, `case_id` in body) | ✅ Already works (checks `assigned_operator_id`) |
| `/api/files/case/:caseId` | GET | List all files for a case | ✅ Authenticated |
| `/api/files/:id` | GET | File details | ✅ Authenticated |
| `/api/files/:id/download` | GET | Get signed download URL | ✅ Authenticated |
| `/api/files/:id` | DELETE | Delete file | ✅ Authenticated (checks uploader) |
| `/api/cases/:id/documents` | POST | Upload via case route | ❌ → Fixed in CM-1 |
| `/api/cases/:id/documents` | GET | List via case route (with signed URLs) | ✅ canAccessCase |

**Decision:** Use `/api/cases/:id/documents` for listing (returns signed URLs) and
`/api/files/upload` for uploads (already supports operator). This avoids duplicating
the signed URL logic.

## Frontend Changes

### New Component: `FileManagerComponent`
**Path:** `frontend/src/app/features/operator/file-manager/file-manager.component.ts`

**Inputs:**
- `caseId = input.required<string>()`
- `readonly = input<boolean>(false)` — hides upload/delete for paralegal role

**Signals:**
- `files = signal<CaseFile[]>([])` — loaded files
- `loading = signal(true)`
- `uploading = signal(false)`
- `uploadProgress = signal(0)` — 0–100 for progress bar
- `previewFile = signal<CaseFile | null>(null)` — file being previewed
- `error = signal('')`

**Template sections:**

1. **Header:** "Attachments" title + file count badge + "Upload" button

2. **Upload zone** (visible when not readonly):
   - Drag-and-drop area with dashed border, icon, and "Drag files here or click to browse"
   - Accepted types: JPEG, PNG, PDF, HEIC (matches backend `fileFilter`)
   - Max 10MB per file (matches backend multer limit)
   - After drop/select: show file name + size + thumbnail + progress bar
   - Upload calls `POST /api/files/upload` with `FormData` containing `case_id` and `ticket` file
   - On success: prepend to `files` signal, show snackbar
   - On error: show error message below upload zone

3. **File list** — grid of file cards (2 columns on desktop, 1 on mobile):
   - Each card shows:
     - Thumbnail (image preview for JPG/PNG, PDF icon for PDFs, generic icon for others)
     - File name (truncated with tooltip for long names)
     - File type badge (e.g., "PDF", "JPG")
     - Upload date (relative: "2 hours ago")
     - Uploader name (if available from `uploaded_by` join)
     - Actions row: "Preview" button, "Download" button, "Delete" button (only for own uploads)
   - Empty state: "No files attached to this case"

4. **Preview overlay** (triggered by "Preview" button):
   - For images: full-screen overlay with the image, zoom controls, close button
   - For PDFs: embedded `<iframe>` or `<object>` with the signed URL
   - For unsupported types: "Preview not available — click Download"
   - Close on Escape key or overlay click
   - **Accessibility:** focus trapped in overlay, close button focused on open

5. **Delete confirmation:**
   - MatDialog: "Delete [filename]? This cannot be undone."
   - Confirm deletes via `DELETE /api/files/:id`
   - Removes from local `files` signal on success

**Drag-and-drop implementation:**
```typescript
onDragOver(event: DragEvent) {
  event.preventDefault();
  this.dragActive.set(true);
}
onDragLeave() { this.dragActive.set(false); }
onDrop(event: DragEvent) {
  event.preventDefault();
  this.dragActive.set(false);
  const files = event.dataTransfer?.files;
  if (files?.length) this.uploadFile(files[0]);
}
```

### Service Methods
In `case.service.ts` or a new `file.service.ts`:
```typescript
getCaseFiles(caseId: string): Observable<CaseFile[]>
uploadFile(caseId: string, file: File): Observable<CaseFile>
downloadFile(fileId: string): Observable<{ signedUrl: string }>
deleteFile(fileId: string): Observable<void>
```

### Integration with Case Detail Page
The `FileManagerComponent` is placed as a section on the case detail page (from OC-1),
below the case info/edit form and above the activity log.

## Acceptance Criteria
- [ ] File list loads from `GET /api/cases/:id/documents` on component init
- [ ] Each file shows thumbnail, name, type badge, date, and action buttons
- [ ] Empty state shows "No files attached" message
- [ ] Drag-and-drop upload zone accepts JPEG, PNG, PDF, HEIC files
- [ ] File picker (click to browse) works as fallback
- [ ] Files over 10MB rejected client-side with error message before upload
- [ ] Upload shows progress bar and adds file to list on success
- [ ] "Preview" opens full-screen overlay for images, embedded viewer for PDFs
- [ ] Preview overlay closes on Escape key and overlay click
- [ ] "Download" opens signed URL in new tab or triggers browser download
- [ ] "Delete" shows confirmation dialog, removes file on confirm
- [ ] Delete button only visible for files uploaded by the current operator
- [ ] Upload button hidden when `readonly` input is true
- [ ] All text uses TranslateModule with `OPR.FILES.*` keys
- [ ] WCAG 2.1 AA: upload zone keyboard accessible (`Enter`/`Space` to open picker),
  focus trapped in preview overlay, delete confirmation focusable
- [ ] Responsive: 2-column grid on ≥768px, single column below
- [ ] Build succeeds with no errors

## Test Coverage

### Frontend Tests (`file-manager.component.spec.ts`)
- Renders loading state initially
- Displays file cards after load
- Shows "No files attached" when empty
- Upload zone visible when not readonly
- Upload zone hidden when readonly is true
- File input accepts correct MIME types
- Drag-and-drop sets dragActive state
- Upload calls service with FormData
- Successful upload prepends file to list
- Preview overlay opens for image file
- Preview overlay closes on Escape key
- Download button calls service
- Delete button only shown for own uploads
- Delete confirmation dialog appears on click
- Confirmed delete removes file from list

### Frontend Tests (`file.service.spec.ts`)
- `getCaseFiles` calls `GET /api/cases/:id/documents`
- `uploadFile` sends multipart POST to `/api/files/upload`
- `downloadFile` calls `GET /api/files/:id/download`
- `deleteFile` calls `DELETE /api/files/:id`
