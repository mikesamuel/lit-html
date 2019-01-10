import { TypedString } from '../string/typedstring';

const blessed: WeakSet<SafeStyle> = new WeakSet();

export class SafeStyle implements TypedString {
    privateDoNotAccessOrElseSafeStyleWrappedValue_: string;
    implementsGoogStringTypedString: boolean = true;

    constructor(content: string) {
        this.privateDoNotAccessOrElseSafeStyleWrappedValue_ = '' + content;
    }

    static createSafeStyleSecurityPrivateDoNotAccessOrElse(
        str: string): SafeStyle {
        const trusted = new SafeStyle(str);
        blessed.add(trusted);
        return trusted;
    }

    static unwrap(x: SafeStyle): string {
        return Reflect.apply(SafeStyle.prototype.getTypedStringValue, x, []);
    }

    getTypedStringValue(): string {
        if (!blessed.has(this)) {
            throw new TypeError();
        }
        return this.privateDoNotAccessOrElseSafeStyleWrappedValue_;
    }

    toString() { return `${ this.constructor.name }{ ${ this.getTypedStringValue() } }`; }
}
