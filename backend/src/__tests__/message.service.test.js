'use strict';

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() }
}));

jest.mock('../services/storage.service', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn()
}));

const { supabase } = require('../config/supabase');
const storageService = require('../services/storage.service');
const { AppError } = require('../utils/errors');
const { createMessage, createMessageWithFile } = require('../services/message.service');

// --- Supabase chain mock ---
const chain = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  eq: jest.fn(),
  single: jest.fn()
};

function setupChain() {
  Object.keys(chain).forEach(k => chain[k].mockReturnValue(chain));
  supabase.from.mockReturnValue(chain);
}

/**
 * Mock resolveAuthUserId — the service calls
 * supabase.from('users').select('auth_user_id').eq('id', id).single()
 * We return the same ID (identity mapping in tests).
 */
function mockResolveAuth(userId) {
  chain.single.mockResolvedValueOnce({ data: { auth_user_id: userId }, error: null });
}

beforeEach(() => {
  jest.resetAllMocks();
  setupChain();
});

// ---------------------------------------------------------------------------
// createMessage
// ---------------------------------------------------------------------------
describe('createMessage', () => {
  const params = {
    conversationId: 'conv-1',
    senderId: 'driver-1',
    recipientId: 'atty-1',
    content: 'Hello',
    messageType: 'text'
  };

  test('throws AppError 404 when conversation not found', async () => {
    mockResolveAuth('driver-1');
    chain.single.mockResolvedValueOnce({ data: null, error: null });

    await expect(createMessage(params)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('Conversation not found')
    });
  });

  test('throws AppError 400 when conversation has closed_at set', async () => {
    mockResolveAuth('driver-1');
    chain.single.mockResolvedValueOnce({
      data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: new Date().toISOString() },
      error: null
    });

    await expect(createMessage(params)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws AppError 403 when sender is neither driver nor attorney', async () => {
    mockResolveAuth('intruder-99');
    chain.single.mockResolvedValueOnce({
      data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: null },
      error: null
    });

    await expect(createMessage({ ...params, senderId: 'intruder-99' })).rejects.toMatchObject({
      statusCode: 403
    });
  });

  test('throws AppError 400 when content exceeds 10,000 characters', async () => {
    mockResolveAuth('driver-1');
    chain.single.mockResolvedValueOnce({
      data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: null },
      error: null
    });

    const longContent = 'x'.repeat(10001);
    await expect(createMessage({ ...params, content: longContent })).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('10,000')
    });
  });

  test('updates last_message_at on conversation after message created', async () => {
    const message = { id: 'msg-1', content: 'Hello' };
    mockResolveAuth('driver-1');
    chain.single
      .mockResolvedValueOnce({ data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: null }, error: null }) // conversation
      .mockResolvedValueOnce({ data: message, error: null }); // insert message

    const result = await createMessage(params);

    expect(result).toEqual(message);
    // The update call on conversations table
    expect(supabase.from).toHaveBeenCalledWith('conversations');
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_message_at: expect.any(String) })
    );
  });

  test('attorney can also send messages (is valid sender)', async () => {
    const message = { id: 'msg-2', content: 'Reply from attorney' };
    mockResolveAuth('atty-1');
    chain.single
      .mockResolvedValueOnce({ data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: null }, error: null })
      .mockResolvedValueOnce({ data: message, error: null });

    const result = await createMessage({ ...params, senderId: 'atty-1' });
    expect(result).toEqual(message);
  });
});

// ---------------------------------------------------------------------------
// createMessageWithFile
// ---------------------------------------------------------------------------
describe('createMessageWithFile', () => {
  const file = { originalname: 'doc.pdf', size: 1024, mimetype: 'application/pdf' };
  const params = {
    conversationId: 'conv-1',
    senderId: 'driver-1',
    recipientId: 'atty-1',
    content: 'See attached',
    file
  };

  test('throws AppError 400 when conversation is closed', async () => {
    mockResolveAuth('driver-1');
    chain.single.mockResolvedValueOnce({
      data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: new Date().toISOString() },
      error: null
    });

    await expect(createMessageWithFile(params)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('throws AppError 403 when sender is unauthorized', async () => {
    mockResolveAuth('intruder');
    chain.single.mockResolvedValueOnce({
      data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: null },
      error: null
    });

    await expect(createMessageWithFile({ ...params, senderId: 'intruder' })).rejects.toMatchObject({
      statusCode: 403
    });
  });

  test('calls storageService.deleteFile when DB message insert fails', async () => {
    storageService.uploadFile.mockResolvedValue('https://storage/doc.pdf');
    mockResolveAuth('driver-1');

    chain.single
      .mockResolvedValueOnce({ data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: null }, error: null }) // conversation
      .mockResolvedValueOnce({ data: null, error: { message: 'insert failed' } }); // message insert fails

    await expect(createMessageWithFile(params)).rejects.toBeInstanceOf(AppError);
    expect(storageService.deleteFile).toHaveBeenCalledWith('https://storage/doc.pdf');
  });

  test('returns message with attachments on success', async () => {
    const message = { id: 'msg-3', content: 'See attached', message_type: 'file' };
    const attachment = { id: 'att-1', file_name: 'doc.pdf', file_url: 'https://storage/doc.pdf' };

    storageService.uploadFile.mockResolvedValue('https://storage/doc.pdf');
    mockResolveAuth('driver-1');

    chain.single
      .mockResolvedValueOnce({ data: { driver_id: 'driver-1', attorney_id: 'atty-1', closed_at: null }, error: null })
      .mockResolvedValueOnce({ data: message, error: null }) // message insert
      .mockResolvedValueOnce({ data: attachment, error: null }); // attachment insert

    const result = await createMessageWithFile(params);
    expect(result.attachments).toEqual([attachment]);
  });
});
