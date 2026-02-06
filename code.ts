/**
 * Heavy Publish Prep — Figma Plugin
 * Create correctly-sized frames for Figma Community publishing assets
 */

import { notifySuccess, notifyError } from './shared/figma-helpers';
import { solidPaint } from './shared/figma-helpers';
import { UIMessage } from './shared/messaging';

// ============================================================================
// PLUGIN CONFIG
// ============================================================================

const UI_WIDTH = 280;
const UI_HEIGHT = 340;

const PAGE_NAME = 'Publishing Assets';
const FRAME_GAP = 80;

const ASSETS = {
  icon: { name: 'Icon — 128×128', width: 128, height: 128, bg: '#FFFFFF' },
  cover: { name: 'Cover — 1920×960', width: 1920, height: 960, bg: '#2b303b' },
  screenshot: { name: 'Screenshot', width: 1920, height: 960, bg: '#2b303b' },
};

// ============================================================================
// MAIN
// ============================================================================

figma.showUI(__html__, {
  width: UI_WIDTH,
  height: UI_HEIGHT,
  themeColors: true,
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

figma.ui.onmessage = async (msg: UIMessage) => {
  if (msg.type === 'create') {
    try {
      await createPublishingAssets(msg.screenshotCount);
      notifySuccess('Publishing assets created!');
      figma.closePlugin();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      notifyError(message);
    }
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }

  if (msg.type === 'open-url') {
    figma.openExternal(msg.url);
  }
};

// ============================================================================
// PLUGIN LOGIC
// ============================================================================

async function createPublishingAssets(screenshotCount: number): Promise<void> {
  // Load Inter for text labels
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

  // Find or create the Publishing Assets page
  const page = getOrCreatePage(PAGE_NAME);

  // Clear existing content for clean re-runs
  for (const child of [...page.children]) {
    child.remove();
  }

  // Switch to the page
  figma.currentPage = page;

  const frames: FrameNode[] = [];
  let xOffset = 0;

  // Icon frame
  const icon = createAssetFrame(ASSETS.icon.name, ASSETS.icon.width, ASSETS.icon.height, ASSETS.icon.bg);
  icon.x = xOffset;
  icon.y = 0;
  page.appendChild(icon);
  frames.push(icon);
  xOffset += icon.width + FRAME_GAP;

  // Cover frame
  const cover = createAssetFrame(ASSETS.cover.name, ASSETS.cover.width, ASSETS.cover.height, ASSETS.cover.bg);
  cover.x = xOffset;
  cover.y = 0;
  page.appendChild(cover);
  frames.push(cover);
  xOffset += cover.width + FRAME_GAP;

  // Screenshot frames
  for (let i = 0; i < screenshotCount; i++) {
    const name = `${ASSETS.screenshot.name} ${i + 1} — 1920×960`;
    const screenshot = createAssetFrame(name, ASSETS.screenshot.width, ASSETS.screenshot.height, ASSETS.screenshot.bg);
    screenshot.x = xOffset;
    screenshot.y = 0;
    page.appendChild(screenshot);
    frames.push(screenshot);
    xOffset += screenshot.width + FRAME_GAP;
  }

  // Select all frames and zoom to fit
  figma.currentPage.selection = frames;
  figma.viewport.scrollAndZoomIntoView(frames);
}

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

  // Configure PNG export
  frame.exportSettings = [
    {
      format: 'PNG',
      suffix: '',
      constraint: { type: 'SCALE', value: 1 },
    },
  ];

  // Add centered label
  const label = figma.createText();
  label.characters = name;
  label.fontSize = Math.max(12, Math.round(height / 20));
  // Use contrasting text color based on background
  const isLight = bgHex.toUpperCase() === '#FFFFFF' || bgHex.toUpperCase() === '#FFF';
  label.fills = [solidPaint(isLight ? '#999999' : '#65737e')];
  frame.appendChild(label);

  // Center the label
  label.x = Math.round((width - label.width) / 2);
  label.y = Math.round((height - label.height) / 2);

  return frame;
}
