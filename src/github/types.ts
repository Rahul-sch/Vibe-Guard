export interface GitHubConfig {
  token: string;
  repo: string; // "owner/repo"
}

export interface InstallOptions {
  autoFix: boolean;
  severityThreshold: 'critical' | 'warning' | 'info';
  aiVerify: boolean;
}

export interface PR {
  number: number;
  title: string;
  state: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
}

export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface ReviewInput {
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  body?: string;
  comments?: ReviewComment[];
}

export interface ReviewComment {
  path: string;
  line: number;
  body: string;
}
