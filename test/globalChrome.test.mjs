/* hamlive-oss — MIT License. See LICENSE. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

test('root URL always lands on the dashboard', () => {
    const server = read('server/dist/server.js');
    assert.ok(
        !/redirect\('\/views\/intro'\)/.test(server),
        'root handler must not divert anonymous visitors to the intro view',
    );
});

test('theme boot stamps persisted theme before first paint', () => {
    assert.ok(existsSync(join(repoRoot, 'client/src/public/js/lib/themeBoot.ts')));
    const head = read('server/dist/views/partials/head.ejs');
    assert.match(head, /themeBoot\.js/);
});

test('theme toggle is a self-registering element present in the navbar', () => {
    const toggle = read('client/src/public/js/lib/themeToggle.ts');
    assert.match(toggle, /customElements\.define\('hl-theme-toggle'/);
    assert.match(toggle, /localStorage/);
    const head = read('server/dist/views/partials/head.ejs');
    assert.match(head, /themeToggle\.js/);
    const navbar = read('server/dist/views/partials/navbar.ejs');
    assert.match(navbar, /<hl-theme-toggle/);
});

test('navbar carries the UTC clock widget, registered globally for every view', () => {
    const navbar = read('server/dist/views/partials/navbar.ejs');
    assert.match(navbar, /<hl-utc-clock/);
    const clock = read('client/src/public/js/lib/utcClock.ts');
    assert.match(clock, /customElements\.define\('hl-utc-clock'/);
    const head = read('server/dist/views/partials/head.ejs');
    assert.match(head, /utcClock\.js/);
    const widgets = read('client/src/public/js/lib/widgets.ts');
    assert.ok(!/class UtcClock/.test(widgets), 'UtcClock must not live in per-view widgets anymore');
});
