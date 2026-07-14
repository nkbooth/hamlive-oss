# Views & runtime hooks

This page centralizes the runtime behavior embedded in EJS views and documents the DOM hooks, third-party partials, and custom events that client code (widgets & bootstraps) rely on.

Why this matters

EJS views are the bridge between server-rendered pages and the per-view TypeScript ESM bootstraps. They inject configuration, script imports, and DOM placeholders (slots) used by the client framework. Tests and maintenance code should refer to this file for the contracts the server provides to the browser.

Quick file map

- `server/dist/views/*.ejs` — compiled view templates (source in `server/src/views` when present)
- Important view: `server/dist/views/liveNet.ejs` — includes the chat container, emoji picker partial, and the per-view `<script type="module" src="/js/byView/<%= VIEW %>/main.js">` bootstrap.
- Other views: `favorites.ejs`, `dashboard.ejs`, `myNets.ejs`, etc. — typically include a per-view bootstrap and specific `hl-*` element placeholders.

1. serverInfo meta (single-page config)

- File: `server/dist/views/partials/featureServerInfo.ejs`
- Injected element: `<meta id="serverInfo" data-... />`
- Key `data-` attributes commonly used by client code:
    - data-node-env, data-app, data-view
    - data-request-rate-factor, data-http-client-timeout, data-away-in-ms, data-cmd-help-url
    - data-is-logged-in, data-new-account, data-user-id, data-call-sign, data-display-name
    - data-log-level, data-ts, data-chat, data-analytics, data-ok-to-advertise
- Usage: bootstraps and stores read these attributes for feature toggles, user identity and timing defaults.
- Test tip: create a meta fixture before importing a bootstrap:

```js
const m = document.createElement('meta');
m.id = 'serverInfo';
m.setAttribute('data-view', 'liveNet');
m.setAttribute('data-is-logged-in', 'true');
// add others as needed
document.head.appendChild(m);
```

2. Per-view ESM entry modules (current behavior)

- Views include a per-view entry module as:

```html
<script src="/js/byView/<%= VIEW %>/main.js" type="module"></script>
```

- In the current source, per-view `main.ts` files compiled to `/js/byView/<view>/main.js` typically perform top-level initialization: they create Presence instances, instantiate EndPointClient(s) and ReactiveStore instances, and call widget `init()` functions. See `client/src/public/js/byView/liveNet/main.ts` for an example of the current top-level initialization pattern.

3. Chat (GetStream.io)

- Where: `liveNet.ejs` conditionally includes a chat container when `user.chat` is truthy (FlexOptions flag):

```html
<% if (user.chat) { %>
<div id="stream-chat-container" class="flex-grow-1 w-100 chat-container p-2"></div>
<% } %>
```

- Flow:
    1. `main.ts` calls `ChatWidget.init(liveNetStore, level)`.
    2. `ChatWidget.init()` replaces `#stream-chat-container` with an `<hl-chat>` custom element.
    3. On `connectedCallback`, the widget fetches a token from `GET /api/endorse/chat/:npid` and initializes the GetStream.io SDK.
- The Stream Chat SDK is resolved via importmap in `head.ejs`, pointing to a vendored local file:

```html
<script type="importmap">
  { "imports": { "stream-chat": "/js/vendor/stream-chat.9.27.2.mjs" } }
</script>
```

- `liveNet.ejs` also conditionally includes `featureEmojiPicker.ejs` when `user.chat` is true:

```ejs
<% if (user.chat) { %>
<%- include('./partials/featureEmojiPicker') %>
<% } %>
```

- Test guidance: stub `GET /api/endorse/chat/:id` and avoid executing the Stream SDK import in jsdom by mocking `StreamChat`.

4. Slot contracts and `hl-*` placeholders

- Views compose the UI by placing custom elements as placeholders. Examples:
    - `liveNet.ejs` uses `<hl-stationtable>`, `<hl-netcontrol-button>`, `<hl-netnotes>`, `<hl-stats-table>` with named slots `ncs`, `loggers`, `relays`, `count`.
    - `favorites.ejs` uses `<hl-favlist>`.
- Contract: server-side EJS provides DOM slots but widgets supply rendering. Tests that mount widgets should provide necessary slot content or assert the widget renders into the expected container.

5. Feature toggles & optional partials

- Partial files under `server/dist/views/partials/` include optional integrations used by the running application:
    - analytics: `featureGoogleAnalytics.ejs` (off by default; see [runtime-config](runtime-config.md))
    - ads: `adTopBar.ejs` / `featureAdPlugg.ejs` (off by default)
    - notes editor: `featureNotesEditorJs.ejs` — Toast UI Editor, included only in `myNets.ejs` (self-hosted from `client/dist/public/toastui/`)
    - emoji picker: `featureEmojiPicker.ejs` — included in `liveNet.ejs` when `user.chat` is true; loads the `emoji-picker-element` web component
    - Bootstrap Icons: `featureBootstrapIcons.ejs` — CSS link to Bootstrap Icons CDN
    - axios helper import: `featureAxiosJs.ejs`
    - Bootstrap CSS/JS: `featureBootStrapCss.ejs` / `featureBootStrapJs.ejs`
- Tests or development setups can stub or omit these partials as needed.

6. CDN imports and jsdom tests

- Several partials import code from CDNs via `<script src="https://...">`. In jsdom tests these are typically avoided by stubbing the global objects the scripts create.
- The Stream Chat SDK and `immer` are **not** loaded from a CDN — they are vendored locally under `/js/vendor/` and resolved via importmap (see `head.ejs`).

7. Quick reference — files to inspect

- `server/dist/views/liveNet.ejs` — chat container + station table + main.js bootstrap
- `server/dist/views/favorites.ejs` — favorites page
- `server/dist/views/myNets.ejs` — net management (includes the Toast UI notes editor)
- `server/dist/views/partials/head.ejs` — importmap (immer, stream-chat) + ES module shims
- `server/dist/views/partials/featureServerInfo.ejs` — serverInfo meta
- `server/dist/views/partials/featureEmojiPicker.ejs` — emoji-picker-element web component
- `server/dist/views/partials/featureBootstrapIcons.ejs` — Bootstrap Icons CSS
- `server/dist/views/partials/featureBootStrapJs.ejs` — Bootstrap helpers and tooltip init

See also

- [Client framework](client-framework.md) — how bootstraps initialize widgets and stores
- [Chat System](chat-system.md) — GetStream.io integration details
- [Documentation Index](../README.md) — documentation hub
