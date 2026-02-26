import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken,
      },
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.cache',
  '.config',
  'dist',
  '.replit',
  '.upm',
  'replit.nix',
  '.local',
  '/tmp',
  'package-lock.json',
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dirPath: string, basePath: string = dirPath): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);

    if (shouldIgnore(relativePath)) continue;

    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, basePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function main() {
  const repoFullName = process.argv[2];
  if (!repoFullName || !repoFullName.includes('/')) {
    console.error('Usage: npx tsx script/push-to-github.ts owner/repo');
    console.error('Example: npx tsx script/push-to-github.ts myuser/the-meridian');
    process.exit(1);
  }

  const [owner, repo] = repoFullName.split('/');
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });

  console.log(`Pushing to ${owner}/${repo}...`);

  // Check if repo exists, create if not
  try {
    await octokit.repos.get({ owner, repo });
    console.log('Repository found.');
  } catch (e: any) {
    if (e.status === 404) {
      console.log('Repository not found, creating...');
      await octokit.repos.createForAuthenticatedUser({
        name: repo,
        description: 'The Meridian - News, neutrally synthesized.',
        private: false,
      });
      console.log('Repository created.');
    } else {
      throw e;
    }
  }

  // For empty repos, we need to initialize with a single file first via the Contents API
  let repoIsEmpty = false;
  try {
    await octokit.repos.getBranch({ owner, repo, branch: 'main' });
  } catch (e: any) {
    if (e.status === 404) {
      repoIsEmpty = true;
    }
  }

  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  console.log(`Found ${files.length} files to push.`);

  if (repoIsEmpty) {
    // Initialize the repo with a README so git objects can be created
    console.log('Repository is empty, initializing with README...');
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'Initial commit',
      content: Buffer.from('# The Meridian\n\nNews, neutrally synthesized.\n').toString('base64'),
    });
    console.log('Repository initialized.');
  }

  // Create blobs for all files
  const blobs: { path: string; sha: string; mode: string; type: string }[] = [];

  for (const file of files) {
    const fullPath = path.join(projectDir, file);
    const content = fs.readFileSync(fullPath);
    const base64Content = content.toString('base64');

    const blob = await octokit.git.createBlob({
      owner,
      repo,
      content: base64Content,
      encoding: 'base64',
    });

    blobs.push({
      path: file,
      sha: blob.data.sha,
      mode: '100644',
      type: 'blob',
    });

    process.stdout.write('.');
  }
  console.log('\nBlobs created.');

  // Create tree
  const tree = await octokit.git.createTree({
    owner,
    repo,
    tree: blobs as any,
  });

  // Create commit
  const commit = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Initial commit: The Meridian - News, neutrally synthesized',
    tree: tree.data.sha,
    parents: [],
  });

  // Update main branch ref
  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: commit.data.sha,
      force: true,
    });
  } catch {
    await octokit.git.createRef({
      owner,
      repo,
      ref: 'refs/heads/main',
      sha: commit.data.sha,
    });
  }

  console.log(`Successfully pushed to https://github.com/${owner}/${repo}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
