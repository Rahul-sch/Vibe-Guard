export interface DeviceCodeResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface AuthCredentials {
  accessToken: string;
  tokenType: string;
  scope: string;
  createdAt: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
