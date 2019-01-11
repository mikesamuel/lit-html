import { SafeHtml } from './safehtml';
import { SafeUrl } from './safeurl';

export function newSafeHtmlForTest(str : string) : SafeHtml {
  return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(str);
}

export function newSafeUrlForTest(str : string) : SafeUrl {
  return SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(str);
}
