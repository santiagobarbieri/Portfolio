export function initButtons() {
  // Image tiles and collection rows remain content, not toolbar buttons.
  const selector = 'button:not(.poster-tile):not(.poster-collection):not(.gallery-tile), a.pill, a.text-button, .footer-bottom nav a';
  function decorate(root) {
    if (root.matches?.(selector)) root.classList.add('ui-pill');
    root.querySelectorAll?.(selector).forEach(button => button.classList.add('ui-pill'));
  }
  decorate(document.body);
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType === 1) decorate(node);
    }
  }).observe(document.body, {childList: true, subtree: true});
}
