
import { SafeHtml } from '../html/safehtml';

export function setInnerHtml(dest: Element, html: SafeHtml) {
  dest.innerHTML = SafeHtml.unwrap(html);
}
