export interface RefreshTokenRecord {
  token: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
}

export class RefreshTokenService {
  private tokens = new Map<string, RefreshTokenRecord>();

  create(userId: string, token: string, expiresAt: Date) {
    const record: RefreshTokenRecord = {
      token,
      userId,
      expiresAt,
      revoked: false,
    };

    this.tokens.set(token, record);
    return record;
  }

  rotate(token: string, nextToken: string, expiresAt: Date) {
    const current = this.tokens.get(token);

    if (!current || current.revoked) {
      throw new Error("Invalid refresh token");
    }

    current.revoked = true;

    return this.create(current.userId, nextToken, expiresAt);
  }

  revoke(token: string) {
    const current = this.tokens.get(token);

    if (current) {
      current.revoked = true;
    }
  }

  validate(token: string) {
    const current = this.tokens.get(token);

    if (!current || current.revoked) {
      return false;
    }

    return current.expiresAt > new Date();
  }
}
