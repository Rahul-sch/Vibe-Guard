import type { GitHubConfig, PR, PRFile, ReviewInput } from './types.js';

export class GitHubClient {
  constructor(private config: GitHubConfig) {}

  private async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const [owner, repo] = this.config.repo.split('/');
    const url = `https://api.github.com/repos/${owner}/${repo}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  async getPullRequest(prNumber: number): Promise<PR> {
    return this.fetch(`/pulls/${prNumber}`);
  }

  async getPullRequestFiles(prNumber: number): Promise<PRFile[]> {
    return this.fetch(`/pulls/${prNumber}/files`);
  }

  async postComment(issueNumber: number, body: string): Promise<void> {
    await this.fetch(`/issues/${issueNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  async createReview(prNumber: number, review: ReviewInput): Promise<void> {
    await this.fetch(`/pulls/${prNumber}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }
}
