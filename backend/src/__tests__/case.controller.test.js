'use strict';

// ============================================================
// Mocks — must be declared before any require()
// ============================================================
jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
  supabaseAdmin: null,
  executeQuery: jest.fn(),
}));

jest.mock('../services/storage.service', () => ({
  uploadToSupabase: jest.fn(),
  generateSignedUrl: jest.fn(),
  deleteFromSupabase: jest.fn(),
}));

jest.mock('../services/assignment.service', () => ({
  rankAttorneys: jest.fn(),
}));

jest.mock('../services/payment.service', () => ({
  createPaymentIntent: jest.fn(),
}));

const { supabase } = require('../config/supabase');
const storageService = require('../services/storage.service');
const assignmentService = require('../services/assignment.service');
const paymentService = require('../services/payment.service');
const caseController = require('../controllers/case.controller');

// ============================================================
// Chain helper
// chain is a thenable: non-.single() terminal awaits resolve
// to defaultArrayResult; .single() awaits to its own mock value.
// ============================================================
let chain;
let defaultArrayResult;

function buildChain(arrayResult = { data: [], error: null, count: 0 }) {
  defaultArrayResult = arrayResult;
  chain = {};
  const plain = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in',
    'gte', 'lte', 'or', 'order', 'limit', 'range', 'head'];
  plain.forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  // Thenable: non-.single() query chains resolve here
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(defaultArrayResult).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}

// ============================================================
// Mock req / res builders
// ============================================================
function makeReq(overrides = {}) {
  return {
    user: { id: 'user-1', role: 'driver' },
    params: { id: 'case-1' },
    body: {},
    file: null,
    app: { get: jest.fn().mockReturnValue(null) }, // no io
    ...overrides,
  };
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.resetAllMocks();
  buildChain();
});

// ============================================================
// acceptCase
// ============================================================
describe('acceptCase', () => {
  const ASSIGNED_CASE = {
    id: 'case-1',
    status: 'assigned_to_attorney',
    assigned_attorney_id: 'atty-1',
    driver_id: 'driver-1',
    case_number: 'CDL-001',
  };

  test('transitions to send_info_to_attorney on success', async () => {
    const req = makeReq({ user: { id: 'atty-1', role: 'attorney' } });
    const res = makeRes();

    chain.single
      .mockResolvedValueOnce({ data: ASSIGNED_CASE, error: null })         // fetch case
      .mockResolvedValueOnce({ data: { ...ASSIGNED_CASE, status: 'send_info_to_attorney' }, error: null }); // update

    await caseController.acceptCase(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'send_info_to_attorney' })
    );
  });

  test('returns 403 when attorney is not assigned to this case', async () => {
    const req = makeReq({ user: { id: 'other-atty', role: 'attorney' } });
    const res = makeRes();

    chain.single.mockResolvedValueOnce({ data: ASSIGNED_CASE, error: null });

    await caseController.acceptCase(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 when case status is not assigned_to_attorney', async () => {
    const req = makeReq({ user: { id: 'atty-1', role: 'attorney' } });
    const res = makeRes();

    chain.single.mockResolvedValueOnce({
      data: { ...ASSIGNED_CASE, status: 'send_info_to_attorney' },
      error: null,
    });

    await caseController.acceptCase(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when case not found', async () => {
    const req = makeReq({ user: { id: 'atty-1', role: 'attorney' } });
    const res = makeRes();

    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    await caseController.acceptCase(req, res);

    expect(res.status).toHaveBeenCalledWith(expect.any(Number));
  });
});

// ============================================================
// declineCase
// ============================================================
describe('declineCase', () => {
  const ASSIGNED_CASE = {
    id: 'case-1',
    status: 'assigned_to_attorney',
    assigned_attorney_id: 'atty-1',
    driver_id: 'driver-1',
    case_number: 'CDL-001',
  };

  test('resets status to new and clears assigned_attorney_id', async () => {
    const req = makeReq({ user: { id: 'atty-1', role: 'attorney' }, body: { reason: 'conflict' } });
    const res = makeRes();

    chain.single
      .mockResolvedValueOnce({ data: ASSIGNED_CASE, error: null })
      .mockResolvedValueOnce({ data: { ...ASSIGNED_CASE, status: 'new', assigned_attorney_id: null }, error: null });

    await caseController.declineCase(req, res);

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'new', assigned_attorney_id: null })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('returns 403 when attorney does not own the case', async () => {
    const req = makeReq({ user: { id: 'wrong-atty', role: 'attorney' } });
    const res = makeRes();

    chain.single.mockResolvedValueOnce({ data: ASSIGNED_CASE, error: null });

    await caseController.declineCase(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 when case is not in assigned_to_attorney status', async () => {
    const req = makeReq({ user: { id: 'atty-1', role: 'attorney' } });
    const res = makeRes();

    chain.single.mockResolvedValueOnce({
      data: { ...ASSIGNED_CASE, status: 'closed' },
      error: null,
    });

    await caseController.declineCase(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ============================================================
// listDocuments
// ============================================================
describe('listDocuments', () => {
  test('returns documents with signed URLs', async () => {
    const files = [
      { id: 'f1', file_name: 'ticket.pdf', file_url: 'cases/c1/ticket.pdf', file_type: 'application/pdf', uploaded_at: '2026-01-01' },
    ];
    buildChain({ data: files, error: null, count: 1 });

    storageService.generateSignedUrl.mockResolvedValue('https://signed.url/ticket.pdf');

    const req = makeReq();
    const res = makeRes();

    await caseController.listDocuments(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        documents: expect.arrayContaining([
          expect.objectContaining({ fileName: 'ticket.pdf', signedUrl: 'https://signed.url/ticket.pdf' }),
        ]),
      })
    );
  });

  test('returns empty array when no documents exist', async () => {
    buildChain({ data: [], error: null, count: 0 });

    const req = makeReq();
    const res = makeRes();

    await caseController.listDocuments(req, res);

    expect(res.json).toHaveBeenCalledWith({ documents: [] });
  });

  test('returns documents with null signedUrl when storage fails', async () => {
    const files = [
      { id: 'f1', file_name: 'doc.pdf', file_url: 'cases/c1/doc.pdf', file_type: 'application/pdf', uploaded_at: '2026-01-01' },
    ];
    buildChain({ data: files, error: null, count: 1 });
    storageService.generateSignedUrl.mockRejectedValue(new Error('storage error'));

    const req = makeReq();
    const res = makeRes();

    await caseController.listDocuments(req, res);

    const call = res.json.mock.calls[0][0];
    expect(call.documents[0].signedUrl).toBeNull();
  });
});

// ============================================================
// uploadDocument
// ============================================================
describe('uploadDocument', () => {
  const CASE_DATA = { id: 'case-1', driver_id: 'user-1' };
  const FILE_RECORD = { id: 'file-1', file_name: 'photo.jpg', uploaded_at: '2026-01-01' };

  function makeUploadReq(overrides = {}) {
    return makeReq({
      file: { buffer: Buffer.from('data'), originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 1024 },
      ...overrides,
    });
  }

  test('uploads file and returns document record', async () => {
    chain.single
      .mockResolvedValueOnce({ data: CASE_DATA, error: null })     // fetch case
      .mockResolvedValueOnce({ data: FILE_RECORD, error: null });  // insert file_record

    storageService.uploadToSupabase.mockResolvedValue({ path: 'cases/case-1/photo.jpg' });
    storageService.generateSignedUrl.mockResolvedValue('https://signed.url/photo.jpg');

    const req = makeUploadReq();
    const res = makeRes();

    await caseController.uploadDocument(req, res);

    expect(storageService.uploadToSupabase).toHaveBeenCalledWith(
      expect.any(Buffer),
      'photo.jpg',
      'image/jpeg',
      'cases/case-1'
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ fileName: 'photo.jpg' }));
  });

  test('returns 400 when no file is attached', async () => {
    const req = makeReq({ file: null });
    const res = makeRes();

    await caseController.uploadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 403 when driver does not own case', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', driver_id: 'other-driver' },
      error: null,
    });

    const req = makeUploadReq({ user: { id: 'user-1', role: 'driver' } });
    const res = makeRes();

    await caseController.uploadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 when 10 documents already exist', async () => {
    chain.single.mockResolvedValueOnce({ data: CASE_DATA, error: null });
    // Override thenable to return count: 10 for the count query
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: [], error: null, count: 10 }).then(onFulfilled);

    const req = makeUploadReq();
    const res = makeRes();

    await caseController.uploadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('10') })
    );
  });
});

// ============================================================
// deleteDocument
// ============================================================
describe('deleteDocument', () => {
  test('deletes document from storage and database', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { driver_id: 'user-1' }, error: null })     // case ownership
      .mockResolvedValueOnce({ data: { file_url: 'cases/c1/doc.pdf' }, error: null }); // file record

    storageService.deleteFromSupabase.mockResolvedValue({});

    const req = makeReq({
      params: { id: 'case-1', documentId: 'doc-1' },
    });
    const res = makeRes();

    await caseController.deleteDocument(req, res);

    expect(storageService.deleteFromSupabase).toHaveBeenCalledWith('cases/c1/doc.pdf');
    expect(chain.delete).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Document deleted' });
  });

  test('returns 403 when driver does not own case', async () => {
    chain.single.mockResolvedValueOnce({ data: { driver_id: 'other-driver' }, error: null });

    const req = makeReq({
      user: { id: 'user-1', role: 'driver' },
      params: { id: 'case-1', documentId: 'doc-1' },
    });
    const res = makeRes();

    await caseController.deleteDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 404 when document not found', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { driver_id: 'user-1' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const req = makeReq({ params: { id: 'case-1', documentId: 'missing-doc' } });
    const res = makeRes();

    await caseController.deleteDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ============================================================
// getRecommendedAttorneys
// ============================================================
describe('getRecommendedAttorneys', () => {
  test('returns top 3 ranked attorneys with isRecommended on first', async () => {
    assignmentService.rankAttorneys.mockResolvedValue([
      { userId: 'a1', firstName: 'Alice', lastName: 'Smith', successRate: 0.9, specializations: ['speeding'], currentCases: 3 },
      { userId: 'a2', firstName: 'Bob', lastName: 'Jones', successRate: 0.8, specializations: [], currentCases: 5 },
      { userId: 'a3', firstName: 'Carol', lastName: 'Lee', successRate: 0.7, specializations: [], currentCases: 2 },
      { userId: 'a4', firstName: 'Dave', lastName: 'Wu', successRate: 0.6, specializations: [], currentCases: 1 },
    ]);

    const req = makeReq();
    const res = makeRes();

    await caseController.getRecommendedAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys).toHaveLength(3);
    expect(attorneys[0].isRecommended).toBe(true);
    expect(attorneys[1].isRecommended).toBe(false);
  });

  test('returns empty array with 200 when assignment service throws', async () => {
    assignmentService.rankAttorneys.mockRejectedValue(new Error('service unavailable'));

    const req = makeReq();
    const res = makeRes();

    await caseController.getRecommendedAttorneys(req, res);

    expect(res.json).toHaveBeenCalledWith({ attorneys: [] });
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ============================================================
// selectAttorney
// ============================================================
describe('selectAttorney', () => {
  test('assigns attorney and transitions to assigned_to_attorney', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { id: 'case-1', status: 'new', driver_id: 'user-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'case-1', status: 'assigned_to_attorney' }, error: null });

    const req = makeReq({ body: { attorney_id: 'atty-1' } });
    const res = makeRes();

    await caseController.selectAttorney(req, res);

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ assigned_attorney_id: 'atty-1', status: 'assigned_to_attorney' })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('returns 403 when driver does not own case', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', status: 'new', driver_id: 'other-driver' },
      error: null,
    });

    const req = makeReq({ body: { attorney_id: 'atty-1' } });
    const res = makeRes();

    await caseController.selectAttorney(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 when case already has an attorney', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', status: 'assigned_to_attorney', driver_id: 'user-1' },
      error: null,
    });

    const req = makeReq({ body: { attorney_id: 'atty-1' } });
    const res = makeRes();

    await caseController.selectAttorney(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when attorney_id is missing', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();

    await caseController.selectAttorney(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ============================================================
// createCasePayment
// ============================================================
describe('createCasePayment', () => {
  test('creates payment intent and returns clientSecret', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', driver_id: 'user-1', attorney_price: 450 },
      error: null,
    });

    paymentService.createPaymentIntent.mockResolvedValue({
      clientSecret: 'pi_test_secret',
      paymentIntentId: 'pi_test',
    });

    const req = makeReq();
    const res = makeRes();

    await caseController.createCasePayment(req, res);

    expect(paymentService.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 450 })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ clientSecret: 'pi_test_secret' })
    );
  });

  test('returns 404 when case not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const req = makeReq();
    const res = makeRes();

    await caseController.createCasePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(expect.any(Number));
  });

  test('returns 400 when attorney_price is not set', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', driver_id: 'user-1', attorney_price: null },
      error: null,
    });

    const req = makeReq();
    const res = makeRes();

    await caseController.createCasePayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ============================================================
// getCaseById — attorney phone masking
// ============================================================
describe('getCaseById — attorney phone masking', () => {
  const caseWithPhone = {
    id: 'case-1',
    status: 'send_info_to_attorney',
    driver: { id: 'driver-1', full_name: 'John Doe', phone: '5551234567' },
    files: [],
  };

  test('masks driver phone when requester is attorney', async () => {
    chain.single.mockResolvedValueOnce({ data: { ...caseWithPhone }, error: null });

    const req = makeReq({ user: { id: 'atty-1', role: 'attorney' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseById(req, res);

    const returned = res.json.mock.calls[0][0].case;
    expect(returned.driver.phone).toMatch(/^\*\*\*/);
    expect(returned.driver.phone).toContain('4567');
  });

  test('does NOT mask driver phone when requester is driver', async () => {
    chain.single.mockResolvedValueOnce({ data: { ...caseWithPhone }, error: null });

    const req = makeReq({ user: { id: 'driver-1', role: 'driver' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseById(req, res);

    const returned = res.json.mock.calls[0][0].case;
    expect(returned.driver.phone).toBe('5551234567');
  });

  test('returns 404 when case not found', async () => {
    // null data with no error triggers the 404 branch (error triggers 500 via catch)
    chain.single.mockResolvedValueOnce({ data: null, error: null });

    const req = makeReq({ params: { id: 'missing' } });
    const res = makeRes();

    await caseController.getCaseById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
