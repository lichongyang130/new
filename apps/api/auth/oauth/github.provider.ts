import { OAuthProvider, OAuthProfile } from './oauth.provider';

export class GithubOAuthProvider implements OAuthProvider {
  name(): string {
    return 'github';
  }

  async authenticate(code: string): Promise<OAuthProfile> {
    return {
      provider: 'github',
      providerUserId: code,
    };
  }
}
