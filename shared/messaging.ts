/**
 * Type-safe messaging between plugin code and UI
 */

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type ScreenshotTemplate = 'none' | 'browser' | 'centered' | 'phone' | 'tablet';
export type Preset = 'figma' | 'github';

/** Messages from UI to Plugin */
export type UIMessage =
  | { type: 'create'; pluginName: string; pluginDescription: string; screenshotCount: number; screenshotTemplate: ScreenshotTemplate; preset: Preset; images?: ArrayBuffer[] }
  | { type: 'close' }
  | { type: 'open-url'; url: string }
  | { type: 'export-all' }
  | { type: 'resize'; height: number };

/** Messages from Plugin to UI */
export type PluginMessage =
  | { type: 'result'; data: unknown }
  | { type: 'error'; message: string }
  | { type: 'loading'; loading: boolean }
  | { type: 'init'; pluginName: string; pluginDescription: string; screenshotCount: number; screenshotTemplate: ScreenshotTemplate; preset: Preset };

// ============================================================================
// PLUGIN SIDE
// ============================================================================

/** Send message to UI */
export function sendToUI(message: PluginMessage): void {
  figma.ui.postMessage(message);
}

/** Send result to UI */
export function sendResult(data: unknown): void {
  sendToUI({ type: 'result', data });
}

/** Send error to UI */
export function sendError(message: string): void {
  sendToUI({ type: 'error', message });
}

/** Send loading state to UI */
export function sendLoading(loading: boolean): void {
  sendToUI({ type: 'loading', loading });
}

/** Create a typed message handler */
export function createMessageHandler(
  handlers: Partial<{
    [K in UIMessage['type']]: (
      msg: Extract<UIMessage, { type: K }>
    ) => void | Promise<void>;
  }>
): (msg: UIMessage) => void {
  return (msg: UIMessage) => {
    const handler = handlers[msg.type];
    if (handler) {
      (handler as (msg: UIMessage) => void)(msg);
    }
  };
}
