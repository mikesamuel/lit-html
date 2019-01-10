export function regExpEscape(str: string): string {
  return String(str)
      .replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
      .replace(/\x08/g, '\\x08');
}


export function toCamelCase(str: string): string {
  return String(str).replace(/\-([a-z])/g, function(_all, match) {
    return match.toUpperCase();
  });
}

export function toSelectorCase(str: string): string {
  return String(str).replace(/([A-Z])/g, '-$1').toLowerCase();
}

const AMP_RE_ = /&/g;
const LT_RE_ = /</g;
const GT_RE_ = />/g;
const QUOT_RE_ = /"/g;
const SINGLE_QUOTE_RE_ = /'/g;
const NULL_RE_ = /\x00/g;

export function htmlEscape(x: any): string {
  return String(x).replace(AMP_RE_, '&amp;')
        .replace(LT_RE_, '&lt;')
        .replace(GT_RE_, '&gt;')
        .replace(QUOT_RE_, '&quot;')
        .replace(SINGLE_QUOTE_RE_, '&#39;')
        .replace(NULL_RE_, '&#0;');
}
