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
const UI_HEIGHT = 480;

const FRAME_GAP = 80;
const PAGE_SUFFIX = 'Figma Plugin Assets';

// Storage keys
const STORE_PLUGIN_NAME = 'publishPrep.pluginName';
const STORE_PLUGIN_DESCRIPTION = 'publishPrep.pluginDescription';
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
  const [pluginName, pluginDescription, count, template, preset] = await Promise.all([
    figma.clientStorage.getAsync(STORE_PLUGIN_NAME),
    figma.clientStorage.getAsync(STORE_PLUGIN_DESCRIPTION),
    figma.clientStorage.getAsync(STORE_SCREENSHOT_COUNT),
    figma.clientStorage.getAsync(STORE_SCREENSHOT_TEMPLATE),
    figma.clientStorage.getAsync(STORE_PRESET),
  ]);

  sendToUI({
    type: 'init',
    pluginName: pluginName ?? '',
    pluginDescription: pluginDescription ?? '',
    screenshotCount: count ?? 2,
    screenshotTemplate: template ?? 'none',
    preset: preset ?? 'figma',
  });
}

async function saveSettings(
  pluginName: string,
  pluginDescription: string,
  screenshotCount: number,
  screenshotTemplate: ScreenshotTemplate,
  preset: Preset
): Promise<void> {
  await Promise.all([
    figma.clientStorage.setAsync(STORE_PLUGIN_NAME, pluginName),
    figma.clientStorage.setAsync(STORE_PLUGIN_DESCRIPTION, pluginDescription),
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
      await saveSettings(msg.pluginName, msg.pluginDescription, msg.screenshotCount, msg.screenshotTemplate, msg.preset);
      await createPublishingAssets(msg.pluginName, msg.pluginDescription, msg.preset, msg.screenshotCount, msg.screenshotTemplate, msg.images, msg.imageNames);
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

  if (msg.type === 'resize') {
    figma.ui.resize(UI_WIDTH, msg.height);
  }
};

// ============================================================================
// EXPORT ALL
// ============================================================================

function exportAll(): void {
  const page = figma.root.children.find((p) => p.name.endsWith(PAGE_SUFFIX));
  if (!page) {
    notifyError('No assets page found — create assets first');
    return;
  }

  figma.currentPage = page;
  const frames = page.children.filter((n): n is FrameNode => n.type === 'FRAME');

  if (frames.length === 0) {
    notifyError('No frames found on assets page');
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
  pluginName: string,
  pluginDescription: string,
  preset: Preset,
  screenshotCount: number,
  screenshotTemplate: ScreenshotTemplate,
  images?: ArrayBuffer[],
  imageNames?: string[]
): Promise<void> {
  await figma.loadFontAsync({ family: 'JetBrains Mono', style: 'Regular' });

  const config = PRESETS[preset];
  const displayName = pluginName || figma.root.name || 'Plugin';
  const pageName = `${displayName} ${PAGE_SUFFIX}`;
  const page = getOrCreatePage(pageName);

  figma.currentPage = page;

  // Index existing frames by name so we can skip creation but still reference them
  const existingFrames = new Map<string, FrameNode>();
  for (const child of page.children) {
    if (child.type === 'FRAME') {
      existingFrames.set(child.name, child);
    }
  }

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
    if (existingFrames.has(spec.name)) continue;

    const frame = createAssetFrame(spec.name, spec.width, spec.height, spec.bg);
    frame.x = xOffset;
    frame.y = 0;
    page.appendChild(frame);

    if (spec.role === 'icon') {
      addIconGuide(frame, spec.width, spec.height);
    } else if (spec.role === 'cover') {
      addCoverTemplate(frame, spec.width, spec.height, pluginName, pluginDescription);
    }

    allFrames.push(frame);
    newFrames.push(frame);
    xOffset += spec.width + FRAME_GAP;
  }

  // Create screenshot frames (or collect existing ones for image updates)
  const screenshotFrames: FrameNode[] = [];
  if (config.hasScreenshots && config.screenshotSpec) {
    const ss = config.screenshotSpec;
    for (let i = 0; i < screenshotCount; i++) {
      const name = `Screenshot ${i + 1} — ${ss.width}×${ss.height}`;
      const existingFrame = existingFrames.get(name);

      if (existingFrame) {
        allFrames.push(existingFrame);
        screenshotFrames.push(existingFrame);
        continue;
      }

      const frame = createAssetFrame(name, ss.width, ss.height, ss.bg);
      frame.x = xOffset;
      frame.y = 0;
      page.appendChild(frame);

      applyScreenshotTemplate(frame, ss.width, ss.height, screenshotTemplate);

      allFrames.push(frame);
      newFrames.push(frame);
      screenshotFrames.push(frame);
      xOffset += ss.width + FRAME_GAP;
    }
  }

  // Apply uploaded images to screenshot frames
  if (images && images.length > 0 && screenshotFrames.length > 0) {
    applyImages(screenshotFrames, images, screenshotTemplate, imageNames);
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
  label.fontName = { family: 'JetBrains Mono', style: 'Regular' };
  label.characters = 'Place icon here';
  label.fontSize = 12;
  label.fills = [solidPaint('#999999')];
  frame.appendChild(label);
  label.x = Math.round((width - label.width) / 2);
  label.y = Math.round((height - label.height) / 2);
}

function addCoverTemplate(
  frame: FrameNode,
  width: number,
  height: number,
  pluginName: string,
  pluginDescription: string
): void {
  const displayName = pluginName || figma.root.name || 'Plugin Name';
  const displayDesc = pluginDescription || 'Your tagline here';

  const title = figma.createText();
  title.fontName = { family: 'JetBrains Mono', style: 'Regular' };
  title.characters = displayName;
  title.fontSize = Math.round(height / 10);
  title.fills = [solidPaint('#eff1f5')];
  frame.appendChild(title);
  title.x = Math.round((width - title.width) / 2);
  title.y = Math.round(height * 0.35);

  const tagline = figma.createText();
  tagline.fontName = { family: 'JetBrains Mono', style: 'Regular' };
  tagline.characters = displayDesc;
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
  } else if (template === 'phone') {
    addPhoneTemplate(frame, width, height);
  } else if (template === 'tablet') {
    addTabletTemplate(frame, width, height);
  } else {
    addScreenshotGuide(frame, width, height);
  }
}

function addScreenshotGuide(frame: FrameNode, width: number, height: number): void {
  const label = figma.createText();
  label.fontName = { family: 'JetBrains Mono', style: 'Regular' };
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

  // Drop shadow (darker rectangle offset behind browser)
  const shadow = figma.createRectangle();
  shadow.name = 'Shadow';
  shadow.resize(browserW, browserH);
  shadow.x = padding + 4;
  shadow.y = padding + 6;
  shadow.cornerRadius = radius;
  shadow.fills = [solidPaint('#0a0c0f')];
  shadow.opacity = 0.5;
  frame.appendChild(shadow);

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

  // URL text in address bar
  const urlText = figma.createText();
  urlText.fontName = { family: 'JetBrains Mono', style: 'Regular' };
  urlText.characters = 'yourapp.com';
  urlText.fontSize = 12;
  urlText.fills = [solidPaint('#65737e')];
  frame.appendChild(urlText);
  urlText.x = bar.x + Math.round((barW - urlText.width) / 2);
  urlText.y = bar.y + Math.round((barH - urlText.height) / 2);

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

  const group = figma.group([shadow, browser, ...dots, bar, urlText, content], frame);
  group.name = 'Browser Mockup — edit or delete';
}

// ============================================================================
// CENTERED + CAPTION TEMPLATE
// ============================================================================

function addCenteredTemplate(frame: FrameNode, width: number, height: number): void {
  const font: FontName = { family: 'JetBrains Mono', style: 'Regular' };
  const gap = 24;
  const placeholderW = Math.round(width * 0.85);
  const placeholderH = Math.round(height * 0.65);
  const placeholderX = Math.round((width - placeholderW) / 2);

  // Create text nodes first to measure their heights
  const title = figma.createText();
  title.fontName = font;
  title.characters = 'Feature Name';
  title.fontSize = 40;
  title.fills = [solidPaint('#eff1f5')];
  frame.appendChild(title);

  const caption = figma.createText();
  caption.fontName = font;
  caption.characters = 'Caption goes here';
  caption.fontSize = 24;
  caption.fills = [solidPaint('#65737e')];
  frame.appendChild(caption);

  // Total content block height, then center vertically
  const totalH = title.height + gap + placeholderH + gap + caption.height;
  const startY = Math.round((height - totalH) / 2);

  // Position title
  title.x = Math.round((width - title.width) / 2);
  title.y = startY;

  // Content placeholder
  const placeholderY = startY + title.height + gap;
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

  // Position caption
  caption.x = Math.round((width - caption.width) / 2);
  caption.y = placeholderY + placeholderH + gap;

  const group = figma.group([title, placeholder, caption], frame);
  group.name = 'Template — edit or delete';
}

// ============================================================================
// PHONE MOCKUP TEMPLATE
// ============================================================================

function addPhoneTemplate(frame: FrameNode, width: number, height: number): void {
  // iPhone proportions ~390×844, scaled to fit with padding
  const phoneAspect = 390 / 844;
  const maxPhoneH = Math.round(height * 0.85);
  const phoneH = maxPhoneH;
  const phoneW = Math.round(phoneH * phoneAspect);
  const phoneX = Math.round((width - phoneW) / 2);
  const phoneY = Math.round((height - phoneH) / 2);
  const radius = Math.round(phoneW * 0.12);
  const bezel = 12;

  // Device outline
  const device = figma.createRectangle();
  device.name = 'Device Frame';
  device.resize(phoneW, phoneH);
  device.x = phoneX;
  device.y = phoneY;
  device.cornerRadius = radius;
  device.fills = [solidPaint('#1e2228')];
  frame.appendChild(device);

  // Dynamic island
  const islandW = Math.round(phoneW * 0.28);
  const islandH = Math.round(phoneH * 0.028);
  const island = figma.createRectangle();
  island.name = 'Dynamic Island';
  island.resize(islandW, islandH);
  island.x = phoneX + Math.round((phoneW - islandW) / 2);
  island.y = phoneY + Math.round(phoneH * 0.02);
  island.cornerRadius = Math.round(islandH / 2);
  island.fills = [solidPaint('#0a0c0f')];
  frame.appendChild(island);

  // Content area (screen)
  const screenX = phoneX + bezel;
  const screenY = phoneY + bezel;
  const screenW = phoneW - bezel * 2;
  const screenH = phoneH - bezel * 2;
  const content = figma.createRectangle();
  content.name = 'Content — place screenshot here';
  content.resize(screenW, screenH);
  content.x = screenX;
  content.y = screenY;
  content.cornerRadius = radius - bezel;
  content.fills = [solidPaint('#343d46')];
  frame.appendChild(content);

  const group = figma.group([device, island, content], frame);
  group.name = 'Phone Mockup — edit or delete';
}

// ============================================================================
// TABLET MOCKUP TEMPLATE
// ============================================================================

function addTabletTemplate(frame: FrameNode, width: number, height: number): void {
  // Landscape tablet ~1024×768, scaled to fit with padding
  const tabletAspect = 1024 / 768;
  const maxTabletW = Math.round(width * 0.82);
  const maxTabletH = Math.round(height * 0.82);
  const tabletW = Math.min(maxTabletW, Math.round(maxTabletH * tabletAspect));
  const tabletH = Math.round(tabletW / tabletAspect);
  const tabletX = Math.round((width - tabletW) / 2);
  const tabletY = Math.round((height - tabletH) / 2);
  const radius = Math.round(tabletW * 0.025);
  const bezel = 16;

  // Device outline
  const device = figma.createRectangle();
  device.name = 'Device Frame';
  device.resize(tabletW, tabletH);
  device.x = tabletX;
  device.y = tabletY;
  device.cornerRadius = radius;
  device.fills = [solidPaint('#1e2228')];
  frame.appendChild(device);

  // Camera dot (centered on top bezel)
  const camSize = 8;
  const cam = figma.createEllipse();
  cam.name = 'Camera';
  cam.resize(camSize, camSize);
  cam.x = tabletX + Math.round((tabletW - camSize) / 2);
  cam.y = tabletY + Math.round((bezel - camSize) / 2);
  cam.fills = [solidPaint('#0a0c0f')];
  frame.appendChild(cam);

  // Content area (screen)
  const screenX = tabletX + bezel;
  const screenY = tabletY + bezel;
  const screenW = tabletW - bezel * 2;
  const screenH = tabletH - bezel * 2;
  const content = figma.createRectangle();
  content.name = 'Content — place screenshot here';
  content.resize(screenW, screenH);
  content.x = screenX;
  content.y = screenY;
  content.cornerRadius = Math.max(radius - bezel, 4);
  content.fills = [solidPaint('#343d46')];
  frame.appendChild(content);

  const group = figma.group([device, cam, content], frame);
  group.name = 'Tablet Mockup — edit or delete';
}

// ============================================================================
// IMAGE APPLICATION
// ============================================================================

function applyImages(
  screenshotFrames: FrameNode[],
  images: ArrayBuffer[],
  template: ScreenshotTemplate,
  imageNames?: string[]
): void {
  const count = Math.min(screenshotFrames.length, images.length);

  for (let i = 0; i < count; i++) {
    const frame = screenshotFrames[i];
    const imageHash = figma.createImage(new Uint8Array(images[i])).hash;
    const imageFill: ImagePaint = {
      type: 'IMAGE',
      scaleMode: 'FIT',
      imageHash,
      imageTransform: [[1, 0, 0], [0, 1, 0]],
    };

    if (template === 'none') {
      // Apply image as frame background, remove guide text
      frame.fills = [imageFill];
      for (const child of [...frame.children]) {
        if (child.type === 'TEXT' && child.characters === 'Place screenshot here') {
          child.remove();
        }
      }
    } else {
      // Find the content placeholder rectangle inside the frame's group
      const placeholder = findPlaceholder(frame);
      if (placeholder) {
        placeholder.fills = [imageFill];
      }

      // Update title text with filename (centered template)
      const name = imageNames && imageNames[i];
      if (name) {
        const titleNode = findTitleText(frame);
        if (titleNode) {
          titleNode.characters = name;
          // Re-center horizontally
          titleNode.x = Math.round((frame.width - titleNode.width) / 2);
        }
      }
    }
  }
}

function findTitleText(frame: FrameNode): TextNode | null {
  for (const child of frame.children) {
    if (child.type === 'TEXT' && child.characters === 'Feature Name') {
      return child;
    }
    if (child.type === 'GROUP') {
      for (const grandchild of child.children) {
        if (grandchild.type === 'TEXT' && grandchild.characters === 'Feature Name') {
          return grandchild;
        }
      }
    }
  }
  return null;
}

function findPlaceholder(frame: FrameNode): RectangleNode | null {
  for (const child of frame.children) {
    if (child.type === 'RECTANGLE' && child.name === 'Content — place screenshot here') {
      return child;
    }
    if (child.type === 'GROUP') {
      for (const grandchild of child.children) {
        if (grandchild.type === 'RECTANGLE' && grandchild.name === 'Content — place screenshot here') {
          return grandchild;
        }
      }
    }
  }
  return null;
}
