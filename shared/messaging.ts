/**
 * Type-safe messaging between plugin code and UI
 */

// ============================================================================
// MESSAGE TYPES - Customize these for your plugin
// ============================================================================

/** Messages from UI to Plugin */
export type UIMessage =
  | { type: 'create'; screenshotCount: number }
  | { type: 'close' }
  | { type: 'open-url'; url: string };

/** Messages from Plugin to UI */
export type PluginMessage =
  | { type: 'result'; data: unknown }
  | { type: 'error'; message: string }
  | { type: 'loading'; loading: boolean }
  | { type: 'selection-changed'; count: number };

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

// ============================================================================
// UI SIDE (use in ui.html script)
// ============================================================================

/**
 * Example usage in ui.html:
 *
 * <script>
 *   // Send to plugin
 *   function sendToPlugin(message) {
 *     parent.postMessage({ pluginMessage: message }, '*');
 *   }
 *
 *   // Receive from plugin
 *   window.onmessage = (event) => {
 *     const msg = event.data.pluginMessage;
 *     switch (msg.type) {
 *       case 'result':
 *         handleResult(msg.data);
 *         break;
 *       case 'error':
 *         handleError(msg.message);
 *         break;
 *       case 'loading':
 *         handleLoading(msg.loading);
 *         break;
 *     }
 *   };
 * </script>
 */
