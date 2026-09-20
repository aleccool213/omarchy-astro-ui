/** One floating tooltip element for the whole page, reused by every component.
 *  Appended to <body> so it escapes overflow:hidden and stacking contexts. */

let node: HTMLDivElement | null = null;

function element(): HTMLDivElement {
  if (node?.isConnected) return node;
  node = document.createElement("div");
  node.className = "om-tip";
  node.setAttribute("role", "tooltip");
  node.hidden = true;
  document.body.appendChild(node);
  return node;
}

export function showTip(html: string, x: number, y: number): void {
  const tip = element();
  tip.innerHTML = html;
  tip.hidden = false;

  // Measure after filling, then flip/clamp so it never leaves the viewport.
  const rect = tip.getBoundingClientRect();
  const margin = 10;
  let left = x - rect.width / 2;
  let top = y - rect.height - margin;

  left = Math.max(margin, Math.min(left, window.innerWidth - rect.width - margin));
  if (top < margin) top = y + margin;

  tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

export function hideTip(): void {
  if (node) node.hidden = true;
}

export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
