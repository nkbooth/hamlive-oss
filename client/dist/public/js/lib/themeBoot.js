"use strict";
(() => {
    try {
        const saved = window.localStorage.getItem('hl-theme');
        if (saved === 'dark' || saved === 'light') {
            document.documentElement.dataset['theme'] = saved;
        }
    }
    catch {
    }
})();
//# sourceMappingURL=themeBoot.js.map