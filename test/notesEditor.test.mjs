/* hamlive-oss — MIT License. See LICENSE. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

test('TinyMCE is fully removed', () => {
    assert.ok(!existsSync(join(repoRoot, 'client/dist/public/tinymce')), 'vendored tinymce tree must be deleted');
    assert.ok(
        !existsSync(join(repoRoot, 'server/dist/views/partials/featureTinyMceJs.ejs')),
        'TinyMCE feature partial must be deleted',
    );
    assert.ok(
        !/tinymce/i.test(read('client/dist/public/js/byView/myNets/main.js')),
        'myNets view code must not reference tinymce',
    );
    assert.ok(!/tinymce/i.test(read('server/dist/views/myNets.ejs')), 'myNets view must not include tinymce');
});

test('Toast UI Editor is vendored and self-hosted (MIT, no trial)', () => {
    assert.ok(existsSync(join(repoRoot, 'client/dist/public/toastui/toastui-editor-all.min.js')));
    assert.ok(existsSync(join(repoRoot, 'client/dist/public/toastui/toastui-editor.min.css')));
    assert.ok(
        existsSync(join(repoRoot, 'client/dist/public/toastui/toastui-editor-dark.min.css')),
        'dark theme css required — the app has a light/dark toggle',
    );
});

test('myNets wires the notes editor through the feature partial', () => {
    const partial = read('server/dist/views/partials/featureNotesEditorJs.ejs');
    assert.match(partial, /toastui-editor-all\.min\.js/);
    assert.match(partial, /toastui-editor\.min\.css/);
    assert.match(partial, /toastui-editor-dark\.min\.css/);
    assert.match(read('server/dist/views/myNets.ejs'), /featureNotesEditorJs/);
});

test('notes editor integration keeps the sanitized-HTML storage contract', () => {
    const main = read('client/dist/public/js/byView/myNets/main.js');
    assert.match(main, /toastui\.Editor/, 'editor must be instantiated from the vendored global');
    assert.match(main, /getHTML\(\)/, 'notes must still be submitted as HTML for sanitizeNotes()');
    assert.match(main, /setHTML\(/, 'existing HTML notes must load into the editor');
    assert.match(
        read('server/dist/lib/serverUtils.js'),
        /allowedTags:.*'strong'/,
        "sanitizeNotes must allow <strong> — Toast UI emits it for bold, not <b>",
    );
});

test('notes editor follows the app theme', () => {
    const main = read('client/dist/public/js/byView/myNets/main.js');
    assert.match(main, /toastui-editor-dark/, 'editor must apply/remove its dark class with the app theme');
    assert.match(main, /data-theme/, 'theme detection must key off the stamped data-theme attribute');
});
