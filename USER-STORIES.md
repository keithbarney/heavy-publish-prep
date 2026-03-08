# Heavy Publish Prep — User Stories

## Asset Creation

### US-1: Create Figma Community publishing asset frames
- [x] **As a** designer,
**I want to** generate correctly-sized frames for Figma Community publishing,
**So that** I don't have to manually create and size icon, cover, and screenshot frames.

**Given** the Figma Community preset is selected and I've entered a plugin name
**When** I click "Create"
**Then** the plugin creates a dedicated page named "{Plugin Name} Figma Plugin Assets" with frames for Icon (128x128), Cover (1920x960), and the configured number of Screenshot frames (1920x960), each with PNG export settings.

---

### US-2: Create GitHub publishing asset frames
- [x] **As a** designer,
**I want to** generate correctly-sized frames for GitHub social preview,
**So that** I can create repository social cards with the right dimensions.

**Given** the GitHub preset is selected
**When** I click "Create"
**Then** the plugin creates a page with a single Social Preview frame (1280x640) with a dark background.

---

### US-3: Skip existing frames on re-run
- [x] **As a** designer,
**I want to** re-run the plugin without duplicating frames that already exist,
**So that** I can add screenshots or update settings without losing work.

**Given** asset frames already exist on the page from a previous run
**When** I click "Create" again
**Then** existing frames are preserved (not duplicated), new frames are added to the right of existing content, and a notification confirms "All frames already exist — nothing to add" if nothing new was created.

---

## Screenshot Templates

### US-4: Apply browser mockup template to screenshots
- [x] **As a** designer,
**I want to** have screenshot frames pre-populated with a browser window mockup,
**So that** my screenshots look professional with a realistic browser chrome.

**Given** the "Browser Mockup" template is selected
**When** screenshots are created
**Then** each screenshot frame contains a browser window with traffic light dots (Close/Minimize/Maximize), a centered address bar with "yourapp.com", and a content area placeholder.

---

### US-5: Apply centered caption template to screenshots
- [x] **As a** designer,
**I want to** have screenshot frames with a centered content area, title, and caption,
**So that** I can create marketing-style screenshots with feature callouts.

**Given** the "Centered + Caption" template is selected
**When** screenshots are created
**Then** each screenshot frame contains a centered "Feature Name" title, a content placeholder rectangle (85% width, 65% height), and a "Caption goes here" subtitle — all vertically centered.

---

### US-6: Apply phone mockup template to screenshots
- [x] **As a** designer,
**I want to** have screenshot frames with an iPhone device mockup,
**So that** I can showcase mobile app screenshots in a realistic device frame.

**Given** the "Phone Mockup" template is selected
**When** screenshots are created
**Then** each screenshot frame contains a phone device frame with iPhone proportions (390x844 aspect), a Dynamic Island element, and a content area placeholder with rounded corners.

---

### US-7: Apply tablet mockup template to screenshots
- [x] **As a** designer,
**I want to** have screenshot frames with a tablet device mockup,
**So that** I can showcase tablet app screenshots in a realistic device frame.

**Given** the "Tablet Mockup" template is selected
**When** screenshots are created
**Then** each screenshot frame contains a tablet device frame with landscape proportions (1024x768 aspect), a camera dot, and a content area placeholder.

---

### US-8: Toggle outline on centered template
- [x] **As a** designer,
**I want to** control whether the centered template shows an outline around the content placeholder,
**So that** I can choose a clean or bounded look for my screenshots.

**Given** the "Centered + Caption" template is selected
**When** I toggle the Outline button on or off
**Then** the content placeholder rectangle is created with or without a subtle border stroke.

---

## Image Upload

### US-9: Upload images to fill screenshot frames
- [x] **As a** designer,
**I want to** upload screenshot images that automatically fill the template placeholders,
**So that** I can create final assets without manual image placement.

**Given** I've selected images using the "Choose files" button
**When** I click "Create"
**Then** uploaded images are resized to fit (max 1920x960), applied as image fills to the screenshot frames' content placeholders, and the upload count indicator shows how many images are selected.

---

### US-10: Auto-populate feature titles from filenames
- [x] **As a** designer,
**I want to** have the "Feature Name" title in centered templates auto-populated from my image filenames,
**So that** I can batch-create captioned screenshots without manual text editing.

**Given** images are uploaded and the "Centered + Caption" template is selected
**When** screenshots are created
**Then** the "Feature Name" text in each frame is replaced with the corresponding image filename (minus extension), re-centered horizontally.

---

## Configuration

### US-11: Configure screenshot count
- [x] **As a** designer,
**I want to** specify how many screenshot frames to create (0–10),
**So that** I get exactly the number of screenshot slots I need.

**Given** the Figma Community preset is selected
**When** I set the screenshot count
**Then** that many screenshot frames are created (clamped between 0 and 10).

---

### US-12: Persist settings between sessions
- [x] **As a** designer,
**I want to** my plugin name, description, screenshot count, template, preset, and outline settings to be remembered,
**So that** I don't have to re-enter them every time I open the plugin.

**Given** I've previously configured and run the plugin
**When** I reopen the plugin
**Then** all settings are restored from client storage (plugin name, description, screenshot count, template, preset, outline toggle).

---

## Export

### US-13: Select all asset frames for export
- [x] **As a** designer,
**I want to** quickly select all generated frames for batch export,
**So that** I can use Figma's native export to save all assets at once.

**Given** asset frames exist on the generated page
**When** I click "Select All for Export"
**Then** the plugin navigates to the assets page, selects all frames, zooms to fit them, and shows a notification "{N} frames selected — use File > Export".

---

## Plugin Chrome

### US-14: Toggle light and dark theme
- [x] **As a** designer,
**I want to** toggle between light and dark mode,
**So that** the plugin UI matches my preferred Figma theme.

**Given** the plugin is open
**When** I click the theme toggle button
**Then** the UI switches between light and dark mode, persisted in localStorage.

---

### US-15: Access feedback and support links
- [x] **As a** designer,
**I want to** easily send feedback or support the plugin author,
**So that** I can report issues or show appreciation.

**Given** the plugin is open
**When** I click "Feedback" or "Buy me a coffee"
**Then** the appropriate link opens (email for feedback, Stripe payment link for support).

---
