/* hamlive-oss — MIT License. See LICENSE. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

test('netProfile model carries an optional UTC weekly schedule', () => {
    const model = read('server/dist/models/netProfile.js');
    assert.match(model, /schedule/);
    assert.match(model, /dayOfWeekUtc/);
    assert.match(model, /timeUtc/);
});

test('livenets list endpoint publishes upcoming scheduled nets', () => {
    const controller = read('server/dist/controllers/liveNetController.js');
    assert.match(controller, /upcoming/);
    assert.match(controller, /nextStartsAt/);
});

test('client types cover upcoming nets', () => {
    const types = read('client/src/public/js/types/commonTypes.ts');
    assert.match(types, /interface UpcomingNet/);
    assert.match(types, /upcoming:\s*UpcomingNet\[\]/);
    const guards = read('client/src/public/js/types/commonTypesupport.ts');
    assert.match(guards, /isUpcomingNet/);
});

test('store merges pending and scheduled nets into one up-next list', () => {
    const stores = read('client/src/public/js/lib/stores.ts');
    assert.match(stores, /UpNextEntry/);
    assert.match(stores, /'scheduled'/);
    assert.match(stores, /'pending'/);
});
