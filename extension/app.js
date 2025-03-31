/**
 * Recursively traverses the DOM tree to locate the nearest anchor element with a valid `href` attribute.
 * This ensures that clicks on nested elements (e.g., <code> inside <a>) still resolve to a proper link.
 *
 * @param {Node} node - The starting node for traversal.
 * @returns {HTMLAnchorElement | undefined} - The nearest anchor element with a valid `href`, or `undefined` if none found.
 */
const getLink = (node) => {
  while (node && node !== document) {
    if (node.tagName === 'A' && node.href) return node;
    node = node.parentNode;
  }
  return undefined;
};

/**
 * Handles Shift+Alt+Click events to open links exclusively in incognito mode while blocking default tab opening.
 * Implements deep event suppression to override Chrome’s built-in behavior at the highest priority.
 *
 * @param {MouseEvent} event - The click event.
 */
const onClick = (event) => {
  if (!(event.shiftKey && event.altKey)) return; // Only trigger on Shift+Alt+Click
  
  const link = getLink(event.target);
  if (!link) return;
  
  // Prevent ALL possible event bubbling, capturing, and propagation
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  // Override Chrome’s Shift+Click new tab behavior by delaying execution
  requestAnimationFrame(() => {
    chrome.runtime.sendMessage({
      action: 'CREATE_INCOGNITO_WINDOW',
      url: link.href
    });
  });
};

/**
 * Sets up an event listener with the highest interception priority to ensure maximum control.
 * Ensures all future dynamically added links are also captured in real time.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.addEventListener('click', onClick, { capture: true, passive: false });
});
