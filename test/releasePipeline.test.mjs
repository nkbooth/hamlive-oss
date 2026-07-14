/* hamlive-oss — MIT License. See LICENSE. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

test('deploy workflow is gated on release publication, not merge to main', () => {
    const wf = read('.github/workflows/deploy.yml');
    assert.match(wf, /release:\s*\n\s*types:\s*\[published\]/, 'deploy must trigger on published releases');
    assert.ok(
        !/push:\s*\n\s*branches:/.test(wf),
        'deploy must no longer trigger on push to main',
    );
    assert.match(wf, /workflow_dispatch:/, 'manual dispatch escape hatch must remain');
});

test('deploy pins the image to the release tag being deployed', () => {
    const wf = read('.github/workflows/deploy.yml');
    assert.match(wf, /release\.tag_name/, 'image tag must come from the release tag');
    assert.match(wf, /inputs\.tag/, 'dispatched deploys must accept an explicit tag');
});

test('release-please workflow derives semver and chains the deploy', () => {
    const wf = read('.github/workflows/release-please.yml');
    assert.match(wf, /googleapis\/release-please-action/);
    assert.match(wf, /release_created/, 'deploy must only chain when a release was cut');
    assert.match(wf, /gh workflow run deploy\.yml/, 'release must dispatch the deploy workflow');
});

test('release-please manifest and package.json agree on the current version', () => {
    const manifest = JSON.parse(read('.release-please-manifest.json'));
    const pkg = JSON.parse(read('package.json'));
    assert.equal(manifest['.'], pkg.version, 'manifest and package.json versions must match');
    assert.ok(
        existsSync(join(repoRoot, 'release-please-config.json')),
        'release-please-config.json must exist',
    );
});

test('pre-push hook runs containerized tests, trivy, and semgrep', () => {
    const hookPath = join(repoRoot, '.githooks/pre-push');
    assert.ok(existsSync(hookPath), '.githooks/pre-push must exist');
    const hook = read('.githooks/pre-push');
    assert.match(hook, /trivy/, 'CVE/secret scan via trivy');
    assert.match(hook, /semgrep/, 'static analysis via semgrep');
    assert.match(hook, /--test/, 'test suite must run before push');
    assert.match(hook, /podman/, 'scans must run in containers');
    assert.ok(statSync(hookPath).mode & 0o111, 'pre-push must be executable');
});

test('commit-msg hook enforces Conventional Commits', () => {
    const hookPath = join(repoRoot, '.githooks/commit-msg');
    assert.ok(existsSync(hookPath), '.githooks/commit-msg must exist');
    const hook = read('.githooks/commit-msg');
    assert.match(hook, /feat/, 'hook must know the conventional types');
    assert.match(hook, /BREAKING|!/, 'hook must allow breaking-change markers');
    assert.ok(statSync(hookPath).mode & 0o111, 'commit-msg must be executable');
});

test('npm prepare wires git to the committed hooks', () => {
    const pkg = JSON.parse(read('package.json'));
    assert.match(
        pkg.scripts.prepare ?? '',
        /core\.hooksPath/,
        'npm install must point core.hooksPath at .githooks',
    );
});
