/**
 * Runtime URL helpers for root deploy AND reverse-proxy subpaths.
 * No domain / path hardcoding — derived from window.location.
 */

/** Directory of the current page, always with trailing slash */
export function getPublicBase(): string {
  let p = window.location.pathname || '/';
  // /ralli or /ralli/index.html → /ralli/
  if (p.endsWith('/index.html')) {
    p = p.slice(0, -'index.html'.length);
  } else if (/\.[a-zA-Z0-9]+$/.test(p)) {
    p = p.slice(0, p.lastIndexOf('/') + 1);
  } else if (!p.endsWith('/')) {
    p = p + '/';
  }
  return p || '/';
}

export function apiUrl(path: string): string {
  const clean = path.replace(/^\//, '');
  // Resolve against page directory so /ralli → /ralli/api/rooms (not /api/rooms)
  try {
    const abs = new URL(clean, window.location.origin + getPublicBase());
    return abs.pathname + abs.search;
  } catch {
    return getPublicBase() + clean;
  }
}

export function wsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Trailing slash is important for nginx `location /ralli/`
  const base = getPublicBase(); // ends with /
  return `${protocol}//${window.location.host}${base}`;
}
