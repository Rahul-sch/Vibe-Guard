import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import type { InstallOptions } from './types.js';
import { generateWorkflowYAML } from './workflow-generator.js';

export function installGitHubWorkflow(projectPath: string, options: InstallOptions): void {
  const workflowDir = join(projectPath, '.github', 'workflows');
  const workflowFile = join(workflowDir, 'vibeguard.yml');

  // Create directory if needed
  if (!existsSync(workflowDir)) {
    mkdirSync(workflowDir, { recursive: true });
  }

  // Check if workflow already exists
  if (existsSync(workflowFile)) {
    throw new Error('VibeGuard workflow already exists. Remove .github/workflows/vibeguard.yml first.');
  }

  // Generate workflow content
  const workflow = generateWorkflowYAML(options);

  // Write workflow file
  writeFileSync(workflowFile, workflow);

  console.log('✓ Created .github/workflows/vibeguard.yml');

  // Try to detect repo
  try {
    // Security: Use spawnSync with argument array to prevent command injection
    const { spawnSync } = require('child_process');
    const result = spawnSync('git', ['config', '--get', 'remote.origin.url'], {
      cwd: projectPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    if (result.error) {
      throw result.error;
    }
    const remoteUrl = result.stdout.trim();

    const repoMatch = remoteUrl.match(/github\.com[:/]([^/]+\/[^/.]+)/);
    if (repoMatch) {
      console.log(`\n📋 Next steps:`);
      console.log(`   1. Commit and push: git add .github/workflows/vibeguard.yml && git commit -m "chore: add VibeGuard workflow" && git push`);
      console.log(`   2. Open a test PR to see VibeGuard in action`);
      if (options.autoFix) {
        console.log(`   3. Comment \`/vibeguard fix\` to auto-fix issues`);
      }
    }
  } catch {
    console.log('\n📋 Next steps: Commit .github/workflows/vibeguard.yml and push to trigger on PRs');
  }
}
