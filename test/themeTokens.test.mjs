/* hamlive-oss — MIT License. See LICENSE. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(repoRoot, 'client/dist/public/css/tokens.css');
const bootstrapPartialPath = join(
    repoRoot,
    'server/dist/views/partials/featureBootStrapCss.ejs',
);

/** Semantic palette tokens that must be defined in every theme block. */
const PALETTE_TOKENS = [
    '--hl-ground',
    '--hl-surface',
    '--hl-surface-raised',
    '--hl-line',
    '--hl-text',
    '--hl-text-strong',
    '--hl-text-dim',
    '--hl-accent',
    '--hl-accent-contrast',
    '--hl-accent-2',
    '--hl-live',
    '--hl-danger',
    '--hl-success',
    '--hl-warning',
];

/** Legacy --hl-* names (from main.css) that must become aliases, not raw colors. */
const LEGACY_ALIASES = [
    '--hl-primary',
    '--hl-secondary',
    '--hl-secondary-rgba',
    '--hl-light',
    '--hl-dark',
    '--hl-quaternary',
    '--hl-quinary',
    '--hl-input-bg',
    '--hl-input-color',
    '--hl-input-placeholder-color',
    '--hl-modal-content-bg',
    '--hl-modal-content-color',
    '--hl-accordion-bg',
    '--hl-accordion-border-color',
    '--hl-accordion-icon-color',
    '--hl-accordion-button-bg',
    '--hl-accordion-button-active-bg',
    '--hl-table-border-color',
    '--hl-table-hover-color',
    '--hl-offcanvas-color',
    '--hl-offcanvas-bg-color',
    '--hl-offcanvas-border-color',
    '--hl-navbar-dark-color',
    '--hl-navbar-dark-hover-color',
    '--hl-navbar-dark-active-color',
    '--hl-tooltip-bg',
];

/** Extract the body of a top-level block whose header matches `headerRe`. */
function blockBody(css, headerRe) {
    const start = css.search(headerRe);
    if (start === -1) return null;
    const open = css.indexOf('{', start);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') {
            depth--;
            if (depth === 0) return css.slice(open + 1, i);
        }
    }
    return null;
}

function readTokens() {
    return readFileSync(tokensPath, 'utf8');
}

test('tokens.css defines the dark (primary) palette on :root', () => {
    const css = readTokens();
    const root = blockBody(css, /(^|\n)\s*:root\s*\{/);
    assert.ok(root, 'tokens.css must contain a top-level :root block');
    for (const token of PALETTE_TOKENS) {
        assert.match(
            root,
            new RegExp(`${token}\\s*:`),
            `:root must define ${token}`,
        );
    }
});

test('tokens.css redefines the full palette for light mode via prefers-color-scheme', () => {
    const css = readTokens();
    const media = blockBody(css, /@media\s*\(prefers-color-scheme:\s*light\)/);
    assert.ok(media, 'tokens.css must contain @media (prefers-color-scheme: light)');
    for (const token of PALETTE_TOKENS) {
        assert.match(
            media,
            new RegExp(`${token}\\s*:`),
            `light media block must redefine ${token}`,
        );
    }
});

test('tokens.css lets an explicit data-theme stamp win in both directions', () => {
    const css = readTokens();
    for (const theme of ['light', 'dark']) {
        const block = blockBody(
            css,
            new RegExp(`:root\\[data-theme=["']${theme}["']\\]`),
        );
        assert.ok(block, `tokens.css must contain :root[data-theme="${theme}"]`);
        for (const token of PALETTE_TOKENS) {
            assert.match(
                block,
                new RegExp(`${token}\\s*:`),
                `data-theme=${theme} must redefine ${token}`,
            );
        }
    }
});

test('legacy --hl-* names are aliases of palette tokens, never raw colors', () => {
    const css = readTokens();
    for (const legacy of LEGACY_ALIASES) {
        const declarations = [
            ...css.matchAll(new RegExp(`${legacy}\\s*:\\s*([^;]+);`, 'g')),
        ];
        assert.ok(
            declarations.length > 0,
            `tokens.css must re-declare legacy ${legacy}`,
        );
        for (const [, value] of declarations) {
            assert.ok(
                /var\(--hl-|color-mix\(/.test(value),
                `${legacy} must reference a palette token, got: ${value.trim()}`,
            );
            assert.ok(
                !/#[0-9a-fA-F]{3,8}\b/.test(value),
                `${legacy} must not contain a raw hex color, got: ${value.trim()}`,
            );
        }
    }
});

test('tokens.css is linked after main.min.css so its declarations win the cascade', () => {
    const partial = readFileSync(bootstrapPartialPath, 'utf8');
    const mainIdx = partial.indexOf('/css/main.min.css');
    const tokensIdx = partial.indexOf('/css/tokens.css');
    assert.ok(mainIdx !== -1, 'partial must link main.min.css');
    assert.ok(tokensIdx !== -1, 'partial must link tokens.css');
    assert.ok(
        tokensIdx > mainIdx,
        'tokens.css must be linked after main.min.css',
    );
});
