import { randomBytes } from 'node:crypto';
import type { UserRepository, UserRecord } from '../user/user.repository';
import type { RefreshTokenService } from './refresh-token.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: Pick<UserRecord, 'id' | 'email' | 'displayName' | 'roles'>;
}

export type PasswordVerifier = (password: string, passwordHash: string) => Promise<boolean>;
export type AccessTokenIssuer = (user: Pick<UserRecord, 'id' | 'email' | 'roles'>) => Promise<string>;

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly verifyPassword: PasswordVerifier,
    private readonly issueAccessToken: AccessTokenIssuer,
    private readonly refreshTokens: RefreshTokenService,
    private readonly refreshTtlMs = 30 * 24 * 60 * 60 * 1000,
  ) {}

  async login(input: LoginRequest): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password) throw new Error('Email and password are required');

    const user = this.users.findByEmail(email);
    // Do not reveal whether an account exists.
    if (!user?.passwordHash || !(await this.verifyPassword(input.password, user.passwordHash))) {
      throw new Error('Invalid email or password');
    }

    const accessToken = await this.issueAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });
    if (!accessToken) throw new Error('Access token issuer returned an empty token');

    const refreshToken = randomBytes(48).toString('base64url');
    this.refreshTokens.create(user.id, refreshToken, new Date(Date.now() + this.refreshTtlMs));

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, displayName: user.displayName, roles: user.roles },
    };
  }

  async logout(userId: string): Promise<void> {
    // Token revocation is token-specific; callers should revoke the session's refresh token.
    if (!userId.trim()) throw new Error('User id is required');
  }
}
