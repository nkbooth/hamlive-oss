/* hamlive-oss — MIT License. See LICENSE. */

// Classic (non-module) script loaded synchronously in <head>: stamps the
// persisted theme on <html> before first paint so there is no wrong-theme
// flash. No exports on purpose — keep this file dependency-free and tiny.
(() => {
    try {
        const saved = window.localStorage.getItem('hl-theme');
        if (saved === 'dark' || saved === 'light') {
            document.documentElement.dataset['theme'] = saved;
        }
    } catch {
        // Storage unavailable (private mode): fall back to the OS preference.
    }
})();
