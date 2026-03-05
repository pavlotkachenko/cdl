'use strict';

// Build the storage mock before requiring the service
const mockStorage = {
  from: jest.fn()
};

jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: mockStorage
  }
}));

const { supabase } = require('../config/supabase');
const {
  uploadToSupabase,
  generateSignedUrl,
  getPublicUrl,
  deleteFromSupabase,
  deleteMultipleFiles,
  STORAGE_BUCKET
} = require('../services/storage.service');

// --- Storage chain mock ---
const storageChain = {
  upload: jest.fn(),
  createSignedUrl: jest.fn(),
  getPublicUrl: jest.fn(),
  remove: jest.fn(),
  list: jest.fn()
};

function setupStorageChain() {
  mockStorage.from.mockReturnValue(storageChain);
}

beforeEach(() => {
  jest.resetAllMocks();
  setupStorageChain();
});

// ---------------------------------------------------------------------------
// uploadToSupabase
// ---------------------------------------------------------------------------
describe('uploadToSupabase', () => {
  const buffer = Buffer.from('file-data');

  test('returns { path, fullPath, bucket } on success', async () => {
    storageChain.upload.mockResolvedValue({
      data: { path: 'cases/123/file.pdf', fullPath: 'cases/123/file.pdf' },
      error: null
    });

    const result = await uploadToSupabase(buffer, 'file.pdf', 'application/pdf', 'cases/123');

    expect(result).toEqual({
      path: 'cases/123/file.pdf',
      fullPath: 'cases/123/file.pdf',
      bucket: STORAGE_BUCKET
    });
  });

  test('prepends folder path to filename: "cases/123/file.pdf"', async () => {
    storageChain.upload.mockResolvedValue({
      data: { path: 'cases/123/file.pdf', fullPath: 'cases/123/file.pdf' },
      error: null
    });

    await uploadToSupabase(buffer, 'file.pdf', 'application/pdf', 'cases/123');

    expect(storageChain.upload).toHaveBeenCalledWith(
      'cases/123/file.pdf',
      buffer,
      expect.any(Object)
    );
  });

  test('uses filename directly when no folder provided', async () => {
    storageChain.upload.mockResolvedValue({
      data: { path: 'file.pdf', fullPath: 'file.pdf' },
      error: null
    });

    await uploadToSupabase(buffer, 'file.pdf', 'application/pdf');

    expect(storageChain.upload).toHaveBeenCalledWith('file.pdf', buffer, expect.any(Object));
  });

  test('throws "Upload failed: <message>" on Supabase error', async () => {
    storageChain.upload.mockResolvedValue({
      data: null,
      error: { message: 'bucket not found' }
    });

    await expect(uploadToSupabase(buffer, 'file.pdf', 'application/pdf')).rejects.toThrow(
      'Upload failed: bucket not found'
    );
  });
});

// ---------------------------------------------------------------------------
// generateSignedUrl
// ---------------------------------------------------------------------------
describe('generateSignedUrl', () => {
  test('returns signedUrl string on success', async () => {
    storageChain.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed/file.pdf?token=abc' },
      error: null
    });

    const url = await generateSignedUrl('cases/123/file.pdf');
    expect(url).toBe('https://storage.example.com/signed/file.pdf?token=abc');
  });

  test('passes expiresIn to createSignedUrl', async () => {
    storageChain.createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed/file.pdf' },
      error: null
    });

    await generateSignedUrl('cases/123/file.pdf', 7200);
    expect(storageChain.createSignedUrl).toHaveBeenCalledWith('cases/123/file.pdf', 7200);
  });

  test('throws "Failed to generate signed URL: <message>" on error', async () => {
    storageChain.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'file not found' }
    });

    await expect(generateSignedUrl('missing/file.pdf')).rejects.toThrow(
      'Failed to generate signed URL: file not found'
    );
  });
});

// ---------------------------------------------------------------------------
// getPublicUrl — synchronous
// ---------------------------------------------------------------------------
describe('getPublicUrl', () => {
  test('returns publicUrl string synchronously', () => {
    storageChain.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/public/file.pdf' }
    });

    const url = getPublicUrl('cases/123/file.pdf');
    expect(url).toBe('https://storage.example.com/public/file.pdf');
  });

  test('calls storage.from with the correct bucket', () => {
    storageChain.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/file.pdf' }
    });

    getPublicUrl('path/to/file.pdf');
    expect(mockStorage.from).toHaveBeenCalledWith(STORAGE_BUCKET);
  });
});

// ---------------------------------------------------------------------------
// deleteFromSupabase
// ---------------------------------------------------------------------------
describe('deleteFromSupabase', () => {
  test('resolves without error on success', async () => {
    storageChain.remove.mockResolvedValue({ error: null });
    await expect(deleteFromSupabase('cases/123/file.pdf')).resolves.toBeUndefined();
    expect(storageChain.remove).toHaveBeenCalledWith(['cases/123/file.pdf']);
  });

  test('throws "Delete failed: <message>" on Supabase error', async () => {
    storageChain.remove.mockResolvedValue({ error: { message: 'access denied' } });
    await expect(deleteFromSupabase('cases/123/file.pdf')).rejects.toThrow(
      'Delete failed: access denied'
    );
  });
});

// ---------------------------------------------------------------------------
// deleteMultipleFiles
// ---------------------------------------------------------------------------
describe('deleteMultipleFiles', () => {
  test('resolves without error on success', async () => {
    storageChain.remove.mockResolvedValue({ error: null });
    const paths = ['cases/1/a.pdf', 'cases/1/b.pdf'];
    await expect(deleteMultipleFiles(paths)).resolves.toBeUndefined();
    expect(storageChain.remove).toHaveBeenCalledWith(paths);
  });

  test('throws "Delete multiple failed: <message>" on error', async () => {
    storageChain.remove.mockResolvedValue({ error: { message: 'quota exceeded' } });
    await expect(deleteMultipleFiles(['a.pdf', 'b.pdf'])).rejects.toThrow(
      'Delete multiple failed: quota exceeded'
    );
  });
});
