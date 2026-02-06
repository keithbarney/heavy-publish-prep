/**
 * Figma Plugin Helpers
 * Common utilities for working with the Figma API
 */

// ============================================================================
// SELECTION
// ============================================================================

/** Get current selection, optionally filtered by type */
export function getSelection<T extends SceneNode['type']>(
  types?: T[]
): Extract<SceneNode, { type: T }>[] {
  const selection = figma.currentPage.selection;
  if (!types || types.length === 0) {
    return selection as Extract<SceneNode, { type: T }>[];
  }
  return selection.filter((node) =>
    types.includes(node.type as T)
  ) as Extract<SceneNode, { type: T }>[];
}

/** Check if anything is selected */
export function hasSelection(): boolean {
  return figma.currentPage.selection.length > 0;
}

/** Get first selected node */
export function getFirstSelected(): SceneNode | null {
  return figma.currentPage.selection[0] || null;
}

// ============================================================================
// TRAVERSAL
// ============================================================================

/** Recursively traverse all children of a node */
export function traverse(
  node: BaseNode,
  callback: (node: SceneNode) => void | boolean
): void {
  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children) {
      const result = callback(child);
      if (result !== false) {
        traverse(child, callback);
      }
    }
  }
}

/** Find all nodes matching a predicate */
export function findAll(
  root: BaseNode,
  predicate: (node: SceneNode) => boolean
): SceneNode[] {
  const results: SceneNode[] = [];
  traverse(root, (node) => {
    if (predicate(node)) {
      results.push(node);
    }
  });
  return results;
}

/** Find all nodes of a specific type */
export function findAllByType<T extends SceneNode['type']>(
  root: BaseNode,
  type: T
): Extract<SceneNode, { type: T }>[] {
  return findAll(root, (node) => node.type === type) as Extract<
    SceneNode,
    { type: T }
  >[];
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/** Show a success notification */
export function notifySuccess(message: string, timeout = 3000): void {
  figma.notify(message, { timeout });
}

/** Show an error notification */
export function notifyError(message: string, timeout = 5000): void {
  figma.notify(message, { timeout, error: true });
}

// ============================================================================
// NODE UTILITIES
// ============================================================================

/** Get the full path of a node (Page / Frame / Group / ...) */
export function getNodePath(node: BaseNode): string {
  const parts: string[] = [];
  let current: BaseNode | null = node;
  while (current && current.type !== 'DOCUMENT') {
    parts.unshift(current.name);
    current = current.parent;
  }
  return parts.join(' / ');
}

/** Clone a node and optionally place it */
export function cloneNode<T extends SceneNode>(
  node: T,
  parent?: ChildrenMixin & BaseNode
): T {
  const clone = node.clone() as T;
  if (parent && 'appendChild' in parent) {
    parent.appendChild(clone);
  }
  return clone;
}

/** Check if node supports children */
export function hasChildren(
  node: BaseNode
): node is BaseNode & ChildrenMixin {
  return 'children' in node;
}

// ============================================================================
// TEXT
// ============================================================================

/** Load fonts for a text node before editing */
export async function loadFonts(node: TextNode): Promise<void> {
  const fonts = node.getRangeAllFontNames(0, node.characters.length);
  await Promise.all(fonts.map((font) => figma.loadFontAsync(font)));
}

/** Set text content (handles font loading) */
export async function setText(node: TextNode, text: string): Promise<void> {
  await loadFonts(node);
  node.characters = text;
}

// ============================================================================
// COLORS
// ============================================================================

/** Convert hex to Figma RGB (0-1 range) */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/** Convert Figma RGB to hex */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(rgb.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(rgb.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

/** Create a solid paint from hex color */
export function solidPaint(hex: string, opacity = 1): SolidPaint {
  return {
    type: 'SOLID',
    color: hexToRgb(hex),
    opacity,
  };
}
