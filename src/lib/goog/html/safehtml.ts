import { TypedString } from '../string/typedstring';
import { htmlEscape as escape } from '../string/string';

const blessed: WeakSet<SafeHtml> = new WeakSet();

export class SafeHtml implements TypedString {
    privateDoNotAccessOrElseSafeHtmlWrappedValue_: string;
    implementsGoogStringTypedString: boolean = true;

    constructor(content: string) {
        this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = '' + content;
    }

    static createSafeHtmlSecurityPrivateDoNotAccessOrElse(str: string): SafeHtml {
        const trusted = new SafeHtml(str);
        blessed.add(trusted);
        return trusted;
    }

    static unwrap(x: SafeHtml): string {
        return Reflect.apply(SafeHtml.prototype.getTypedStringValue, x, []);
    }

    getTypedStringValue(): string {
        if (!blessed.has(this)) {
            throw new TypeError();
        }
        return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_;
    }

    toString() { return `${ this.constructor.name }{ ${ this.getTypedStringValue() } }`; }

    static htmlEscape(x: any): SafeHtml {
        if (blessed.has(x)) {
            return (<SafeHtml>x);
        }
        const str = escape(x);
        return SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(str);
    }

    static EMPTY: SafeHtml = SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse('');
}
