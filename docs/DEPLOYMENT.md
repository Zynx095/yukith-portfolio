# Deployment — World Tree rebuild

How the rebuilt portfolio reached production, how it was verified, and how to undo it.

## Setup (unchanged)

Production is the Vercel project **zynx095s-projects / yukith-portfolio**, connected to
`github.com/Zynx095/yukith-portfolio` through Vercel's GitHub integration: every push to `main`
builds and deploys to production; other branches get preview deployments. There is no
`vercel.json` and no CI workflow in the repository — the integration is the deployment mechanism,
and it was not changed.

| Domain | |
|---|---|
| <https://www.yukithjoseph.me> | production (custom domain; `yukithjoseph.me` redirects here) |
| <https://yukith-portfolio.vercel.app> | production (Vercel domain) |

## The version that was in production before

| | |
|---|---|
| Commit | `964d3964fc717a2afaa302b97a95ff6ffbc148df` — "Merge pull request #5 from Zynx095/feat/world-tree-rebuild" (its tree is identical to `6b1b71f` "Resume updated") |
| Vercel deployment | GitHub deployment `6893561096`, environment **Production**, status *success*, 2026-10-06 19:40 UTC — `yukith-portfolio-j9f591t2v-zynx095s-projects.vercel.app` |
| Rollback tag | **`portfolio-pre-world-tree-production`** (annotated, pushed to `origin`) → `964d396` |

The tag is never moved. `main` at `964d396` can be restored on its own at any time (below).

## This deployment

| | |
|---|---|
| Feature branch | `feat/world-tree-rebuild` (rebuild commits `c636148` … , none squashed or rewritten) |
| Integration | normal merge commit of `feat/world-tree-rebuild` into `main` (no fast-forward, no force push) |
| Merge commit deployed | `971c0295909c3a84be53965a7ea8aebd1ed8c98e` (Vercel deployment `7592992776`, Production, success, 2026-11-06 05:16 UTC — `yukith-portfolio-8vupr2w3b-zynx095s-projects.vercel.app`) |
| Follow-up | this file's verification log, merged the same way (docs only; the app is identical) |
| Date | 2026-11-06 |

## Verification log

Checks of the **live** site, 2026-11-06, after deployment `7592992776` (commit `971c029`) finished.
Browser: Microsoft Edge (headless, Chromium) on Windows 11, RTX 5050 Laptop GPU (ANGLE/D3D11).

| Check | Result |
|---|---|
| Vercel production deployment for `971c029` | success (GitHub deployment status) |
| `https://www.yukithjoseph.me/`, `https://yukith-portfolio.vercel.app/`, `/?view=classic` | HTTP 200, the new build (HTML contains the boot script and the new sections; ≈ 33 KB compressed) |
| Feature-branch preview build (`d322ba3`) before merging | success (protected by Vercel Authentication, so not browsed) |
| `scripts/qa-view.mjs --url https://www.yukithjoseph.me` | **34/34 passed** — default Immersive; switcher; Classic without reload; WebGL context released (3 created / 3 lost); persistence across reload; V shortcut and `/` index; 10 round trips (34 WebGL 2 contexts created, 34 lost; heap 54.0 → 56.8 MB after full GC); `?view=classic` and `?view=immersive` precedence; WebGL failing to start → Classic + notice; no WebGL 2 API → Classic before first paint; unrestored context loss → Classic + "Try the 3D view again"; no-JS page complete; phone 390×844 in both modes; no console errors; no failed requests |
| `scripts/qa-world.mjs --url https://www.yukithjoseph.me` | **8/8 passed** — skip link first tab stop, `/` index + Esc, relic label, relic click opens its record (Q-SHIELD), chapter rail jump, no-JS portfolio, no console errors |
| Live screenshots (arrival, reveal, archive, rings, crown, Classic) | rendered as on the local build |
| First visit to a ready world over the network | ≈ 16 s (≈ 9.4 MB of world assets on a first, uncached visit; ≈ 8–9 s locally) |

Not verified: physical phones, Safari, Firefox, integrated GPUs.

## If you don't like the new visuals

You do not have to change production to get a conventional site:

1. **Use the Classic presentation** — <https://www.yukithjoseph.me/?view=classic>. Share that link with
   anyone who should see the Classic portfolio; it opens Classic for that visit.
2. **Use the switcher** — "Immersive / Classic" in the top bar (or press <kbd>V</kbd>). The choice is
   remembered in that browser.

### Make Classic the default for everyone (keeps the 3D world one click away)

In `lib/view-boot.ts`, in `VIEW_BOOT_SCRIPT`, change the default in `v=u||s||"immersive"` to
`v=u||s||"classic"`. Commit and push `main`; Vercel deploys it. Visitors can still choose Immersive,
and `?view=immersive` still opens it.

### Restore the previous production version globally (safe revert, no history rewrite)

The rebuild arrives on `main` as merge commits. Revert them with a normal revert commit, newest
first, so the tree returns exactly to the tagged version:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main

# 1. See which merge commits brought the rebuild in (newest first):
git log --merges --oneline portfolio-pre-world-tree-production..main

# 2. Revert each of them, newest first, keeping main's side (-m 1):
git revert -m 1 --no-edit <newest-merge-sha>
git revert -m 1 --no-edit <older-merge-sha>      # if there is more than one

# 3. Check that the files now match the old production version exactly (prints nothing):
git diff portfolio-pre-world-tree-production --stat

git push origin main                              # normal push — Vercel deploys the old site
```

Alternative with a single commit (also non-destructive): restore the old tree and commit it.

```bash
git checkout main && git pull --ff-only origin main
git rm -r -q .                                     # stage removal of every tracked file
git checkout portfolio-pre-world-tree-production -- .
git commit -m "Restore the pre-rebuild production version (portfolio-pre-world-tree-production)"
git diff portfolio-pre-world-tree-production --stat   # prints nothing
git push origin main
```

Fastest emergency option (no Git change): in the Vercel dashboard → Deployments, open the old
production deployment `yukith-portfolio-j9f591t2v-…` and choose **Promote to Production** (instant
rollback). The next push to `main` would deploy `main` again, so follow up with one of the Git
options above if the rollback should last.

Never use `git push --force` or `git reset --hard` on `main` for this; the rebuild stays in history
and on `feat/world-tree-rebuild` either way, so it can be brought back with another revert.
