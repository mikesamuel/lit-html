/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
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

'use strict';


/**
 * @fileoverview
 * Provides a safe types bridge that recognizes goog.html.Safe*.
 */

import { SafeHtml } from '../../html/safehtml';
import { SafeScript } from '../../html/safescript';
import { SafeStyle } from '../../html/safestyle';
import { SafeUrl } from '../../html/safeurl';
import { TrustedResourceUrl } from '../../html/trustedresourceurl';
import { htmlEscape } from '../../string/string';
import { Const } from '../../string/const';
import { TypedString } from '../../string/typedstring';
import { SafeTypeT } from './sanitizer';

const coerceToString = String;

/**
 * @typedef {{typeToUnwrap: !Function, unwrap: !Function}}
 */
interface Unwrapper {
    typeToUnwrap: Function;
    unwrap: (x: any, fallback: any) => any;
}

/**
 * @typedef {function (string, *): ?}
 */
type filter = (t: string, value: any) => any;


/**
 * Unwraps any typed string input.
 * @param {?} value A value that might be a typed string.
 * @return {?} the content if value is a wrapped string, or value otherwise.
 * @private
 */
function unwrapString_(value: any): any {
  return (value && value.implementsGoogStringTypedString)
      ? (/** @type {!goog_string.TypedString} */(<TypedString>value))
        .getTypedStringValue()
      : value;
}

// copybara:strip_begin
// LINT.IfChange(security_contracts)
// copybara:strip_end
/**
 * @type {!Object<string, !security.polymer_resin.closure_bridge.unwrapper>}
 * @private
 * @const
 */
const UNWRAPPERS_: { [key: string]: Unwrapper } = {
  // Keys are security.polymer_resin.SafeType but adding a dependency on
  // polymer_resin just to get that type breaks webcomponent_binaries since
  // polymer_resin is depended upon as both a js_dep and a wc_dep.
  'CONSTANT': {
    typeToUnwrap: Const,
    unwrap: Const.unwrap
  },
  'JAVASCRIPT': {
    typeToUnwrap: SafeScript,
    unwrap: SafeScript.unwrap
  },
  'HTML': {
    typeToUnwrap: SafeHtml,
    unwrap: SafeHtml.unwrap
  },
  'RESOURCE_URL': {
    typeToUnwrap: TrustedResourceUrl,
    unwrap: TrustedResourceUrl.unwrap
  },
  'STRING': {
    typeToUnwrap: Object,
    unwrap: unwrapString_
  },
  'STYLE': {
    typeToUnwrap: SafeStyle,
    unwrap: SafeStyle.unwrap
  },
  'URL': {
    typeToUnwrap: SafeUrl,
    unwrap: SafeUrl.unwrap
  }
};


/**
 * @type {!security.polymer_resin.closure_bridge.filter}
 * @private
 * @const
 */
function disallow_(_value: any, fallback: any): any {
  return fallback;
}

/**
 * @type {!Object<string, !filter>}
 * @private
 * @const
 */
const FILTERS_: { [key: string]: filter } = {
  /* Just returns the safe replacement value because we have no
   * way of knowing that a raw string is a compile-time constant.
   */
  'CONSTANT': disallow_,
  /* Just returns the safe replacement value because we have no
   * way of knowing that a raw string is safe JavaScript so rely
   * on RTTI in all cases.
   */
  'JAVASCRIPT': disallow_,
  /* Converts plain text to HTML that parses to a text node with
   * equivalent content.
   */
  'HTML': htmlEscape,
  /* Just returns the safe replacement value because we have no
   * way of declaring that a raw string is a trusted resource so
   * rely on RTTI in all cases.
   */
  'RESOURCE_URL': disallow_,
  'STRING': String,
  /* Just returns the safe replacement value because we have no
   * way of knowing that a raw string is safe CSS so rely on RTTI
   * in all cases.
   */
  'STYLE': disallow_,
  'URL': (
      /**
       * Allows safe URLs through, but rejects unsafe ones.
       * @param {string} value attribute value
       * @param {*} fallback returned if value is rejected as unsafe.
       * @return {?}
       */
      function allowSafeUrl(value, fallback) {
        // TODO: Can we do without creating a SafeUrl instance?
        const safeValue = SafeUrl.sanitize(value).getTypedStringValue();
        if (safeValue === SafeUrl.INNOCUOUS_STRING) {
          return fallback;
        }
        return safeValue;
      })
};

/**
 * A security.polymer_resin.SafeTypeBridge.
 *
 * @param {*} value the value whose trustedness is being check.
 * @param {string} type a security.polymer_resin.SafeType value
 * @param {*} fallback the value to return if value is not trusted as a value of type.
 * @return {?}
 */
export function safeTypesBridge(value: any, type: SafeTypeT, fallback: any): any {
      /** @type {!security.polymer_resin.closure_bridge.unwrapper} */
      const unwrapper: Unwrapper = UNWRAPPERS_[type];
      if (value instanceof unwrapper.typeToUnwrap) {
        const uw = unwrapper.unwrap(value, fallback);
        if (uw !== fallback) {
          return uw;
        }
      }

      /** @type {!security.polymer_resin.closure_bridge.filter} */
      const filter = FILTERS_[type];
      return filter(
          coerceToString(unwrapString_(value)),
          fallback);
    }

