/**
 * Heavy Publish Prep — Figma Plugin
 * Create correctly-sized frames for Figma Community publishing assets
 */

import { notifySuccess, notifyError, solidPaint } from './shared/figma-helpers';
import { UIMessage, ScreenshotTemplate, Preset, sendToUI } from './shared/messaging';

// ============================================================================
// PLUGIN CONFIG
// ============================================================================

const UI_WIDTH = 280;
const UI_HEIGHT = 400;

const PAGE_NAME = 'Publishing Assets';
const FRAME_GAP = 80;

// Storage keys
const STORE_SCREENSHOT_COUNT = 'publishPrep.screenshotCount';
const STORE_SCREENSHOT_TEMPLATE = 'publishPrep.screenshotTemplate';
const STORE_PRESET = 'publishPrep.preset';

// ============================================================================
// PRESETS
// ============================================================================

interface AssetSpec {
  name: string;
  width: number;
  height: number;
  bg: string;
  role: 'icon' | 'cover' | 'screenshot';
}

interface PresetConfig {
  label: string;
  hasScreenshots: boolean;
  assets: AssetSpec[];
  screenshotSpec: { width: number; height: number; bg: string } | null;
}

const PRESETS: Record<Preset, PresetConfig> = {
  figma: {
    label: 'Figma Community',
    hasScreenshots: true,
    assets: [
      { name: 'Icon — 128×128', width: 128, height: 128, bg: '#FFFFFF', role: 'icon' },
      { name: 'Cover — 1920×960', width: 1920, height: 960, bg: '#2b303b', role: 'cover' },
    ],
    screenshotSpec: { width: 1920, height: 960, bg: '#2b303b' },
  },
  github: {
    label: 'GitHub',
    hasScreenshots: false,
    assets: [
      { name: 'Social Preview — 1280×640', width: 1280, height: 640, bg: '#0d1117', role: 'cover' },
    ],
    screenshotSpec: null,
  },
};

// ============================================================================
// MAIN
// ============================================================================

figma.showUI(__html__, {
  width: UI_WIDTH,
  height: UI_HEIGHT,
  themeColors: true,
});

// Send saved settings to UI on load
loadSettings();

async function loadSettings(): Promise<void> {
  const [count, template, preset] = await Promise.all([
    figma.clientStorage.getAsync(STORE_SCREENSHOT_COUNT),
    figma.clientStorage.getAsync(STORE_SCREENSHOT_TEMPLATE),
    figma.clientStorage.getAsync(STORE_PRESET),
  ]);

  sendToUI({
    type: 'init',
    screenshotCount: count ?? 2,
    screenshotTemplate: template ?? 'none',
    preset: preset ?? 'figma',
  });
}

async function saveSettings(
  screenshotCount: number,
  screenshotTemplate: ScreenshotTemplate,
  preset: Preset
): Promise<void> {
  await Promise.all([
    figma.clientStorage.setAsync(STORE_SCREENSHOT_COUNT, screenshotCount),
    figma.clientStorage.setAsync(STORE_SCREENSHOT_TEMPLATE, screenshotTemplate),
    figma.clientStorage.setAsync(STORE_PRESET, preset),
  ]);
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

figma.ui.onmessage = async (msg: UIMessage) => {
  if (msg.type === 'create') {
    try {
      await saveSettings(msg.screenshotCount, msg.screenshotTemplate, msg.preset);
      await createPublishingAssets(msg.preset, msg.screenshotCount, msg.screenshotTemplate);
      notifySuccess('Publishing assets created!');
      figma.closePlugin();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      notifyError(message);
    }
  }

  if (msg.type === 'export-all') {
    exportAll();
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }

  if (msg.type === 'open-url') {
    figma.openExternal(msg.url);
  }
};

// ============================================================================
// EXPORT ALL
// ============================================================================

function exportAll(): void {
  const page = figma.root.children.find((p) => p.name === PAGE_NAME);
  if (!page) {
    notifyError('No "Publishing Assets" page found — create assets first');
    return;
  }

  figma.currentPage = page;
  const frames = page.children.filter((n): n is FrameNode => n.type === 'FRAME');

  if (frames.length === 0) {
    notifyError('No frames found on Publishing Assets page');
    return;
  }

  figma.currentPage.selection = frames;
  figma.viewport.scrollAndZoomIntoView(frames);
  notifySuccess(`${frames.length} frames selected — use File → Export`);
}

// ============================================================================
// CORE LOGIC
// ============================================================================

async function createPublishingAssets(
  preset: Preset,
  screenshotCount: number,
  screenshotTemplate: ScreenshotTemplate
): Promise<void> {
  await figma.loadFontAsync({ family: 'Departure Mono', style: 'Regular' });

  const config = PRESETS[preset];
  const page = getOrCreatePage(PAGE_NAME);

  figma.currentPage = page;

  // Index existing frames by name so we can skip them
  const existing = new Set(
    page.children
      .filter((n): n is FrameNode => n.type === 'FRAME')
      .map((n) => n.name)
  );

  // Find the rightmost edge of existing content for positioning new frames
  let xOffset = 0;
  for (const child of page.children) {
    if ('x' in child && 'width' in child) {
      const rightEdge = (child as SceneNode & { x: number; width: number }).x +
        (child as SceneNode & { x: number; width: number }).width;
      if (rightEdge > xOffset) xOffset = rightEdge;
    }
  }
  if (xOffset > 0) xOffset += FRAME_GAP;

  const allFrames: FrameNode[] = [];
  const newFrames: FrameNode[] = [];

  // Collect existing frames for selection
  for (const child of page.children) {
    if (child.type === 'FRAME') allFrames.push(child);
  }

  // Create fixed assets (icon, cover) — skip if already present
  for (const spec of config.assets) {
    if (existing.has(spec.name)) continue;

    const frame = createAssetFrame(spec.name, spec.width, spec.height, spec.bg);
    frame.x = xOffset;
    frame.y = 0;
    page.appendChild(frame);

    if (spec.role === 'icon') {
      addIconGuide(frame, spec.width, spec.height);
    } else if (spec.role === 'cover') {
      addCoverTemplate(frame, spec.width, spec.height);
    }

    allFrames.push(frame);
    newFrames.push(frame);
    xOffset += spec.width + FRAME_GAP;
  }

  // Create screenshot frames — skip if already present
  if (config.hasScreenshots && config.screenshotSpec) {
    const ss = config.screenshotSpec;
    for (let i = 0; i < screenshotCount; i++) {
      const name = `Screenshot ${i + 1} — ${ss.width}×${ss.height}`;
      if (existing.has(name)) continue;

      const frame = createAssetFrame(name, ss.width, ss.height, ss.bg);
      frame.x = xOffset;
      frame.y = 0;
      page.appendChild(frame);

      applyScreenshotTemplate(frame, ss.width, ss.height, screenshotTemplate);

      allFrames.push(frame);
      newFrames.push(frame);
      xOffset += ss.width + FRAME_GAP;
    }
  }

  figma.currentPage.selection = allFrames;
  figma.viewport.scrollAndZoomIntoView(allFrames);

  if (newFrames.length === 0) {
    notifySuccess('All frames already exist — nothing to add');
  }
}

// ============================================================================
// FRAME CREATION
// ============================================================================

function getOrCreatePage(name: string): PageNode {
  const existing = figma.root.children.find((p) => p.name === name);
  if (existing) return existing;

  const page = figma.createPage();
  page.name = name;
  return page;
}

function createAssetFrame(
  name: string,
  width: number,
  height: number,
  bgHex: string
): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(width, height);
  frame.fills = [solidPaint(bgHex)];
  frame.clipsContent = true;

  frame.exportSettings = [
    {
      format: 'PNG',
      suffix: '',
      constraint: { type: 'SCALE', value: 1 },
    },
  ];

  return frame;
}

// ============================================================================
// GUIDE TEXT & TEMPLATES
// ============================================================================

function addIconGuide(frame: FrameNode, width: number, height: number): void {
  const label = figma.createText();
  label.fontName = { family: 'Departure Mono', style: 'Regular' };
  label.characters = 'Place icon here';
  label.fontSize = 12;
  label.fills = [solidPaint('#999999')];
  frame.appendChild(label);
  label.x = Math.round((width - label.width) / 2);
  label.y = Math.round((height - label.height) / 2);
}

function addCoverTemplate(frame: FrameNode, width: number, height: number): void {
  // Plugin name from file name
  const fileName = figma.root.name || 'Plugin Name';

  const title = figma.createText();
  title.fontName = { family: 'Departure Mono', style: 'Regular' };
  title.characters = fileName;
  title.fontSize = Math.round(height / 10);
  title.fills = [solidPaint('#eff1f5')];
  frame.appendChild(title);
  title.x = Math.round((width - title.width) / 2);
  title.y = Math.round(height * 0.35);

  const tagline = figma.createText();
  tagline.fontName = { family: 'Departure Mono', style: 'Regular' };
  tagline.characters = 'Create correctly-sized frames for Figma Community publishing assets';
  tagline.fontSize = Math.round(height / 24);
  tagline.fills = [solidPaint('#65737e')];
  frame.appendChild(tagline);
  tagline.x = Math.round((width - tagline.width) / 2);
  tagline.y = title.y + title.height + Math.round(height * 0.03);

  const group = figma.group([title, tagline], frame);
  group.name = 'Cover Text — edit or delete';
}

function applyScreenshotTemplate(
  frame: FrameNode,
  width: number,
  height: number,
  template: ScreenshotTemplate
): void {
  if (template === 'browser') {
    addBrowserTemplate(frame, width, height);
  } else if (template === 'centered') {
    addCenteredTemplate(frame, width, height);
  } else {
    addScreenshotGuide(frame, width, height);
  }
}

function addScreenshotGuide(frame: FrameNode, width: number, height: number): void {
  const label = figma.createText();
  label.fontName = { family: 'Departure Mono', style: 'Regular' };
  label.characters = 'Place screenshot here';
  label.fontSize = 32;
  label.fills = [solidPaint('#65737e')];
  frame.appendChild(label);
  label.x = Math.round((width - label.width) / 2);
  label.y = Math.round((height - label.height) / 2);
}

// ============================================================================
// BROWSER MOCKUP TEMPLATE
// ============================================================================

function addBrowserTemplate(frame: FrameNode, width: number, height: number): void {
  const padding = Math.round(width * 0.05);
  const browserW = width - padding * 2;
  const browserH = height - padding * 2;
  const topBarH = 44;
  const radius = 12;

  // Browser window background
  const browser = figma.createRectangle();
  browser.name = 'Browser Chrome';
  browser.resize(browserW, browserH);
  browser.x = padding;
  browser.y = padding;
  browser.cornerRadius = radius;
  browser.fills = [solidPaint('#1e2228')];
  frame.appendChild(browser);

  // Traffic light dots
  const dotColors = ['#ff5f56', '#ffbd2e', '#27c93f'];
  const dotSize = 12;
  const dotY = padding + Math.round((topBarH - dotSize) / 2);
  const dots: EllipseNode[] = [];

  for (let i = 0; i < 3; i++) {
    const dot = figma.createEllipse();
    dot.name = ['Close', 'Minimize', 'Maximize'][i];
    dot.resize(dotSize, dotSize);
    dot.x = padding + 16 + i * (dotSize + 8);
    dot.y = dotY;
    dot.fills = [solidPaint(dotColors[i])];
    frame.appendChild(dot);
    dots.push(dot);
  }

  // Address bar
  const barW = 300;
  const barH = 28;
  const bar = figma.createRectangle();
  bar.name = 'Address Bar';
  bar.resize(barW, barH);
  bar.x = padding + Math.round((browserW - barW) / 2);
  bar.y = padding + Math.round((topBarH - barH) / 2);
  bar.cornerRadius = 6;
  bar.fills = [solidPaint('#343d46')];
  frame.appendChild(bar);

  // Content area
  const contentH = browserH - topBarH;
  const content = figma.createRectangle();
  content.name = 'Content — place screenshot here';
  content.resize(browserW, contentH);
  content.x = padding;
  content.y = padding + topBarH;
  content.fills = [solidPaint('#343d46')];
  content.bottomLeftRadius = radius;
  content.bottomRightRadius = radius;
  content.topLeftRadius = 0;
  content.topRightRadius = 0;
  frame.appendChild(content);

  const group = figma.group([browser, ...dots, bar, content], frame);
  group.name = 'Browser Mockup — edit or delete';
}

// ============================================================================
// CENTERED + CAPTION TEMPLATE
// ============================================================================

function addCenteredTemplate(frame: FrameNode, width: number, height: number): void {
  const placeholderW = Math.round(width * 0.7);
  const placeholderH = Math.round(height * 0.55);
  const placeholderX = Math.round((width - placeholderW) / 2);
  const placeholderY = Math.round(height * 0.12);

  // Content placeholder
  const placeholder = figma.createRectangle();
  placeholder.name = 'Content — place screenshot here';
  placeholder.resize(placeholderW, placeholderH);
  placeholder.x = placeholderX;
  placeholder.y = placeholderY;
  placeholder.cornerRadius = 8;
  placeholder.fills = [solidPaint('#343d46')];
  placeholder.strokes = [solidPaint('#4f5b66')];
  placeholder.strokeWeight = 1;
  frame.appendChild(placeholder);

  // Caption text
  const caption = figma.createText();
  caption.fontName = { family: 'Departure Mono', style: 'Regular' };
  caption.characters = 'Caption goes here';
  caption.fontSize = 32;
  caption.fills = [solidPaint('#65737e')];
  frame.appendChild(caption);
  caption.x = Math.round((width - caption.width) / 2);
  caption.y = placeholderY + placeholderH + 40;

  const group = figma.group([placeholder, caption], frame);
  group.name = 'Template — edit or delete';
}
