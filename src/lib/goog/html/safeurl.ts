import { TypedString } from '../string/typedstring';
import { TrustedResourceUrl } from './trustedresourceurl';

const blessed: WeakSet<SafeUrl> = new WeakSet();

const SAFE_URL_PATTERN_ = /^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i;

export class SafeUrl implements TypedString {
    privateDoNotAccessOrElseSafeUrlWrappedValue_: string;
    implementsGoogStringTypedString: boolean = true;

    constructor(content: string) {
        this.privateDoNotAccessOrElseSafeUrlWrappedValue_ = '' + content;
    }

    static createSafeUrlSecurityPrivateDoNotAccessOrElse(str: string): SafeUrl {
        const trusted = new SafeUrl(str);
        blessed.add(trusted);
        return trusted;
    }

    static unwrap(x: SafeUrl): string {
        return Reflect.apply(SafeUrl.prototype.getTypedStringValue, x, []);
    }

    getTypedStringValue(): string {
        if (!blessed.has(this)) {
            throw new TypeError();
        }
        return this.privateDoNotAccessOrElseSafeUrlWrappedValue_;
    }

    toString() { return `${ this.constructor.name }{ ${ this.getTypedStringValue() } }`; }

    static fromTrustedResourceUrl(tru: TrustedResourceUrl) {
        return SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(
            TrustedResourceUrl.unwrap(tru));
    }

    static sanitize(url: any): SafeUrl {
        if (blessed.has(url)) {
            return (<SafeUrl>url);
        } else if (typeof url === 'object' && url.implementsGoogStringTypedString) {
            url = (<TypedString>url).getTypedStringValue();
        } else {
            url = String(url);
        }
        if (!SAFE_URL_PATTERN_.test(url)) {
           url = SafeUrl.INNOCUOUS_STRING;
        }
        return SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
    }

    static INNOCUOUS_STRING: string = 'about:invalid#zClosurez';
}
