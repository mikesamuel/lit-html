// **** GENERATED CODE, DO NOT MODIFY ****
/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * @fileoverview
 * Determines the appropriate safe HTML type for HTML attribute value
 * given HTML document context.
 *
 * Public APIs take canonical names -- HTML element and attribute
 * names should be lower-case.
 *
 * For questions or help, contact ise-hardening@.
 *
 * @visibility {//visibility:public}
 */

export type AttrTypeT = number;
/**
 * The types of attributes.
 *
 * @enum {number}
 */
export const AttrType: { [key: string]: AttrTypeT } = {
  // Copied from html_contract.proto
  /** May be an arbitrary string. */
  NONE: 1,
  SAFE_HTML: 2,
  SAFE_URL: 3,
  TRUSTED_RESOURCE_URL: 4,
  SAFE_STYLE: 5,
  SAFE_SCRIPT: 7,
  /** Attribute must be one of enum_values. */
  ENUM: 8,
  COMPILE_TIME_CONSTANT: 9,
  /** a compile time constant prefix and a variable suffix. */
  IDENTIFIER: 10
};


export type ElementContentTypeT = number;
/**
 * The types of content allowed to specify text nodes.
 *
 * @enum {number}
 */
export const ElementContentType: { [key: string]: ElementContentTypeT } = {
  /** Must be specified, raise error if not present. */
  CONTRACT_UNSPECIFIED: 0,
  /** Element with SafeHtml contents. The common case. */
  SAFE_HTML: 1,
  /** Element with SafeStyleSheet contents. */
  SAFE_STYLESHEET: 2,
  /** Element with SafeScript contents. */
  SAFE_SCRIPT: 3,
  /**
   * Disallow this element entirely.
   *
   * Implementations may rely either on blacklisting or
   * whitelisting.  If whitelisting, blacklisted elements might
   * still raise a special error message to explain the security
   * problems with this element.
   */
  BLACKLIST: 4,
  /**
   * Void element, no contents, only attributes.
   * @see http://whatwg.org/html/syntax.html#void-elements
   */
  VOID: 5,
  /**
   * String safe to include in an RCDATA context.
   * @see https://www.w3.org/TR/html51/syntax.html#rcdata-state
   */
  STRING_RCDATA: 6
};


/**
 * The type of value allowed for the given attribute.
 *
 * @param {string} elName The name of the element containing the attribute.
 *     Canonical.
 * @param {string} attrName The name of the attribute whose value type
 *     should be returned.  Canonical.
 * @param {function (string) : *} getValue
 *     Gets the value of the given attribute in the element.
 *     Called for attributes whose meaning is contingent on other attributes.
 *     A null or undefined result indicates that the attribute value is
 *     unknown or undefined.
 * @return {?security.html.contracts.AttrType} null to indicate unknown.
 */
export function typeOfAttribute(
    elName: string, attrName: string, getValue: (attrName: string) => any) {
  // First look for an element specific attribute.
  if (Object.hasOwnProperty.call(
          ELEMENT_CONTRACTS_, elName)) {
    const elementInfo = ELEMENT_CONTRACTS_[elName];
    if (Object.hasOwnProperty.call(elementInfo, attrName)) {
      const attrInfoArray = elementInfo[attrName];
      if (attrInfoArray instanceof Array) {
        let valueCache: { [key: string]: any }|null = null;  // Cache calls to getValue
        let requiredValueNotFound = false;
        for (let i = 0, n = attrInfoArray.length; i < n; ++i) {
          const attrInfo = attrInfoArray[i];
          const contingentAttr = attrInfo.contingentAttribute;
          if (!contingentAttr) {
            return attrInfo.contract;  // Not contingent
          }
          if (valueCache === null) { valueCache = {}; }
          const actualValue: any =
              Object.hasOwnProperty.call(
                  /** @type{!Object} */(valueCache), contingentAttr)
              ? valueCache[contingentAttr]
              : valueCache[contingentAttr] = getValue(contingentAttr);
          if (actualValue === attrInfo.requiredValue) {
            return attrInfo.contract;
          } else if (actualValue == null /* intentionally match undefined */) {
            requiredValueNotFound = true;
          }
        }
        // Do not fall back to global attributes if there are contingent
        // attributes defined for which we could not find a value that
        // definitely ruled out a match.
        if (requiredValueNotFound) {
          return null;
        }
      }
    }
  }

  const globalAttrType = GLOBAL_ATTRS_[attrName];
  return (typeof globalAttrType === 'number') ? globalAttrType : null;
}


/**
 * The type of content allowed to specify child text or CDATA nodes for elements
 * with the given name.
 *
 * @param {string} elemName A canonical (lower-case) HTML element name.
 * @return {?ElementContentTypeT}
 */
export function contentTypeForElement(elemName: string): ElementContentTypeT|null {
  if (Object.hasOwnProperty.call(ELEMENT_CONTENT_TYPES_, elemName)) {
    return ELEMENT_CONTENT_TYPES_[elemName];
  }
  return null;
}

/**
 * True if the given value is allowed for the specified ENUM attribute.
 *
 * @param {string} elemName A canonical (lower-case) HTML element name of the
 *    element containing the attribute.
 * @param {string} attrName A canonical (lower-case) HTML attribute name.
 * @param {string} value The value of the named attribute.
 * @return {boolean} true if the named attribute has attribute type
 *    {@link security.html.contracts.AttrType.ENUM} and value is in the
 *    allowed value set.
 *
 *    Do not rely on the return value for an attribute that is not an
 *    enum attribute, because the return value will probably be false
 *    even though whether it is allowed should be based on the
 *    contract, but it could be true for an attribute that has a
 *    global contract ENUM but is overridden to have a different type
 *    contract on elements with the given name.
 */
export function isEnumValueAllowed(
    elemName: string, attrName: string, value: string): boolean {
  /** @type {?number} */
  let valueSetIndex = null;
  let attrToValueSetIndex =
      ENUM_VALUE_SET_BY_ATTR_[elemName];
  if (attrToValueSetIndex) {
    valueSetIndex = attrToValueSetIndex[attrName];
  }
  if ('number' !== typeof (valueSetIndex)) {
    attrToValueSetIndex =
        ENUM_VALUE_SET_BY_ATTR_['*'];
    if (attrToValueSetIndex) {
      valueSetIndex = attrToValueSetIndex[attrName];
    }
    if ('number' !== typeof (valueSetIndex)) {
      return false;
    }
  }
  /** @type {!Object<string, boolean>} */
  const valueSet = ENUM_VALUE_SETS_[valueSetIndex];

  // Keyword values in HTML attribute values tend to be case insensitive.
  const lcValue = String(value).toLowerCase();

  // Comparing directly to true filters out values on Object.prototype.
  return true === valueSet[lcValue];
}


/**
 * Contracts that affect all elements unless there is an applicable
 * per-element contract.
 *
 * @type {!Object.<string, AttrTypeT>}
 * @private
 * @const
 */
const GLOBAL_ATTRS_: { [key: string]: AttrTypeT } = {
  'align': AttrType.NONE,
  'alt': AttrType.NONE,
  'aria-activedescendant': AttrType.IDENTIFIER,
  'aria-atomic': AttrType.NONE,
  'aria-autocomplete': AttrType.NONE,
  'aria-busy': AttrType.NONE,
  'aria-checked': AttrType.NONE,
  'aria-disabled': AttrType.NONE,
  'aria-dropeffect': AttrType.NONE,
  'aria-expanded': AttrType.NONE,
  'aria-haspopup': AttrType.NONE,
  'aria-hidden': AttrType.NONE,
  'aria-invalid': AttrType.NONE,
  'aria-label': AttrType.NONE,
  'aria-level': AttrType.NONE,
  'aria-live': AttrType.NONE,
  'aria-multiline': AttrType.NONE,
  'aria-multiselectable': AttrType.NONE,
  'aria-orientation': AttrType.NONE,
  'aria-posinset': AttrType.NONE,
  'aria-pressed': AttrType.NONE,
  'aria-readonly': AttrType.NONE,
  'aria-relevant': AttrType.NONE,
  'aria-required': AttrType.NONE,
  'aria-selected': AttrType.NONE,
  'aria-setsize': AttrType.NONE,
  'aria-sort': AttrType.NONE,
  'aria-valuemax': AttrType.NONE,
  'aria-valuemin': AttrType.NONE,
  'aria-valuenow': AttrType.NONE,
  'aria-valuetext': AttrType.NONE,
  'autocapitalize': AttrType.NONE,
  'autocomplete': AttrType.NONE,
  'autocorrect': AttrType.NONE,
  'autofocus': AttrType.NONE,
  'bgcolor': AttrType.NONE,
  'border': AttrType.NONE,
  'checked': AttrType.NONE,
  'class': AttrType.NONE,
  'color': AttrType.NONE,
  'cols': AttrType.NONE,
  'colspan': AttrType.NONE,
  'dir': AttrType.ENUM,
  'disabled': AttrType.NONE,
  'draggable': AttrType.NONE,
  'face': AttrType.NONE,
  'for': AttrType.IDENTIFIER,
  'frameborder': AttrType.NONE,
  'height': AttrType.NONE,
  'hidden': AttrType.NONE,
  'href': AttrType.TRUSTED_RESOURCE_URL,
  'hreflang': AttrType.NONE,
  'id': AttrType.IDENTIFIER,
  'ismap': AttrType.NONE,
  'label': AttrType.NONE,
  'lang': AttrType.NONE,
  'list': AttrType.IDENTIFIER,
  'loop': AttrType.NONE,
  'max': AttrType.NONE,
  'maxlength': AttrType.NONE,
  'min': AttrType.NONE,
  'multiple': AttrType.NONE,
  'muted': AttrType.NONE,
  'name': AttrType.IDENTIFIER,
  'placeholder': AttrType.NONE,
  'preload': AttrType.NONE,
  'rel': AttrType.NONE,
  'required': AttrType.NONE,
  'reversed': AttrType.NONE,
  'role': AttrType.NONE,
  'rows': AttrType.NONE,
  'rowspan': AttrType.NONE,
  'selected': AttrType.NONE,
  'shape': AttrType.NONE,
  'size': AttrType.NONE,
  'sizes': AttrType.NONE,
  'span': AttrType.NONE,
  'spellcheck': AttrType.NONE,
  'src': AttrType.TRUSTED_RESOURCE_URL,
  'start': AttrType.NONE,
  'step': AttrType.NONE,
  'style': AttrType.SAFE_STYLE,
  'summary': AttrType.NONE,
  'tabindex': AttrType.NONE,
  'target': AttrType.ENUM,
  'title': AttrType.NONE,
  'translate': AttrType.NONE,
  'valign': AttrType.NONE,
  'value': AttrType.NONE,
  'width': AttrType.NONE,
  'wrap': AttrType.NONE,
};

/**
 * @typedef {
 *   {
 *     contract: AttrTypeT,
 *     contingentAttribute: (string|undefined),
 *     requiredValue: (string|undefined)
 *   }
 * }
 */
interface AttributeContract {
  contract: AttrTypeT;
  contingentAttribute?: (string|undefined);
  requiredValue?: (string|undefined);
}

/**
 * Maps attribute names to details about the attribute.
 * @typedef {!Object.<string, !Array.<!AttributeContract>>}
 */
type ElementContract = { [key: string]: Array<AttributeContract> };


/**
 * Per element contracts.
 *
 * @type {!Object.<string, !security.html.contracts.ElementContract>}
 * @private
 * @const
 */
const ELEMENT_CONTRACTS_: { [key: string]: ElementContract } = {
  'a': {
    'href': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'area': {
    'href': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'audio': {
    'src': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'blockquote': {
    'cite': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'button': {
    'formaction': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
    'formmethod': [
      {
        contract: AttrType.NONE,
      },
    ],
    'type': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'command': {
    'type': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'del': {
    'cite': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'form': {
    'action': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
    'method': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'iframe': {
    'srcdoc': [
      {
        contract: AttrType.SAFE_HTML,
      },
    ],
  },
  'img': {
    'src': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'input': {
    'formaction': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
    'formmethod': [
      {
        contract: AttrType.NONE,
      },
    ],
    'pattern': [
      {
        contract: AttrType.NONE,
      },
    ],
    'readonly': [
      {
        contract: AttrType.NONE,
      },
    ],
    'src': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
    'type': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'ins': {
    'cite': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'li': {
    'type': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'link': {
    'href': [
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'alternate'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'author'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'bookmark'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'canonical'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'cite'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'help'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'icon'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'license'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'next'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'prefetch'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'prerender'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'preconnect'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'preload'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'prev'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'search'
      },
      {
        contract: AttrType.SAFE_URL,
        contingentAttribute: 'rel',
        requiredValue: 'subresource'
      },
    ],
    'media': [
      {
        contract: AttrType.NONE,
      },
    ],
    'nonce': [
      {
        contract: AttrType.NONE,
      },
    ],
    'type': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'menuitem': {
    'icon': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'ol': {
    'type': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'q': {
    'cite': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'script': {
    'nonce': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'source': {
    'media': [
      {
        contract: AttrType.NONE,
      },
    ],
    'src': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
  'style': {
    'media': [
      {
        contract: AttrType.NONE,
      },
    ],
    'nonce': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'time': {
    'datetime': [
      {
        contract: AttrType.NONE,
      },
    ],
  },
  'video': {
    'autoplay': [
      {
        contract: AttrType.NONE,
      },
    ],
    'controls': [
      {
        contract: AttrType.NONE,
      },
    ],
    'poster': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
    'src': [
      {
        contract: AttrType.SAFE_URL,
      },
    ],
  },
};


/**
 * The type of text content per element.
 *
 * @type {!Object.<string, ElementContentType>}
 * @private
 * @const
 */
const ELEMENT_CONTENT_TYPES_: { [key: string]: ElementContentTypeT } = {
  'a': ElementContentType.SAFE_HTML,
  'abbr': ElementContentType.SAFE_HTML,
  'address': ElementContentType.SAFE_HTML,
  'applet': ElementContentType.BLACKLIST,
  'area': ElementContentType.VOID,
  'article': ElementContentType.SAFE_HTML,
  'aside': ElementContentType.SAFE_HTML,
  'audio': ElementContentType.SAFE_HTML,
  'b': ElementContentType.SAFE_HTML,
  'base': ElementContentType.BLACKLIST,
  'bdi': ElementContentType.SAFE_HTML,
  'bdo': ElementContentType.SAFE_HTML,
  'blockquote': ElementContentType.SAFE_HTML,
  'body': ElementContentType.SAFE_HTML,
  'br': ElementContentType.VOID,
  'button': ElementContentType.SAFE_HTML,
  'canvas': ElementContentType.SAFE_HTML,
  'caption': ElementContentType.SAFE_HTML,
  'cite': ElementContentType.SAFE_HTML,
  'code': ElementContentType.SAFE_HTML,
  'col': ElementContentType.VOID,
  'colgroup': ElementContentType.SAFE_HTML,
  'command': ElementContentType.SAFE_HTML,
  'data': ElementContentType.SAFE_HTML,
  'datalist': ElementContentType.SAFE_HTML,
  'dd': ElementContentType.SAFE_HTML,
  'del': ElementContentType.SAFE_HTML,
  'details': ElementContentType.SAFE_HTML,
  'dfn': ElementContentType.SAFE_HTML,
  'dialog': ElementContentType.SAFE_HTML,
  'div': ElementContentType.SAFE_HTML,
  'dl': ElementContentType.SAFE_HTML,
  'dt': ElementContentType.SAFE_HTML,
  'em': ElementContentType.SAFE_HTML,
  'embed': ElementContentType.BLACKLIST,
  'fieldset': ElementContentType.SAFE_HTML,
  'figcaption': ElementContentType.SAFE_HTML,
  'figure': ElementContentType.SAFE_HTML,
  'font': ElementContentType.SAFE_HTML,
  'footer': ElementContentType.SAFE_HTML,
  'form': ElementContentType.SAFE_HTML,
  'frame': ElementContentType.SAFE_HTML,
  'frameset': ElementContentType.SAFE_HTML,
  'h1': ElementContentType.SAFE_HTML,
  'h2': ElementContentType.SAFE_HTML,
  'h3': ElementContentType.SAFE_HTML,
  'h4': ElementContentType.SAFE_HTML,
  'h5': ElementContentType.SAFE_HTML,
  'h6': ElementContentType.SAFE_HTML,
  'head': ElementContentType.SAFE_HTML,
  'header': ElementContentType.SAFE_HTML,
  'hr': ElementContentType.VOID,
  'html': ElementContentType.SAFE_HTML,
  'i': ElementContentType.SAFE_HTML,
  'iframe': ElementContentType.SAFE_HTML,
  'img': ElementContentType.VOID,
  'input': ElementContentType.VOID,
  'ins': ElementContentType.SAFE_HTML,
  'kbd': ElementContentType.SAFE_HTML,
  'keygen': ElementContentType.VOID,
  'label': ElementContentType.SAFE_HTML,
  'legend': ElementContentType.SAFE_HTML,
  'li': ElementContentType.SAFE_HTML,
  'link': ElementContentType.VOID,
  'main': ElementContentType.SAFE_HTML,
  'map': ElementContentType.SAFE_HTML,
  'mark': ElementContentType.SAFE_HTML,
  'math': ElementContentType.BLACKLIST,
  'menu': ElementContentType.SAFE_HTML,
  'menuitem': ElementContentType.SAFE_HTML,
  'meta': ElementContentType.BLACKLIST,
  'meter': ElementContentType.SAFE_HTML,
  'nav': ElementContentType.SAFE_HTML,
  'noscript': ElementContentType.SAFE_HTML,
  'object': ElementContentType.BLACKLIST,
  'ol': ElementContentType.SAFE_HTML,
  'optgroup': ElementContentType.SAFE_HTML,
  'option': ElementContentType.SAFE_HTML,
  'output': ElementContentType.SAFE_HTML,
  'p': ElementContentType.SAFE_HTML,
  'param': ElementContentType.VOID,
  'picture': ElementContentType.SAFE_HTML,
  'pre': ElementContentType.SAFE_HTML,
  'progress': ElementContentType.SAFE_HTML,
  'q': ElementContentType.SAFE_HTML,
  'rb': ElementContentType.SAFE_HTML,
  'rp': ElementContentType.SAFE_HTML,
  'rt': ElementContentType.SAFE_HTML,
  'rtc': ElementContentType.SAFE_HTML,
  'ruby': ElementContentType.SAFE_HTML,
  's': ElementContentType.SAFE_HTML,
  'samp': ElementContentType.SAFE_HTML,
  'script': ElementContentType.SAFE_SCRIPT,
  'section': ElementContentType.SAFE_HTML,
  'select': ElementContentType.SAFE_HTML,
  'slot': ElementContentType.SAFE_HTML,
  'small': ElementContentType.SAFE_HTML,
  'source': ElementContentType.VOID,
  'span': ElementContentType.SAFE_HTML,
  'strong': ElementContentType.SAFE_HTML,
  'style': ElementContentType.SAFE_STYLESHEET,
  'sub': ElementContentType.SAFE_HTML,
  'summary': ElementContentType.SAFE_HTML,
  'sup': ElementContentType.SAFE_HTML,
  'svg': ElementContentType.BLACKLIST,
  'table': ElementContentType.SAFE_HTML,
  'tbody': ElementContentType.SAFE_HTML,
  'td': ElementContentType.SAFE_HTML,
  'template': ElementContentType.BLACKLIST,
  'textarea': ElementContentType.STRING_RCDATA,
  'tfoot': ElementContentType.SAFE_HTML,
  'th': ElementContentType.SAFE_HTML,
  'thead': ElementContentType.SAFE_HTML,
  'time': ElementContentType.SAFE_HTML,
  'title': ElementContentType.STRING_RCDATA,
  'tr': ElementContentType.SAFE_HTML,
  'track': ElementContentType.VOID,
  'u': ElementContentType.SAFE_HTML,
  'ul': ElementContentType.SAFE_HTML,
  'var': ElementContentType.SAFE_HTML,
  'video': ElementContentType.SAFE_HTML,
  'wbr': ElementContentType.VOID,
};


/**
 * Sets of element values allowed for attributes with AttrType ENUM.
 * @type {!Array.<!Object<string,boolean>>}
 * @private
 * @const
 */
const ENUM_VALUE_SETS_: Array<{ [key: string]: boolean }> = [
  {
    'auto': true,
    'ltr': true,
    'rtl': true,
  },
  {
    '_self': true,
    '_blank': true,
  },
];


/**
 * Maps element names (or '*' for global) to maps of attribute names
 * to indices into the ENUM_VALUE_SETS_ array.
 * @type {!Object.<string, !Object<string, number>>}
 * @private
 * @const
 */
const ENUM_VALUE_SET_BY_ATTR_: { [key: string]: { [key: string]: number } } = {
  '*': {
    'dir': 0,
    'target': 1,
  },
};
