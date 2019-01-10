import { TypedString } from './typedstring';

const TOKEN: {} = {};

const blessed: WeakSet<Const> = new WeakSet();

export class Const implements TypedString {
    implementsGoogStringTypedString: boolean = true;
    content_: string;

    constructor(token: any, content: string) {
        if (token !== TOKEN) {
            throw new Error();
        }
        this.content_ = '' + content;
    }

    getTypedStringValue(): string {
        if (!blessed.has(this)) { throw new TypeError(); }
        return this.content_;
    }

    static unwrap(x: TypedString): string {
        return Reflect.apply(Const.prototype.getTypedStringValue, x, []);
    }

    static from(str: string): TypedString {
        const c = new Const(TOKEN, String(str));
        blessed.add(c);
        return c;
    }

    toString() { return `Const{ ${ this.content_ } }`; }
}