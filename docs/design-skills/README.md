# OmniPDF design skills

These three upstream design resources are registered for OmniPDF's React 19 + Vite + Tailwind UI. They are **agent guidance**, not runtime packages, and adding this directory does not change the running app.

## Resources

1. **Impeccable** — https://github.com/pbakaus/impeccable — design audits, layout, typography, color, responsive polish. Upstream installation: `npx impeccable install` (run locally after reviewing its instructions).
2. **Taste Skill** — https://github.com/leonxlnx/taste-skill — intentional art direction and avoiding generic AI interfaces. Upstream installation: `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend` (run locally after reviewing its instructions; some workflows require Node 22+ and Chrome/Chromium).
3. **Motion Skill** — https://github.com/freshtechbro/claudedesignskills/blob/main/.claude/skills/motion-framer/SKILL.md — guidance for animations in React. Follow its instructions when implementing motion; install an animation library only when needed.

## Recommended application to OmniPDF

- Keep existing PDF processing, routes, keyboard shortcuts, file upload and download behavior unchanged.
- First audit the existing layout, typography, responsive breakpoints, focus states and accessibility.
- Use Taste Skill to plan a distinctive yet functional document-tool interface, then Impeccable to critique and polish it.
- Use Motion Skill selectively for drag/drop, progress and panel transitions; support reduced-motion preferences and avoid unnecessary animations.
- Make design changes in small reviewable pull requests and run `npm run build`, `npm run lint`, and relevant tests before merging.

## Scope

The initial integration was reference-only. The update below adds pinned optional submodules and applies UI improvements; upstream CLIs and hooks have not been executed. Check upstream licenses before reusing their code.

## Pinned upstream repositories

The repository now includes optional Git submodules under `design/`:

- `design/impeccable` — pbakaus/impeccable
- `design/taste-skill` — Leonxlnx/taste-skill
- `design/motion-skills` — freshtechbro/claudedesignskills (Motion guidance is in `.claude/skills/motion-framer/SKILL.md`)

Initialize only when working on design guidance:

```sh
git submodule update --init --depth 1 design/impeccable design/taste-skill design/motion-skills
```

These are pinned source checkouts, not installed agent skills or runtime dependencies. They are excluded from application compilation and normal CI checkout. No external hooks, installers, or telemetry are enabled. Each upstream repository retains its own license. Updating a pin should be a reviewed change; do not automatically track upstream main.

## Applied UI changes

The document dashboard now uses a task-first split layout, restrained color, clear type hierarchy, semantic links, and practical copy. Tool search has actual counts, persistent favorites, and empty-state recovery. Global keyboard focus indicators and reduced-motion support cover the updated surfaces. Motion uses short CSS opacity/transform transitions; a runtime animation dependency is unnecessary for these interactions.
