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
  autoAssign: jest.fn().mockResolvedValue(null),
}));

jest.mock('../services/payment.service', () => ({
  createPaymentIntent: jest.fn(),
}));

jest.mock('../services/email.service', () => ({
  sendCaseStatusEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
}));

jest.mock('../services/sms.service', () => ({
  sendStatusChangeSms: jest.fn().mockResolvedValue({}),
}));

jest.mock('../services/onesignal.service', () => ({
  notifyUser: jest.fn().mockResolvedValue({}),
}));

jest.mock('../services/webhook.service', () => ({
  dispatch: jest.fn(),
}));

jest.mock('../services/workflow.service', () => ({
  getCaseStatusHistory: jest.fn(),
}));

const { supabase } = require('../config/supabase');
const storageService = require('../services/storage.service');
const assignmentService = require('../services/assignment.service');
const paymentService = require('../services/payment.service');
const workflowService = require('../services/workflow.service');
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
// createCase — new fields (citation_number, fine_amount, alleged_speed)
// ============================================================
describe('createCase', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    buildChain();
    // Re-establish mocks cleared by resetAllMocks
    const smsService = require('../services/sms.service');
    const oneSignalService = require('../services/onesignal.service');
    const webhookService = require('../services/webhook.service');
    const emailService = require('../services/email.service');
    emailService.sendCaseSubmissionEmail = jest.fn().mockResolvedValue({});
    emailService.sendCaseStatusEmail = jest.fn().mockResolvedValue({});
    smsService.sendCaseSubmissionSms = jest.fn().mockResolvedValue({});
    smsService.sendStatusChangeSms = jest.fn().mockResolvedValue({});
    oneSignalService.notifyUser = jest.fn().mockResolvedValue({});
    webhookService.dispatch = jest.fn();
  });

  test('creates case with new optional fields', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-new', case_number: 'CDL-100', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test Driver',
        customer_type: 'one_time_driver',
        violation_type: 'speeding',
        violation_date: '2026-03-01',
        state: 'TX',
        town: 'Austin',
        violation_details: 'Going 80 in a 60',
        citation_number: 'TX-12345',
        fine_amount: 250.00,
        alleged_speed: 80,
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    expect(supabase.from).toHaveBeenCalledWith('cases');
    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.citation_number).toBe('TX-12345');
    expect(insertArg.fine_amount).toBe(250.00);
    expect(insertArg.alleged_speed).toBe(80);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('strips alleged_speed when violation_type is not speeding', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-new', case_number: 'CDL-101', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test Driver',
        customer_type: 'one_time_driver',
        violation_type: 'hos_logbook',
        violation_date: '2026-03-01',
        state: 'TX',
        town: 'Austin',
        violation_details: 'HOS violation details',
        alleged_speed: 80,
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.alleged_speed).toBeUndefined();
  });

  test('creates case without optional fields', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-new', case_number: 'CDL-102', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test Driver',
        customer_type: 'one_time_driver',
        violation_type: 'other',
        violation_date: '2026-03-01',
        state: 'TX',
        town: 'Austin',
        violation_details: 'Some violation',
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.citation_number).toBeUndefined();
    expect(insertArg.fine_amount).toBeUndefined();
    expect(insertArg.alleged_speed).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('includes fine_amount when value is 0', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-new', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test',
        customer_type: 'one_time_driver',
        violation_type: 'speeding',
        violation_date: '2026-03-01',
        state: 'TX',
        town: 'Dallas',
        violation_details: 'Speeding ticket',
        fine_amount: 0,
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.fine_amount).toBe(0);
  });

  test('returns 400 on validation errors', async () => {
    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {},
    });
    // Simulate express-validator errors
    const { validationResult } = require('express-validator');
    // The controller calls validationResult(req) — we need the mock to return errors
    // Since validationResult is not easily mockable, test the DB error path instead
    chain.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'insert failed' },
    });

    req.body = {
      customer_name: 'Test',
      customer_type: 'one_time_driver',
      violation_type: 'speeding',
      violation_date: '2026-03-01',
      state: 'TX',
      town: 'Austin',
      violation_details: 'Test',
    };
    const res = makeRes();

    await caseController.createCase(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('accepts new CDL-specific violation types', async () => {
    const cdlTypes = ['hos_logbook', 'dot_inspection', 'suspension', 'csa_score', 'dqf'];

    for (const vType of cdlTypes) {
      jest.resetAllMocks();
      buildChain();
      // Re-establish service mocks after resetAllMocks
      const sms = require('../services/sms.service');
      const oneSignal = require('../services/onesignal.service');
      const email = require('../services/email.service');
      const webhook = require('../services/webhook.service');
      sms.sendCaseSubmissionSms = jest.fn().mockResolvedValue({});
      sms.sendStatusChangeSms = jest.fn().mockResolvedValue({});
      oneSignal.notifyUser = jest.fn().mockResolvedValue({});
      email.sendCaseSubmissionEmail = jest.fn().mockResolvedValue({});
      webhook.dispatch = jest.fn();
      chain.single.mockResolvedValueOnce({
        data: { id: `case-${vType}`, status: 'new' },
        error: null,
      });

      const req = makeReq({
        user: { id: 'driver-1', role: 'driver' },
        body: {
          customer_name: 'Test',
          customer_type: 'one_time_driver',
          violation_type: vType,
          violation_date: '2026-03-01',
          state: 'TX',
          town: 'Austin',
          violation_details: `${vType} violation`,
        },
      });
      const res = makeRes();

      await caseController.createCase(req, res);

      const insertArg = chain.insert.mock.calls[0][0][0];
      expect(insertArg.violation_type).toBe(vType);
      expect(res.status).toHaveBeenCalledWith(201);
    }
  });
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
    assignmentService.autoAssign.mockResolvedValue(null);
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
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'MAX_FILES', message: 'Maximum 10 documents per case reached' }
    });
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

// ============================================================
// uploadDocument — operator access (CM-1)
// ============================================================
describe('uploadDocument', () => {
  const mockFile = { buffer: Buffer.from('test'), originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1234 };

  test('allows operator to upload to their assigned case', async () => {
    // First .single() → case lookup
    chain.single
      .mockResolvedValueOnce({ data: { id: 'case-1', driver_id: 'drv-1', assigned_operator_id: 'op-1' }, error: null })
      // After count chain, .single() → insert result
      .mockResolvedValueOnce({ data: { id: 'f1', file_name: 'doc.pdf', uploaded_at: '2026-01-01' }, error: null });

    // Count query → thenable
    const countResult = { count: 2 };
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      return Promise.resolve(callCount === 1 ? countResult : { data: null, error: null }).then(onFulfilled);
    };

    storageService.uploadToSupabase.mockResolvedValue({ path: 'cases/case-1/doc.pdf' });
    storageService.generateSignedUrl.mockResolvedValue('https://signed-url');

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      file: mockFile,
    });
    const res = makeRes();

    await caseController.uploadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    const response = res.json.mock.calls[0][0];
    expect(response.fileName).toBe('doc.pdf');
  });

  test('returns 403 for operator not assigned to the case', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', driver_id: 'drv-1', assigned_operator_id: 'op-other' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      file: mockFile,
    });
    const res = makeRes();

    await caseController.uploadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 when no file is provided', async () => {
    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
    });
    // Ensure req.file is falsy
    delete req.file;
    const res = makeRes();

    await caseController.uploadDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ============================================================
// deleteDocument — operator access (CM-1)
// ============================================================
describe('deleteDocument', () => {
  test('allows operator to delete their own upload', async () => {
    // Case lookup
    chain.single
      .mockResolvedValueOnce({ data: { driver_id: 'drv-1', assigned_operator_id: 'op-1' }, error: null })
      // File record lookup
      .mockResolvedValueOnce({ data: { file_url: 'cases/case-1/doc.pdf', uploaded_by: 'op-1' }, error: null });

    storageService.deleteFromSupabase.mockResolvedValue();
    // delete chain result
    chain.then = (onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled);

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      params: { id: 'case-1', documentId: 'doc-1' },
    });
    const res = makeRes();

    await caseController.deleteDocument(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Document deleted' });
  });

  test('returns 403 when operator tries to delete another users upload', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { driver_id: 'drv-1', assigned_operator_id: 'op-1' }, error: null })
      .mockResolvedValueOnce({ data: { file_url: 'cases/case-1/doc.pdf', uploaded_by: 'op-other' }, error: null });

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      params: { id: 'case-1', documentId: 'doc-1' },
    });
    const res = makeRes();

    await caseController.deleteDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 403 for operator not assigned to the case', async () => {
    chain.single.mockResolvedValueOnce({
      data: { driver_id: 'drv-1', assigned_operator_id: 'op-other' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      params: { id: 'case-1', documentId: 'doc-1' },
    });
    const res = makeRes();

    await caseController.deleteDocument(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ============================================================
// updateCase — field blocklist (CM-1)
// ============================================================
describe('updateCase — field blocklist', () => {
  test('strips assigned_operator_id and assigned_attorney_id from payload', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', status: 'reviewed' },
      error: null,
    });
    // Activity log insert
    chain.then = (onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled);

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      body: {
        violation_type: 'speeding',
        assigned_operator_id: 'should-be-stripped',
        assigned_attorney_id: 'should-be-stripped',
        updated_at: 'should-be-stripped',
        case_number: 'should-be-stripped',
      },
    });
    const res = makeRes();

    await caseController.updateCase(req, res);

    // The update call receives only violation_type
    const updateArg = chain.update.mock.calls[0][0];
    expect(updateArg).not.toHaveProperty('assigned_operator_id');
    expect(updateArg).not.toHaveProperty('assigned_attorney_id');
    expect(updateArg).not.toHaveProperty('updated_at');
    expect(updateArg).not.toHaveProperty('case_number');
    expect(updateArg).toHaveProperty('violation_type', 'speeding');
  });
});

// ============================================================
// CD-6: updateCase — driver field restrictions
// ============================================================
describe('updateCase — driver field restrictions (CD-6)', () => {
  beforeEach(() => { jest.resetAllMocks(); buildChain(); });

  test('driver can PATCH description and location', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', description: 'Updated', location: 'New Place' },
      error: null,
    });
    chain.then = (onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled);

    const req = makeReq({
      user: { id: 'd1', role: 'driver' },
      body: { description: 'Updated', location: 'New Place' },
    });
    const res = makeRes();

    await caseController.updateCase(req, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Case updated successfully' }));
  });

  test('driver cannot PATCH status field — returns 403', async () => {
    const req = makeReq({
      user: { id: 'd1', role: 'driver' },
      body: { status: 'closed' },
    });
    const res = makeRes();

    await caseController.updateCase(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'FIELD_NOT_EDITABLE', message: 'Drivers can only edit description, location, and violation details' },
    });
  });

  test('driver cannot PATCH attorney_price field — returns 403', async () => {
    const req = makeReq({
      user: { id: 'd1', role: 'driver' },
      body: { attorney_price: 999 },
    });
    const res = makeRes();

    await caseController.updateCase(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'FIELD_NOT_EDITABLE', message: 'Drivers can only edit description, location, and violation details' },
    });
  });

  test('operator can still PATCH all fields (unchanged behavior)', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', status: 'reviewed', violation_type: 'speeding' },
      error: null,
    });
    chain.then = (onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled);

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      body: { status: 'reviewed', violation_type: 'speeding', court_date: '2026-05-01' },
    });
    const res = makeRes();

    await caseController.updateCase(req, res);

    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Case updated successfully' }));
  });
});

// ============================================================
// changeStatus — workflow transition enforcement
// ============================================================
describe('changeStatus — workflow transitions', () => {
  beforeEach(() => { jest.resetAllMocks(); buildChain(); });

  test('rejects invalid transition (new → closed) with INVALID_TRANSITION', async () => {
    // First .single() call: fetch current case
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', status: 'new', driver_id: 'd1' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      body: { status: 'closed', comment: 'closing' },
    });
    const res = makeRes();

    await caseController.changeStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INVALID_TRANSITION', message: expect.stringContaining('Cannot transition') },
    });
  });

  test('rejects transition to closed without note (NOTE_REQUIRED)', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', status: 'call_court', driver_id: 'd1' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      body: { status: 'closed' }, // no comment
    });
    const res = makeRes();

    await caseController.changeStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOTE_REQUIRED', message: expect.stringContaining('note is required') },
    });
  });

  test('allows valid transition (new → reviewed) and returns success', async () => {
    const updatedCase = { id: 'case-1', status: 'reviewed', case_number: 'CDL-001' };
    // First .single(): fetch current case
    chain.single
      .mockResolvedValueOnce({ data: { id: 'case-1', status: 'new', driver_id: 'd1' }, error: null })
      // Second .single(): update result
      .mockResolvedValueOnce({ data: updatedCase, error: null });

    // activity log insert (thenable)
    chain.then = (onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled);

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      body: { status: 'reviewed' },
    });
    const res = makeRes();

    await caseController.changeStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Status updated successfully' }),
    );
  });

  test('allows transition to closed with note', async () => {
    const updatedCase = { id: 'case-1', status: 'closed', case_number: 'CDL-001' };
    chain.single
      .mockResolvedValueOnce({ data: { id: 'case-1', status: 'resolved', driver_id: 'd1' }, error: null })
      .mockResolvedValueOnce({ data: updatedCase, error: null });

    chain.then = (onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled);

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      body: { status: 'closed', comment: 'Case completed successfully' },
    });
    const res = makeRes();

    await caseController.changeStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Status updated successfully' }),
    );
  });

  test('returns 404 when case not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const req = makeReq({
      user: { id: 'op-1', role: 'operator' },
      body: { status: 'reviewed' },
    });
    const res = makeRes();

    await caseController.changeStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Case not found' },
    });
  });
});

// ============================================================
// getNextStatuses
// ============================================================
describe('getNextStatuses', () => {
  beforeEach(() => { jest.resetAllMocks(); buildChain(); });

  test('returns next statuses and requiresNote map for current status', async () => {
    chain.single.mockResolvedValueOnce({
      data: { status: 'assigned_to_attorney' },
      error: null,
    });

    const req = makeReq({ user: { id: 'op-1', role: 'operator' } });
    const res = makeRes();

    await caseController.getNextStatuses(req, res);

    expect(res.json).toHaveBeenCalledWith({
      currentStatus: 'assigned_to_attorney',
      nextStatuses: ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager', 'closed'],
      requiresNote: { closed: true, check_with_manager: true },
    });
  });

  test('returns empty array for terminal status', async () => {
    chain.single.mockResolvedValueOnce({
      data: { status: 'closed' },
      error: null,
    });

    const req = makeReq({ user: { id: 'op-1', role: 'operator' } });
    const res = makeRes();

    await caseController.getNextStatuses(req, res);

    expect(res.json).toHaveBeenCalledWith({
      currentStatus: 'closed',
      nextStatuses: [],
      requiresNote: {},
    });
  });

  test('returns 404 when case not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const req = makeReq({ user: { id: 'op-1', role: 'operator' } });
    const res = makeRes();

    await caseController.getNextStatuses(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Case not found' },
    });
  });
});

// ============================================================
// getCaseById — status history enrichment (CD-1)
// ============================================================
describe('getCaseById — status history enrichment', () => {
  const baseCaseData = {
    id: 'case-1',
    status: 'in_progress',
    driver: { id: 'driver-1', full_name: 'John Doe', phone: '5551234567' },
    files: [],
  };

  const statusHistoryRecords = [
    {
      history_id: 'h1',
      case_id: 'case-1',
      status: 'in_progress',
      previous_status: 'assigned',
      changed_by: 'op-1',
      notes: 'Started work',
      changed_at: '2026-03-01T10:00:00Z',
      changed_by_user: { user_id: 'op-1', first_name: 'Jane', last_name: 'Ops', email: 'jane@test.com' },
    },
    {
      history_id: 'h2',
      case_id: 'case-1',
      status: 'assigned',
      previous_status: 'new',
      changed_by: 'admin-1',
      notes: null,
      changed_at: '2026-02-28T08:00:00Z',
      changed_by_user: { user_id: 'admin-1', first_name: 'Admin', last_name: 'User', email: 'admin@test.com' },
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    buildChain();
  });

  test('returns statusHistory array when status history exists', async () => {
    chain.single.mockResolvedValueOnce({ data: { ...baseCaseData }, error: null });
    workflowService.getCaseStatusHistory.mockResolvedValue(statusHistoryRecords);

    const req = makeReq({ user: { id: 'driver-1', role: 'driver' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseById(req, res);

    expect(workflowService.getCaseStatusHistory).toHaveBeenCalledWith('case-1');
    const returned = res.json.mock.calls[0][0].case;
    expect(returned.statusHistory).toEqual(statusHistoryRecords);
    expect(returned.statusHistory).toHaveLength(2);
  });

  test('returns empty statusHistory when no history records exist', async () => {
    chain.single.mockResolvedValueOnce({ data: { ...baseCaseData }, error: null });
    workflowService.getCaseStatusHistory.mockResolvedValue([]);

    const req = makeReq({ user: { id: 'driver-1', role: 'driver' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseById(req, res);

    expect(workflowService.getCaseStatusHistory).toHaveBeenCalledWith('case-1');
    const returned = res.json.mock.calls[0][0].case;
    expect(returned.statusHistory).toEqual([]);
  });

  test('returns case data with empty statusHistory when workflow service throws', async () => {
    chain.single.mockResolvedValueOnce({ data: { ...baseCaseData }, error: null });
    workflowService.getCaseStatusHistory.mockRejectedValue(new Error('DB connection lost'));

    const req = makeReq({ user: { id: 'driver-1', role: 'driver' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseById(req, res);

    const returned = res.json.mock.calls[0][0].case;
    // Case data should still be returned intact
    expect(returned.id).toBe('case-1');
    expect(returned.status).toBe('in_progress');
    // statusHistory gracefully falls back to empty array
    expect(returned.statusHistory).toEqual([]);
    // Should NOT return a 500
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ============================================================
// CD-2: getCaseConversation
// ============================================================
describe('getCaseConversation', () => {
  beforeEach(() => { jest.resetAllMocks(); buildChain(); });

  test('returns existing conversation when one exists', async () => {
    const conversation = { id: 'conv-1', case_id: 'case-1', driver_id: 'd1' };
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', case_number: 'CDL-001', driver_id: 'd1', assigned_operator_id: 'op-1' },
      error: null,
    });
    // Override thenable for conversation lookup
    defaultArrayResult = { data: [conversation], error: null };

    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseConversation(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: conversation });
  });

  test('creates new conversation when none exists', async () => {
    const created = { id: 'conv-new', case_id: 'case-1', driver_id: 'd1', attorney_id: 'd1' };
    chain.single
      .mockResolvedValueOnce({
        data: { id: 'case-1', case_number: 'CDL-001', driver_id: 'd1', assigned_operator_id: 'op-1' },
        error: null,
      })
      .mockResolvedValueOnce({ data: created, error: null });
    // No existing conversations
    defaultArrayResult = { data: [], error: null };

    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
  });

  test('returns 404 when case not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'bad-id' } });
    const res = makeRes();

    await caseController.getCaseConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Case not found' },
    });
  });

  test('returns 400 when case has no driver', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', case_number: 'CDL-001', driver_id: null, assigned_operator_id: 'op-1' },
      error: null,
    });
    defaultArrayResult = { data: [], error: null };

    const req = makeReq({ user: { id: 'op-1', role: 'operator' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NO_DRIVER', message: 'Case has no linked driver' },
    });
  });
});

// ============================================================
// CD-2: getCaseMessages
// ============================================================
describe('getCaseMessages', () => {
  beforeEach(() => { jest.resetAllMocks(); buildChain(); });

  test('returns messages when conversation exists', async () => {
    const messages = [
      { id: 'msg-1', content: 'Hello', sender_id: 'd1', created_at: '2026-03-01T10:00:00Z' },
      { id: 'msg-2', content: 'Hi there', sender_id: 'op-1', created_at: '2026-03-01T10:01:00Z' },
    ];
    // Conversation lookup (thenable returns array)
    defaultArrayResult = { data: [{ id: 'conv-1' }], error: null, count: 2 };

    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseMessages(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ conversationId: 'conv-1' }),
    });
  });

  test('returns empty messages when no conversation exists', async () => {
    defaultArrayResult = { data: [], error: null };

    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'case-1' } });
    const res = makeRes();

    await caseController.getCaseMessages(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { messages: [], total: 0 },
    });
  });
});

// ============================================================
// CD-2: sendCaseMessage
// ============================================================
describe('sendCaseMessage', () => {
  beforeEach(() => { jest.resetAllMocks(); buildChain(); });

  test('returns 400 when content is empty', async () => {
    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'case-1' }, body: { content: '' } });
    const res = makeRes();

    await caseController.sendCaseMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'Message content is required' },
    });
  });

  test('returns 400 when content is missing', async () => {
    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'case-1' }, body: {} });
    const res = makeRes();

    await caseController.sendCaseMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when case not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'bad-id' }, body: { content: 'Hello' } });
    const res = makeRes();

    await caseController.sendCaseMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'Case not found' },
    });
  });

  test('creates message in existing conversation and returns 201', async () => {
    const newMessage = { id: 'msg-new', content: 'Hello', sender_id: 'd1', conversation_id: 'conv-1' };
    // .single() calls: 1) case lookup, 2) message insert result
    chain.single
      .mockResolvedValueOnce({ data: { id: 'case-1', driver_id: 'd1' }, error: null })
      .mockResolvedValueOnce({ data: newMessage, error: null });
    // Thenable resolves for conversation lookup + conversation update (catch swallowed)
    defaultArrayResult = { data: [{ id: 'conv-1' }], error: null };
    // Catch for the conversation update .catch(() => {})
    chain.catch = jest.fn().mockReturnValue(chain);

    const req = makeReq({ user: { id: 'd1', role: 'driver' }, params: { id: 'case-1' }, body: { content: 'Hello' } });
    const res = makeRes();

    await caseController.sendCaseMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: newMessage });
  });
});

// ============================================================
// Sprint 074 / VT-8: Violation Type System Tests
// ============================================================
describe('createCase — violation type system (VT-8)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    buildChain();
    const smsService = require('../services/sms.service');
    const oneSignalService = require('../services/onesignal.service');
    const webhookService = require('../services/webhook.service');
    const emailService = require('../services/email.service');
    emailService.sendCaseSubmissionEmail = jest.fn().mockResolvedValue({});
    emailService.sendCaseStatusEmail = jest.fn().mockResolvedValue({});
    smsService.sendCaseSubmissionSms = jest.fn().mockResolvedValue({});
    smsService.sendStatusChangeSms = jest.fn().mockResolvedValue({});
    oneSignalService.notifyUser = jest.fn().mockResolvedValue({});
    webhookService.dispatch = jest.fn();
  });

  test('stores type_specific_data JSONB correctly', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-vt', case_number: 'CDL-VT1', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test Driver',
        customer_type: 'one_time_driver',
        violation_type: 'dui',
        violation_date: '2026-03-01',
        state: 'TX',
        town: 'Austin',
        violation_details: 'DUI stop',
        type_specific_data: { bac_level: 0.08, substance_type: 'alcohol' },
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.type_specific_data).toEqual({ bac_level: 0.08, substance_type: 'alcohol' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('accepts new violation types (overweight_oversize, equipment_defect, hazmat, railroad_crossing, seatbelt_cell_phone)', async () => {
    const newTypes = ['overweight_oversize', 'equipment_defect', 'hazmat', 'railroad_crossing', 'seatbelt_cell_phone'];
    for (const type of newTypes) {
      jest.resetAllMocks();
      buildChain();
      const smsService = require('../services/sms.service');
      const oneSignalService = require('../services/onesignal.service');
      const webhookService = require('../services/webhook.service');
      const emailService = require('../services/email.service');
      emailService.sendCaseSubmissionEmail = jest.fn().mockResolvedValue({});
      smsService.sendCaseSubmissionSms = jest.fn().mockResolvedValue({});
      smsService.sendStatusChangeSms = jest.fn().mockResolvedValue({});
      oneSignalService.notifyUser = jest.fn().mockResolvedValue({});
      webhookService.dispatch = jest.fn();

      chain.single.mockResolvedValueOnce({
        data: { id: `case-${type}`, case_number: 'CDL-VT', status: 'new' },
        error: null,
      });

      const req = makeReq({
        user: { id: 'driver-1', role: 'driver' },
        body: {
          customer_name: 'Test', customer_type: 'one_time_driver',
          violation_type: type, violation_date: '2026-03-01',
          state: 'TX', town: 'Austin', violation_details: `${type} violation`,
        },
      });
      const res = makeRes();

      await caseController.createCase(req, res);

      const insertArg = chain.insert.mock.calls[0][0][0];
      expect(insertArg.violation_type).toBe(type);
      expect(res.status).toHaveBeenCalledWith(201);
    }
  });

  test('speeding case stores alleged_speed both as column and in type_specific_data', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-spd', case_number: 'CDL-SPD', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test', customer_type: 'one_time_driver',
        violation_type: 'speeding', violation_date: '2026-03-01',
        state: 'TX', town: 'Austin', violation_details: 'Speeding',
        alleged_speed: 85,
        type_specific_data: { alleged_speed: 85, posted_speed_limit: 65 },
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.alleged_speed).toBe(85);
    expect(insertArg.type_specific_data.alleged_speed).toBe(85);
    expect(insertArg.type_specific_data.posted_speed_limit).toBe(65);
  });

  test('succeeds without type_specific_data', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-no-tsd', case_number: 'CDL-NT', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test', customer_type: 'one_time_driver',
        violation_type: 'other', violation_date: '2026-03-01',
        state: 'TX', town: 'Austin', violation_details: 'Other violation',
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.type_specific_data).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('stores violation_severity when provided', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-sev', case_number: 'CDL-SEV', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test', customer_type: 'one_time_driver',
        violation_type: 'speeding', violation_date: '2026-03-01',
        state: 'TX', town: 'Austin', violation_details: 'Speeding',
        violation_severity: 'critical',
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.violation_severity).toBe('critical');
  });

  test('auto-populates violation_severity from registry when not provided', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-auto-sev', case_number: 'CDL-AS', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test', customer_type: 'one_time_driver',
        violation_type: 'dui', violation_date: '2026-03-01',
        state: 'TX', town: 'Austin', violation_details: 'DUI',
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.violation_severity).toBe('critical');
  });

  test('stores violation_regulation_code when provided', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-reg', case_number: 'CDL-REG', status: 'new' },
      error: null,
    });

    const req = makeReq({
      user: { id: 'driver-1', role: 'driver' },
      body: {
        customer_name: 'Test', customer_type: 'one_time_driver',
        violation_type: 'hos_logbook', violation_date: '2026-03-01',
        state: 'TX', town: 'Austin', violation_details: 'HOS violation',
        violation_regulation_code: '49 CFR 395.3(a)',
      },
    });
    const res = makeRes();

    await caseController.createCase(req, res);

    const insertArg = chain.insert.mock.calls[0][0][0];
    expect(insertArg.violation_regulation_code).toBe('49 CFR 395.3(a)');
  });
});
