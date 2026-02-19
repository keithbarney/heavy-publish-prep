# Heavy Publish Prep

> Create correctly-sized frames for Figma Community publishing assets — icons, covers, and screenshots with mockup templates, ready to export.

Part of the **Heavy Suite** of Figma productivity plugins.

---

## What It Does

Publishing a Figma plugin or widget to the Community requires specific asset sizes — and setting up those frames manually is tedious. Heavy Publish Prep creates all of them in one click:

- **Icon frame** — 128×128 with placement guide
- **Cover image frame** — 1920×960 with your plugin name and tagline pre-filled
- **Screenshot frames** — 1920×960 each, with optional mockup templates
- **GitHub social preview** — 1280×640 for repository open-graph images

All frames land on a dedicated page in your Figma file, named after your plugin. Re-run anytime to add more screenshots without touching existing frames.

---

## Features

- **Platform presets** — Figma Community (icon + cover + screenshots) or GitHub (social preview)
- **Screenshot templates** — Browser mockup, Centered + Caption, Phone mockup, Tablet mockup, or bare frame
- **Image upload** — Drop in PNG/JPG screenshots; they're auto-resized and applied to the right frames
- **Persistent settings** — Plugin name, description, count, and template are remembered per machine
- **Export helper** — "Select All for Export" selects every frame so you can use File → Export
- **Dark UI** — Spacegray / Base16 Ocean theme, consistent with the Heavy Suite

---

## Asset Specs

### Figma Community

| Asset | Size | Notes |
|---|---|---|
| Icon | 128 × 128 | Transparent or solid bg, centered mark |
| Cover Image | 1920 × 960 | Plugin name + tagline pre-populated |
| Screenshots | 1920 × 960 each | Up to 10 |

### GitHub

| Asset | Size | Notes |
|---|---|---|
| Social Preview | 1280 × 640 | Repository open-graph image |

---

## How to Use

1. **Run the plugin** — Plugins → Development → Heavy Publish Prep (or installed version)
2. **Enter plugin name + description** — used for cover text
3. **Choose platform** — Figma Community or GitHub
4. **Set screenshot count + template** (Figma preset only)
5. **Optionally upload screenshots** — images are applied to the frames automatically
6. **Click Create** — frames appear on a new page named `[Plugin Name] Figma Plugin Assets`
7. **Select All for Export** — selects all frames so you can use File → Export → PNG

---

## Screenshot Templates

| Template | Description |
|---|---|
| None | Bare frame with guide text |
| Browser Mockup | macOS-style browser window with traffic lights and address bar |
| Centered + Caption | Placeholder with feature title above and caption below |
| Phone Mockup | iPhone-proportioned device with Dynamic Island |
| Tablet Mockup | Landscape iPad with camera dot |

All template elements are editable grouped layers — rename, recolor, or delete as needed.

---

## Development Setup

### Requirements

- Node.js 18+
- A Figma desktop account

### Install

```bash
git clone https://github.com/keithbarney/heavy-publish-prep.git
cd heavy-publish-prep
npm install
```

### Commands

| Command | Action |
|---|---|
| `npm run build` | Production build (UI + code) |
| `npm run build:ui` | Rebuild `ui.html` from `ui.src.html` |
| `npm run build:code` | Bundle `code.ts` → `dist/code.js` |
| `npm run dev` | Build UI + watch mode for code |
| `npm run typecheck` | TypeScript type check |

### Load in Figma

1. Run `npm run dev`
2. In Figma: **Plugins → Development → Import plugin from manifest…**
3. Select `manifest.json` from this directory
4. Plugin appears under Development plugins

### Project Structure

```
heavy-publish-prep/
├── code.ts            # Plugin logic (Figma sandbox)
├── ui.src.html        # UI source — edit this
├── heavy-theme.css    # Shared dark theme (Heavy Suite)
├── build-ui.js        # Inlines CSS → ui.html
├── ui.html            # Built UI (do not edit)
├── dist/
│   └── code.js        # Built plugin code
├── shared/
│   ├── figma-helpers.ts   # Figma API utilities
│   └── messaging.ts       # Type-safe plugin↔UI messages
└── manifest.json
```

> **Note:** `ui.src.html` is the source file for the UI. `heavy-theme.css` injects the Heavy Suite dark theme. `ui.html` is generated — do not edit directly.

---

## Part of Heavy Suite

| Plugin | Status |
|---|---|
| [Heavy Props Renamer](https://github.com/keithbarney/heavy-props-renamer) | Published |
| [Heavy Documentation Extractor](https://github.com/keithbarney/heavy-documentation-extractor) | Published |
| **Heavy Publish Prep** | This plugin |

---

## Support

Found a bug? [Open an issue](https://github.com/keithbarney/heavy-publish-prep/issues)

If this plugin saves you time → [support it here](https://heavy.lemonsqueezy.com) ♥
