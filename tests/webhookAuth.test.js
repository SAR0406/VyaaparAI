'use strict';

const crypto = require('crypto');
const { verifyMetaSignature, captureRawBody } = require('../src/middleware/webhookAuth');

function makeResMock() {
  const res = { _status: null };
  res.sendStatus = (code) => { res._status = code; return res; };
  return res;
}

describe('captureRawBody', () => {
  test('attaches raw body buffer to req', () => {
    const req = {};
    const buf = Buffer.from('{"hello":"world"}');
    captureRawBody(req, {}, buf);
    expect(req.rawBody).toEqual(buf);
  });
});

describe('verifyMetaSignature', () => {
  const SECRET = 'test_app_secret_12345';
  const BODY = Buffer.from('{"object":"whatsapp_business_account"}');

  function sign(secret, body) {
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return `sha256=${sig}`;
  }

  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = SECRET;
    delete process.env.SANDBOX_MODE;
    // Force non-test environment for these checks
    process.env.NODE_ENV = 'integration';
  });

  afterEach(() => {
    delete process.env.WHATSAPP_APP_SECRET;
    process.env.NODE_ENV = 'test';
  });

  test('calls next() for valid signature', () => {
    const req = {
      headers: { 'x-hub-signature-256': sign(SECRET, BODY) },
      rawBody: BODY,
    };
    const res = makeResMock();
    const next = jest.fn();
    verifyMetaSignature(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._status).toBeNull();
  });

  test('returns 401 for missing signature header', () => {
    const req = { headers: {}, rawBody: BODY };
    const res = makeResMock();
    const next = jest.fn();
    verifyMetaSignature(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for wrong signature', () => {
    const req = {
      headers: { 'x-hub-signature-256': 'sha256=deadbeef' },
      rawBody: BODY,
    };
    const res = makeResMock();
    const next = jest.fn();
    verifyMetaSignature(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when SANDBOX_MODE=true (skips check)', () => {
    process.env.SANDBOX_MODE = 'true';
    const req = { headers: {}, rawBody: BODY };
    const res = makeResMock();
    const next = jest.fn();
    verifyMetaSignature(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('calls next() when NODE_ENV=test (skips check)', () => {
    process.env.NODE_ENV = 'test';
    const req = { headers: {}, rawBody: BODY };
    const res = makeResMock();
    const next = jest.fn();
    verifyMetaSignature(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 500 when rawBody is missing', () => {
    const req = {
      headers: { 'x-hub-signature-256': sign(SECRET, BODY) },
      // rawBody intentionally absent
    };
    const res = makeResMock();
    const next = jest.fn();
    verifyMetaSignature(req, res, next);
    expect(res._status).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });
});
