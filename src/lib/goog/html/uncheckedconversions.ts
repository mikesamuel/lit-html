import { SafeHtml } from './safehtml';

export function safeHtmlFromStringKnownToSatisfyTypeContract(
    justification: any, html: string): SafeHtml {
  if (!justification) { throw new Error(); }  // Stubs out ConstString check.
  return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(html);
}
