# Publishing Checklist

## Before Publishing

### 1. Plugin Info
- [ ] Plugin name (max 50 chars)
- [ ] Tagline (max 100 chars) — one sentence pitch
- [ ] Description (detailed, with formatting)
- [ ] Category selected

### 2. Required Assets

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| Icon | 128×128 | PNG | Transparent bg, centered mark |
| Cover | 1920×960 | PNG/JPG | 2:1 ratio, show UI in context |

### 3. Optional Assets

| Asset | Size | Format |
|-------|------|--------|
| Additional screenshots | 1920×960 | PNG/JPG |
| Video | — | MP4 (Loom works) |

---

## Asset Creation Checklist

### Icon (128×128)
- [ ] Simple, recognizable shape
- [ ] Works at small sizes
- [ ] Consistent with Heavy brand (bold, geometric)
- [ ] Test on dark and light backgrounds

### Cover Image (1920×960)
- [ ] Plugin name visible
- [ ] Show the UI or a result
- [ ] Clean, professional
- [ ] No tiny text (won't be readable)

---

## Description Template

```
[ONE SENTENCE: What it does]

## Features
- Feature 1
- Feature 2
- Feature 3

## How to Use
1. Select layers
2. Run the plugin
3. Done

## Support
Found a bug? Have feedback?
→ [GitHub Issues](your-repo-link) or [Email](mailto:keithbarneydesign@gmail.com)
```

---

## Publishing Steps

1. **Build**: `npm run build`
2. **Test**: Open in Figma, run through all features
3. **Figma Community**:
   - Go to: Figma → Plugins → Manage plugins
   - Click your plugin → "Publish new version"
   - Upload assets
   - Fill in description
   - Submit for review

---

## Post-Publish

- [ ] Test the live version
- [ ] Share on Twitter/LinkedIn
- [ ] Add to portfolio
- [ ] Create a Loom walkthrough (optional, helps discoverability)

---

## Monetization (Future)

**Free with premium:**
- Use Gumroad or Lemonsqueezy for license keys
- Add license validation to plugin
- Free tier = basic features, paid = full

**Pricing research:**
- Check competitor pricing on Figma Community
- Typical range: $5–$29 one-time, $3–$10/mo subscription
