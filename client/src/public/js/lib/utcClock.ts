/* hamlive-oss — MIT License. See LICENSE. */

// Self-registering <hl-utc-clock> element, loaded globally from head.ejs so the
// navbar clock ticks on every view (ported or legacy). Deliberately
// dependency-free — same pattern as themeToggle.ts.

/** Ticking UTC clock for the navbar. Static widget: no store, self-contained. */
class UtcClock extends HTMLElement {
    private timer: number | null = null;
    private readonly clockRoot = this.attachShadow({ mode: 'closed' });

    connectedCallback(): void {
        this.clockRoot.innerHTML = /*html*/ `
            <style>
                span {
                    color: var(--hl-accent-2);
                    font-family: var(--hl-font-mono);
                    font-size: 0.85rem;
                    font-variant-numeric: tabular-nums;
                    letter-spacing: 0.05em;
                    white-space: nowrap;
                }
            </style>
            <span></span>
        `;
        this.tick();
        this.timer = window.setInterval(() => this.tick(), 1000);
    }

    disconnectedCallback(): void {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }

    private tick(): void {
        const span = this.clockRoot.querySelector('span');
        if (span) {
            span.textContent = `${new Date().toISOString().slice(11, 19)} UTC`;
        }
    }
}

customElements.define('hl-utc-clock', UtcClock);

// Loaded with <script type="module">; the empty export keeps tsc treating this
// file as a module (isolated scope) rather than a global script.
export {};
