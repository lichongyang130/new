export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async login(input: LoginRequest): Promise<AuthResult> {
    // Placeholder for database user lookup and password verification.
    // Real implementation will connect to UserRepository.
    return {
      accessToken: `access-token-for-${input.email}`,
      refreshToken: `refresh-token-for-${input.email}`,
    };
  }

  async logout(_userId: string): Promise<void> {
    // Refresh token revocation will be implemented with Redis storage.
  }
}
