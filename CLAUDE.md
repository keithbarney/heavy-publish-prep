# Heavy Publish Prep

Create correctly-sized frames for Figma Community publishing assets

---

## Structure

```
heavy-publish-prep/
├── manifest.json      # Plugin config
├── package.json       # Scripts & deps
├── code.ts            # Plugin logic (runs in Figma sandbox)
├── ui.src.html        # UI source (edit this, not ui.html)
├── heavy-theme.css    # Shared dark theme (Heavy Tabs / Spacegray)
├── build-ui.js        # Inlines CSS into ui.src.html to produce ui.html
├── ui.html            # Build artifact (generated, do not edit)
└── dist/
    └── code.js        # Built output
```

---

## Commands

| Command | Action |
|---------|--------|
| `npm run build` | Production build (UI + code) |
| `npm run build:ui` | Build ui.html only |
| `npm run build:code` | Build code.js only |
| `npm run dev` | Build UI + watch mode for code |
| `npm run typecheck` | Check TypeScript types |

**Note:** `/commit-push-pr` auto-runs `npm run build` + `npm run typecheck` before staging. No need to build manually before committing.

---

## Development Workflow

1. `npm install`
2. `npm run dev` (keep running)
3. In Figma: Plugins -> Development -> Import from manifest
4. Select `manifest.json` from this folder
5. Edit `code.ts` and `ui.src.html`, see changes on re-run

---

## Build Target

esbuild uses `--target=es6` because Figma's plugin sandbox doesn't support ES2020+ syntax (e.g., `??`, `?.`). Write modern TypeScript freely — esbuild transpiles it down automatically.

---

## UI Build System

- `ui.src.html` is the source file — edit this for UI changes
- `heavy-theme.css` contains the shared dark theme (Spacegray / Base16 Ocean)
- `build-ui.js` replaces the `<!-- HEAVY_THEME -->` marker in `ui.src.html` with the inlined CSS
- `ui.html` is the build output referenced by `manifest.json` — do not edit directly
- Plugin-specific CSS overrides go in a `<style>` block after the marker in `ui.src.html`

---

## Key Files

### code.ts
Main plugin logic. Runs in the Figma sandbox.

### ui.src.html
Plugin UI source. Includes:
- `<!-- HEAVY_THEME -->` marker for shared CSS injection
- Plugin-specific `<style>` block for overrides
- Keyboard shortcuts
- Messaging with plugin code

### heavy-theme.css
Shared dark theme based on Spacegray / Base16 Ocean palette. Provides:
- Reset, body, typography
- Form inputs, labels, buttons (primary/secondary/danger)
- Actions bar, results/preview panels, tables, lists
- Status messages, support link

---

## Publishing

See `PUBLISH.md` for:
- Asset specs (icon, cover)
- Description template
- Step-by-step publishing guide
