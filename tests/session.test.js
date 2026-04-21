import { describe, it, expect, beforeAll } from 'vitest';
import { signSession, verifySession, parseCookie } from '../api/_session.js';

beforeAll(() => { process.env.ADMIN_SECRET = 'test-secret'; });

describe('session', () => {
  it('signed session verifies', () => {
    const t = signSession();
    expect(verifySession(t)).toBe(true);
  });

  it('tampered token fails', () => {
    const t = signSession();
    const broken = t.slice(0, -2) + 'zz';
    expect(verifySession(broken)).toBe(false);
  });

  it('malformed token fails', () => {
    expect(verifySession('nope')).toBe(false);
    expect(verifySession('')).toBe(false);
    expect(verifySession(null)).toBe(false);
  });

  it('parseCookie reads values', () => {
    expect(parseCookie('a=1; b=2; c=three')).toEqual({ a: '1', b: '2', c: 'three' });
    expect(parseCookie('')).toEqual({});
    expect(parseCookie(undefined)).toEqual({});
  });
});
