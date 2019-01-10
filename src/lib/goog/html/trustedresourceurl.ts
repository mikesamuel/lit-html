import { TypedString } from '../string/typedstring';

const blessed: WeakSet<TrustedResourceUrl> = new WeakSet();

export class TrustedResourceUrl implements TypedString {
    privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_: string;
    implementsGoogStringTypedString: boolean = true;

    constructor(content: string) {
        this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ = '' + content;
    }

    static createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(
        str: string): TrustedResourceUrl {
        const trusted = new TrustedResourceUrl(str);
        blessed.add(trusted);
        return trusted;
    }

    static unwrap(x: TrustedResourceUrl): string {
        return Reflect.apply(TrustedResourceUrl.prototype.getTypedStringValue, x, []);
    }

    getTypedStringValue(): string {
        if (!blessed.has(this)) {
            throw new TypeError();
        }
        return this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_;
    }

    toString() { return `${ this.constructor.name }{ ${ this.getTypedStringValue() } }`; }
}
