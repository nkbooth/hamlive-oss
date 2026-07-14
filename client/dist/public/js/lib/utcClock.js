class UtcClock extends HTMLElement {
    timer = null;
    clockRoot = this.attachShadow({ mode: 'closed' });
    connectedCallback() {
        this.clockRoot.innerHTML = `
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
    disconnectedCallback() {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
    }
    tick() {
        const span = this.clockRoot.querySelector('span');
        if (span) {
            span.textContent = `${new Date().toISOString().slice(11, 19)} UTC`;
        }
    }
}
customElements.define('hl-utc-clock', UtcClock);
export {};
//# sourceMappingURL=utcClock.js.map