/* hamlive-oss — MIT License. See LICENSE. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

test('configLib maps APP_CALLSIGN into config', () => {
    const configLib = read('server/dist/lib/configLib.js');
    assert.match(configLib, /app_callsign:\s*process\.env\.APP_CALLSIGN/);
});

test('serverInfo exposes appCallsign to views', () => {
    const serverUtils = read('server/dist/lib/serverUtils.js');
    assert.match(serverUtils, /app_callsign/, 'must destructure app_callsign from conf');
    assert.match(serverUtils, /appCallsign/, 'must expose appCallsign on server info');
});

test('navbar links to My Nets, not Start Net', () => {
    const navbar = read('server/dist/views/partials/navbar.ejs');
    assert.match(navbar, />\s*My Nets\s*</);
    assert.ok(!/Start Net/.test(navbar));
});

test('navbar brands from config, not hard-coded strings', () => {
    const navbar = read('server/dist/views/partials/navbar.ejs');
    assert.match(navbar, /server\.appCallsign/, 'callsign block must render from server.appCallsign');
    assert.match(navbar, /server\.appName/, 'wordmark must render from server.appName');
    assert.ok(!/N1CCK/.test(navbar), 'no hard-coded callsign in the template');
});

test('footer is token-styled, not legacy utility classes', () => {
    const footer = read('server/dist/views/partials/footer.ejs');
    assert.match(footer, /hl-footer/);
    assert.ok(!/text-quaternary/.test(footer), 'quaternary alias is a surface color, not a text color');
});

test('footer keeps the Ham.Live attribution and MIT credit', () => {
    const footer = read('server/dist/views/partials/footer.ejs');
    assert.match(footer, /Ham\.Live/, 'footer must credit Ham.Live by name');
    assert.match(footer, /href="https:\/\/(www\.)?ham\.live/, 'credit must link to the upstream project');
    assert.match(footer, /MIT/, 'footer must mention the MIT License');
});

test('.env.example documents APP_CALLSIGN', () => {
    const envExample = read('.env.example');
    assert.match(envExample, /APP_CALLSIGN/);
});
