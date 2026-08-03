import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

interface JwkKey extends crypto.JsonWebKey {
  kid?: string;
}

interface JwksResponse {
  keys?: JwkKey[];
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private static jwksCache: Record<string, crypto.KeyObject> = {};
  private static readonly JWKS_URL =
    'https://qcnvfnoeyftvsjuzjxho.supabase.co/auth/v1/.well-known/jwks.json';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      const decoded = jwt.decode(token, { complete: true });
      const alg = decoded?.header?.alg ?? 'HS256';

      if (alg.startsWith('HS')) {
        const secret = process.env.SUPABASE_JWT_SECRET;
        if (!secret) {
          throw new UnauthorizedException('Server JWT secret not configured');
        }
        jwt.verify(token, secret);
        return true;
      }

      // Asymmetric verification (e.g. ES256 / RS256) via JWKS
      const kid = decoded?.header?.kid ?? 'default';
      let publicKey = SupabaseAuthGuard.jwksCache[kid];

      if (!publicKey) {
        publicKey = await this.fetchAndCachePublicKey(kid);
      }

      jwt.verify(token, publicKey);
      return true;
    } catch (e: unknown) {
      const errMessage = e instanceof Error ? e.message : String(e);
      console.error('SupabaseAuthGuard JWT error:', errMessage);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async fetchAndCachePublicKey(kid: string): Promise<crypto.KeyObject> {
    const response = await fetch(SupabaseAuthGuard.JWKS_URL);
    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch JWKS from Supabase');
    }
    const data = (await response.json()) as JwksResponse;
    const keys = data.keys ?? [];

    for (const jwk of keys) {
      try {
        const keyObj = crypto.createPublicKey({ key: jwk, format: 'jwk' });
        const keyId = jwk.kid ?? 'default';
        SupabaseAuthGuard.jwksCache[keyId] = keyObj;
      } catch {
        // ignore invalid keys
      }
    }

    const matchedKey =
      SupabaseAuthGuard.jwksCache[kid] ??
      Object.values(SupabaseAuthGuard.jwksCache)[0];
    if (!matchedKey) {
      throw new UnauthorizedException('No matching public key found for token');
    }
    return matchedKey;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
