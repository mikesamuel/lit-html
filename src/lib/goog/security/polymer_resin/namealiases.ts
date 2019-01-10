
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

import * as goog_string from '../../string/string';

/**
 * @fileoverview
 * Provides a mapping from HTML attribute to JS object property names.
 */

function transpose(obj: { [key: string]: string }): { [key: string]: string } {
  const out: { [key: string]: string } = {};
  for (const key of Object.getOwnPropertyNames(obj)) {
    out[obj[key]] = key;
  }
  return out;
}

/**
 * Maps JavaScript object property names to HTML attribute names.
 *
 * @param {string} propName a JavaScript object property name.
 * @return {string} an HTML element attribute name.
 */
export function propertyToAttr(propName: string): string {
  let propToAttr = propToAttr_;
  if (!propToAttr) {
    const attrToProp = getAttrToProp_();
    propToAttr = propToAttr_ = transpose(attrToProp);
  }
  const attr = propToAttr[propName];
  if (typeof attr === 'string') {
    return attr;
  }
  // Arguably we could do propName.toLowerCase, but these
  // two functions should be inverses.
  return goog_string.toSelectorCase(propName);
}

/**
 * Maps HTML attribute names to JavaScript object property names.
 *
 * @param {string} attrName an HTML element attribute name.
 * @return {string} a JavaScript object property name.
 */
export function attrToProperty(attrName: string): string {
  const canonAttrName = String(attrName).toLowerCase();
  const attrToProp = getAttrToProp_();
  const prop = attrToProp[canonAttrName];
  if ('string' === typeof (prop)) {
    return prop;
  }
  return goog_string.toCamelCase(canonAttrName);
}

/**
 * Instead of trusting a property name, we assume the worst and
 * try to map it to a property name with known special semantics.
 *
 * @param {string} name a JavaScript object property or HTML attribute name.
 * @return {?string} a JavaScript object property name if there is a special
 *   mapping that is different from that given.
 */
export function specialPropertyNameWorstCase(name: string): string|null {
  const lcname = name.toLowerCase();
  const attrToProp = getAttrToProp_();
  const prop = attrToProp[lcname];
  if ('string' === typeof (prop)) {
    return prop;
  }
  return null;
}

/**
 * Returns a mapping from lower-case HTML attribute names to
 * property names that reflect those attributes.
 *
 * @return {!Object.<string, string>}
 * @private
 */
function getAttrToProp_(): { [key: string]: string } {
  if (!attrToProp_) {
    attrToProp_ = Object.assign({}, ODD_ATTR_TO_PROP_);
    const noncanon = NONCANON_PROPS_;
    for (let i = 0, n = noncanon.length; i < n; ++i) {
      const name = noncanon[i];
      attrToProp_[name.toLowerCase()] = name;
    }
  }
  return attrToProp_;
}

/**
 * Mixed-case property names that correspond directly to an attribute
 * name ignoring case.
 *
 * @type {!Array.<string>}
 * @const
 * @private
 */
const NONCANON_PROPS_: string[] = [
  'aLink',
  'accessKey',
  'allowFullscreen',
  'bgColor',
  'cellPadding',
  'cellSpacing',
  'codeBase',
  'codeType',
  'contentEditable',
  'crossOrigin',
  'dateTime',
  'dirName',
  'formAction',
  'formEnctype',
  'formMethod',
  'formNoValidate',
  'formTarget',
  'frameBorder',
  'innerHTML',
  'innerText',
  'inputMode',
  'isMap',
  'longDesc',
  'marginHeight',
  'marginWidth',
  'maxLength',
  'mediaGroup',
  'minLength',
  'noHref',
  'noResize',
  'noShade',
  'noValidate',
  'noWrap',
  'nodeValue',
  'outerHTML',
  'outerText',
  'readOnly',
  'tabIndex',
  'textContent',
  'trueSpeed',
  'useMap',
  'vAlign',
  'vLink',
  'valueAsDate',
  'valueAsNumber',
  'valueType'
];

/**
 * Attribute name to property name mappings that are neither identity
 * nor simple lowercasing, like {@code "htmlFor"} -> {@code "for"}.
 *
 * @type {!Object.<string, string>}
 * @private
 */
const ODD_ATTR_TO_PROP_: { [key: string]: string } = {
  'accept_charset': 'acceptCharset',
  'char': 'ch',
  'charoff': 'chOff',
  'checked': 'defaultChecked',
  'class': 'className',
  'for': 'htmlFor',
  'http_equiv': 'httpEquiv',
  'muted': 'defaultMuted',
  'selected': 'defaultSelected',
  'value': 'defaultValue'
};

/**
 * Maps lower-case HTML attribute names to property names that reflect
 * those attributes.
 *
 * <p>
 * This is initialized to a partial value that is then lazily fleshed out
 * based on ODD_ATTR_TO_PROP_ and NONCANON_PROPS_.
 * </p>
 *
 * @type {?Object.<string, string>}
 * @private
 */
let attrToProp_: { [key: string]: string }|null = null;

/**
 * Maps property names to lower-case HTML attribute names
 * that are reflected by those properties.
 *
 * Lazily generated from attrToProp_.
 *
 * @type {?Object.<string, string>}
 * @private
 */
let propToAttr_: { [key: string]: string }|null = null;
