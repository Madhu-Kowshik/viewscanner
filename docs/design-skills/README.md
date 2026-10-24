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

This is a non-invasive resource integration. Upstream repositories have not been vendored, their CLIs have not been executed, and no UI redesign is claimed. Check upstream licenses and security before installing or copying external code.
