/* hamlive-oss — MIT License. See LICENSE. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

test('livenets list endpoint satisfies the EndPointResponse contract', () => {
    const controller = read('server/dist/controllers/liveNetController.js');
    assert.match(controller, /ttlMs/, 'list response must carry ttlMs (store poll interval)');
    assert.match(controller, /ssePath/, 'list response must carry ssePath (null = keep polling)');
});

test('net list types and guards exist', () => {
    const types = read('client/src/public/js/types/commonTypes.ts');
    assert.match(types, /interface NetListItem/);
    assert.match(types, /interface NetListResponse extends EndPointResponse/);
    const guards = read('client/src/public/js/types/commonTypesupport.ts');
    assert.match(guards, /isNetListResponse/);
});

test('NetListReactiveStore exists and validates with the guard', () => {
    const stores = read('client/src/public/js/lib/stores.ts');
    assert.match(stores, /class NetListReactiveStore extends ReactiveStore<NetListResponse>/);
    assert.match(stores, /isNetListResponse/);
});

test('dashboard widgets registered as custom elements', () => {
    const widgets = read('client/src/public/js/lib/widgets.ts');
    assert.match(widgets, /class NetCards/, 'live-net cards widget');
    assert.match(widgets, /class NetUpNext/, 'up-next table widget');
    assert.match(widgets, /initElement\('net-cards'/);
    assert.match(widgets, /initElement\('net-upnext'/);
});

test('dashboard has a TypeScript composition root following the liveNet pattern', () => {
    const mainPath = 'client/src/public/js/byView/dashboard/main.ts';
    assert.ok(existsSync(join(repoRoot, mainPath)), `${mainPath} must exist`);
    const main = read(mainPath);
    assert.match(main, /NetListReactiveStore/);
    assert.match(main, /initAndLogError/);
    assert.match(main, /NetCards\.init/);
    assert.match(main, /NetUpNext\.init/);
});

test('dashboard view is widget-based, legacy template removed', () => {
    const view = read('server/dist/views/dashboard.ejs');
    assert.match(view, /<hl-net-cards>/);
    assert.match(view, /<hl-net-upnext>/);
    assert.ok(!/netTemplate/.test(view), 'legacy clone-template must be gone');
    assert.ok(!/onairimg/.test(view), 'legacy on-air image markup must be gone');
});
