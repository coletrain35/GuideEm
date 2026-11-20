/**
 * Lightweight, zero-dependency DOMParser shim for Node.js CLI execution of exporter.ts.
 * Supports tag selectors (e.g. "h1, h2", "table", "p, li, code") and attribute selectors
 * (e.g. 'div[data-type="workflow"]'), plus innerHTML, textContent, style, classList, etc.
 */

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

export class MiniElement {
  tagName: string;
  attributes: Map<string, string> = new Map();
  children: Array<MiniElement | MiniTextNode> = [];
  parentNode: MiniElement | null = null;
  private _styleMap: Map<string, string> = new Map();
  private _rawInnerHtml: string | null = null;

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  get parentElement(): MiniElement | null {
    return this.parentNode;
  }

  get className(): string {
    return this.attributes.get('class') || '';
  }

  set className(val: string) {
    if (val) this.attributes.set('class', val);
    else this.attributes.delete('class');
  }

  get classList() {
    const getSet = () => new Set((this.className || '').split(/\s+/).filter(Boolean));
    const saveSet = (s: Set<string>) => {
      this.className = Array.from(s).join(' ');
    };
    return {
      contains: (cls: string) => getSet().has(cls),
      add: (...clss: string[]) => {
        const s = getSet();
        clss.forEach(c => s.add(c));
        saveSet(s);
      },
      remove: (...clss: string[]) => {
        const s = getSet();
        clss.forEach(c => s.delete(c));
        saveSet(s);
      },
    };
  }

  private syncStyleAttr() {
    const parts: string[] = [];
    for (const [k, v] of this._styleMap.entries()) {
      if (v !== '') parts.push(`${k}: ${v}`);
    }
    if (parts.length > 0) {
      this.attributes.set('style', parts.join('; ') + ';');
    } else {
      this.attributes.delete('style');
    }
  }

  private parseStyleAttr(raw: string) {
    this._styleMap.clear();
    raw.split(';').forEach(pair => {
      const idx = pair.indexOf(':');
      if (idx > 0) {
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        if (k && v) this._styleMap.set(k, v);
      }
    });
  }

  get style(): any {
    const self = this;
    return new Proxy(
      {
        setProperty(prop: string, val: string) {
          self._styleMap.set(prop, val);
          self.syncStyleAttr();
        },
        removeProperty(prop: string) {
          self._styleMap.delete(prop);
          self.syncStyleAttr();
        },
        get cssText() {
          return self.attributes.get('style') || '';
        },
        set cssText(val: string) {
          self.parseStyleAttr(val);
          self.attributes.set('style', val);
        },
      },
      {
        get(target, prop: string) {
          if (prop in target) return (target as any)[prop];
          const kebab = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
          return self._styleMap.get(kebab) || '';
        },
        set(target, prop: string, value: string) {
          if (prop in target) {
            (target as any)[prop] = value;
            return true;
          }
          const kebab = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
          if (value === '' || value === null || value === undefined) {
            self._styleMap.delete(kebab);
          } else {
            self._styleMap.set(kebab, String(value));
          }
          self.syncStyleAttr();
          return true;
        },
      }
    );
  }

  getAttribute(name: string): string | null {
    const val = this.attributes.get(name.toLowerCase());
    return val !== undefined ? val : null;
  }

  setAttribute(name: string, val: string) {
    const lower = name.toLowerCase();
    this.attributes.set(lower, String(val));
    if (lower === 'style') {
      this.parseStyleAttr(String(val));
    }
  }

  removeAttribute(name: string) {
    const lower = name.toLowerCase();
    this.attributes.delete(lower);
    if (lower === 'style') {
      this._styleMap.clear();
    }
  }

  appendChild(child: MiniElement | MiniTextNode) {
    this.ensureParsedChildren();
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: MiniElement | MiniTextNode) {
    this.ensureParsedChildren();
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  insertBefore(newNode: MiniElement | MiniTextNode, refNode: MiniElement | MiniTextNode | null) {
    this.ensureParsedChildren();
    if (!refNode) return this.appendChild(newNode);
    const idx = this.children.indexOf(refNode);
    if (idx === -1) return this.appendChild(newNode);
    if (newNode.parentNode) {
      newNode.parentNode.removeChild(newNode);
    }
    newNode.parentNode = this;
    this.children.splice(idx, 0, newNode);
    return newNode;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  private ensureParsedChildren() {
    if (this._rawInnerHtml !== null) {
      const raw = this._rawInnerHtml;
      this._rawInnerHtml = null;
      const parsed = parseHtmlFragment(raw, this);
      this.children = parsed;
    }
  }

  get innerHTML(): string {
    if (this._rawInnerHtml !== null) return this._rawInnerHtml;
    return this.children.map(c => c.outerHTML).join('');
  }

  set innerHTML(html: string) {
    this.children = [];
    this._rawInnerHtml = html;
  }

  get outerHTML(): string {
    const tag = this.tagName.toLowerCase();
    const attrs = Array.from(this.attributes.entries())
      .map(([k, v]) => ` ${k}="${v.replace(/"/g, '&quot;')}"`)
      .join('');
    if (VOID_TAGS.has(tag)) {
      return `<${tag}${attrs}>`;
    }
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }

  get textContent(): string {
    this.ensureParsedChildren();
    return this.children.map(c => c.textContent).join('');
  }

  set textContent(text: string) {
    this._rawInnerHtml = null;
    const tn = new MiniTextNode(text);
    tn.parentNode = this;
    this.children = [tn];
  }

  matches(selector: string): boolean {
    const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (this.matchesSingle(part)) return true;
    }
    return false;
  }

  private matchesSingle(sel: string): boolean {
    // Match tag[attr="val"] or [attr="val"] or tag.class or tag
    const m = sel.match(/^([a-zA-Z0-9_-]+)?(?:\.([a-zA-Z0-9_-]+))?(?:\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\])?$/);
    if (!m) return false;
    const [, tag, cls, attrName, attrVal] = m;
    if (tag && this.tagName.toLowerCase() !== tag.toLowerCase()) return false;
    if (cls && !this.classList.contains(cls)) return false;
    if (attrName) {
      const actual = this.getAttribute(attrName);
      if (actual === null) return false;
      if (attrVal !== undefined && actual !== attrVal) return false;
    }
    return true;
  }

  querySelectorAll(selector: string): MiniElement[] {
    this.ensureParsedChildren();
    const results: MiniElement[] = [];
    const visit = (el: MiniElement) => {
      el.ensureParsedChildren();
      for (const child of el.children) {
        if (child instanceof MiniElement) {
          if (child.matches(selector)) {
            results.push(child);
          }
          visit(child);
        }
      }
    };
    visit(this);
    return results;
  }

  querySelector(selector: string): MiniElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }
}

export class MiniTextNode {
  text: string;
  parentNode: MiniElement | null = null;

  constructor(text: string) {
    this.text = text;
  }

  get textContent(): string {
    return this.text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, '&');
  }

  get outerHTML(): string {
    return this.text;
  }
}

function parseAttributes(attrString: string, el: MiniElement) {
  const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrString)) !== null) {
    const name = match[1];
    const val = match[2] ?? match[3] ?? match[4] ?? '';
    const unescaped = val
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    el.setAttribute(name, unescaped);
  }
}

function parseHtmlFragment(html: string, rootParent: MiniElement): Array<MiniElement | MiniTextNode> {
  const root = new MiniElement('fragment');
  let current: MiniElement = root;
  const tagRegex = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9_-]+)\s*>|<([a-zA-Z0-9_-]+)((?:\s+[^>]*)?)\s*(\/?)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      const text = html.slice(lastIndex, match.index);
      const tn = new MiniTextNode(text);
      tn.parentNode = current;
      current.children.push(tn);
    }
    lastIndex = tagRegex.lastIndex;

    const [, closeTag, openTag, attrStr, selfClosing] = match;
    if (closeTag) {
      const lowerClose = closeTag.toLowerCase();
      let p: MiniElement | null = current;
      while (p && p !== root && p.tagName.toLowerCase() !== lowerClose) {
        p = p.parentNode;
      }
      if (p && p !== root && p.parentNode) {
        current = p.parentNode;
      }
    } else if (openTag) {
      const el = new MiniElement(openTag);
      if (attrStr) parseAttributes(attrStr, el);
      el.parentNode = current;
      current.children.push(el);
      const isVoid = VOID_TAGS.has(openTag.toLowerCase()) || selfClosing === '/';
      if (!isVoid) {
        current = el;
      }
    }
  }

  if (lastIndex < html.length) {
    const text = html.slice(lastIndex);
    const tn = new MiniTextNode(text);
    tn.parentNode = current;
    current.children.push(tn);
  }

  for (const child of root.children) {
    child.parentNode = rootParent;
  }
  return root.children;
}

export class MiniDocument {
  body: MiniElement;

  constructor(html: string) {
    this.body = new MiniElement('body');
    this.body.children = parseHtmlFragment(html, this.body);
  }

  createElement(tagName: string): MiniElement {
    return new MiniElement(tagName);
  }

  querySelectorAll(selector: string): MiniElement[] {
    return this.body.querySelectorAll(selector);
  }

  querySelector(selector: string): MiniElement | null {
    return this.body.querySelector(selector);
  }
}

export class MiniDOMParser {
  parseFromString(html: string, _mimeType?: string): any {
    return new MiniDocument(html);
  }
}

export function installMiniDomPolyfill() {
  if (typeof globalThis.DOMParser === 'undefined') {
    (globalThis as any).DOMParser = MiniDOMParser;
  }
}
