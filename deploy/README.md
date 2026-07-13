# Deployment — nets.n1cck.radio

Production deployment of this fork to **gondor** (rootless podman, tailnet-only) behind
**Caddy** on the `routing` host. Everything is driven by `.github/workflows/deploy.yml`:

```
push to main
  └─ build:  Containerfile → ghcr.io/nkbooth/hamlive-oss:{latest, sha-<shortsha>}
  └─ deploy: op inject deploy/.env.production.tpl → .env   (1Password service account)
             join tailnet (tailscale/github-action, ephemeral tag:ci node)
             scp compose.prod.yml + .env → gondor:~/services/hamlive/
             ssh gondor: podman compose pull && up -d
```

Each deploy pins the immutable `sha-<shortsha>` tag via `IMAGE_TAG` in the shipped `.env`.
**Rollback:** edit `IMAGE_TAG` in `~/services/hamlive/.env` on gondor and re-run
`podman compose -f compose.yml up -d`.

## Secrets

The single GitHub secret is `OP_SERVICE_ACCOUNT_TOKEN` (a 1Password service account scoped
to the `hamlive-prod` vault). Everything else lives in that vault:

| Item            | Fields                                    | Used by         |
| --------------- | ----------------------------------------- | --------------- |
| `app`           | `cookie-session-key`, `magic-link-secret` | app `.env`      |
| `smtp`          | `host`, `username`, `password`            | app `.env`      |
| `google-oauth`  | `client-id`, `client-secret`              | app `.env`      |
| `qrz`           | `username`, `password`                    | app `.env`      |
| `tailscale-ci`  | `client-id`, `client-secret`              | CI tailnet join |
| `gondor-deploy` | `private-key`, `host-key`                 | CI ssh/scp      |

`gondor-deploy/host-key` is a full `known_hosts` line (`gondor ssh-ed25519 AAAA…`).
Rotating any secret = update the vault item, re-run the deploy workflow.

GetStream chat and Azure Maps geocoding are currently disabled: their references are
commented out in `.env.production.tpl` (both features degrade gracefully). To re-enable,
create the vault item (`getstream`: `api-key`/`api-secret`; `azure-maps`: `geo-key`) and
uncomment the lines.

## One-time setup checklist

**1Password:** create vault `hamlive-prod` + items above; create a service account with
read access to it; put its token in the repo's `OP_SERVICE_ACCOUNT_TOKEN` secret.

**Tailscale admin console:** OAuth client permitted to create ephemeral `tag:ci` nodes
(tag owner in ACL); ACL rule allowing `tag:ci → gondor:22`.

⚠️ gondor answers tailnet SSH with **Tailscale SSH** (not sshd), so CI authentication is
decided by an ACL `ssh` rule — `{"action": "accept", "src": ["tag:ci"], "dst": ["gondor"],
"users": ["nick"]}` — not by `authorized_keys`. The `gondor-deploy` key still ships as a
fallback (it becomes load-bearing only if Tailscale SSH is ever disabled), and the pinned
`host-key` is the one Tailscale SSH presents; update that vault field if Tailscale SSH is
turned off.

**Google Cloud:** OAuth credentials with redirect URI
`https://nets.n1cck.radio/auth/google/redirect`.

**gondor (rootless podman, existing user):**

```bash
sudo loginctl enable-linger $USER            # containers survive logout
systemctl --user enable --now podman.socket  # lets podman compose use docker-compose
sudo dnf install docker-compose              # Go compose v2 — full healthcheck/depends_on fidelity
systemctl --user enable podman-restart.service  # restart policy across reboots
mkdir -p ~/services/hamlive
# append the CI deploy public key:
#   ~/.ssh/authorized_keys
```

Port 3000 is published on all interfaces; the host firewall is the exposure control
(verify `firewall-cmd --list-all` does not open 3000 to the WAN zone — tailnet traffic
arrives via `tailscale0`).

**GHCR (after the first successful build):** in the GitHub package settings, link the
`hamlive-oss` package to the repo and set visibility to **public** so gondor pulls without
credentials.

**routing (Caddy):** site block proxying `nets.n1cck.radio` → `gondor:3000` over the
tailnet. Caddy's defaults are correct for SSE (no idle timeout, auto-unbuffered
`text/event-stream`); do not set `response_header_timeout` under ~60 s for this site.
Plus public DNS for `nets.n1cck.radio` → routing.

## Smoke test

```bash
curl -s http://gondor:3000/api | head -c 200   # from any tailnet machine — JSON = app + DB up
podman ps                                      # on gondor: hamlive-app (healthy), hamlive-mongo (healthy)
curl -s https://nets.n1cck.radio/api           # after Caddy + DNS
```

Then sign in with Google, open a net, and confirm SSE updates stay live for >2 minutes.
Magic-link email requires the `smtp` vault item to point at a working relay.
