import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import * as jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-supabase-secret-32-chars-long!!';

function makeContext(authHeader?: string): ExecutionContext {
  const request = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('[Fase 1] SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;

  beforeEach(() => {
    guard = new SupabaseAuthGuard();
    process.env.SUPABASE_JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
  });

  it('allows a valid Bearer token', () => {
    const token = jwt.sign(
      { sub: 'user-123', role: 'authenticated' },
      TEST_SECRET,
      { algorithm: 'HS256' },
    );
    const result = guard.canActivate(makeContext(`Bearer ${token}`));
    expect(result).toBe(true);
  });

  it('rejects when Authorization header is missing', () => {
    expect(() => guard.canActivate(makeContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when scheme is not Bearer', () => {
    const token = jwt.sign({ sub: 'user-123' }, TEST_SECRET);
    expect(() => guard.canActivate(makeContext(`Basic ${token}`))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with a wrong secret', () => {
    const token = jwt.sign({ sub: 'user-123' }, 'wrong-secret');
    expect(() => guard.canActivate(makeContext(`Bearer ${token}`))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ sub: 'user-123' }, TEST_SECRET, { expiresIn: -1 });
    expect(() => guard.canActivate(makeContext(`Bearer ${token}`))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a malformed token string', () => {
    expect(() => guard.canActivate(makeContext('Bearer not.a.jwt'))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when SUPABASE_JWT_SECRET env var is not set', () => {
    delete process.env.SUPABASE_JWT_SECRET;
    const token = jwt.sign({ sub: 'user-123' }, TEST_SECRET);
    expect(() => guard.canActivate(makeContext(`Bearer ${token}`))).toThrow(
      UnauthorizedException,
    );
  });
});
