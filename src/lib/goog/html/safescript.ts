import { TypedString } from '../string/typedstring';

const blessed: WeakSet<SafeScript> = new WeakSet();

export class SafeScript implements TypedString {
    privateDoNotAccessOrElseSafeScriptWrappedValue_: string;
    implementsGoogStringTypedString: boolean = true;

    constructor(content: string) {
        this.privateDoNotAccessOrElseSafeScriptWrappedValue_ = '' + content;
    }

    static createSafeScriptSecurityPrivateDoNotAccessOrElse(
        str: string): SafeScript {
        const trusted = new SafeScript(str);
        blessed.add(trusted);
        return trusted;
    }

    static unwrap(x: SafeScript): string {
        return Reflect.apply(SafeScript.prototype.getTypedStringValue, x, []);
    }

    getTypedStringValue(): string {
        if (!blessed.has(this)) {
            throw new TypeError();
        }
        return this.privateDoNotAccessOrElseSafeScriptWrappedValue_;
    }

    toString() { return `${ this.constructor.name }{ ${ this.getTypedStringValue() } }`; }
}
