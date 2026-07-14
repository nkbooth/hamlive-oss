/* hamlive-oss — MIT License. See LICENSE. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

test('server locals expose the deployed version from package.json', () => {
    const serverUtils = read('server/dist/lib/serverUtils.js');
    assert.match(
        serverUtils,
        /package\.json/,
        'serverUtils must source the version from package.json — the release pipeline bumps it there',
    );
    assert.match(serverUtils, /version:/, 'addServerInfo() must include a version field in server locals');
});

test('footer quietly renders the deployed version', () => {
    const footer = read('server/dist/views/partials/footer.ejs');
    assert.match(footer, /server\.version/, 'footer must render server.version');
});

test('footer version links to the GitHub release for the deployed tag', () => {
    const pkg = JSON.parse(read('package.json'));
    assert.ok(pkg.repository?.url, 'package.json must declare the repository url');

    const serverUtils = read('server/dist/lib/serverUtils.js');
    assert.match(
        serverUtils,
        /releases\/tag/,
        'server locals must carry a release-page URL derived from the repository url',
    );

    const footer = read('server/dist/views/partials/footer.ejs');
    assert.match(footer, /server\.versionUrl/, 'footer must link the version via server.versionUrl');
    assert.match(footer, /if \(server\.versionUrl\)/, 'link must degrade to plain text when no repo url is set');
});
