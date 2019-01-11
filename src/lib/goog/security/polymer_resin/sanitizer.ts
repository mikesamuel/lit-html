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

'use strict';

const goog = {
  DEBUG: true
};


/**
 * @fileoverview
 * Mitigates XSS in Polymer applications by intercepting and vetting
 * results of data binding expressions before they reach browser internals.
 */

import * as goog_string from '../../string/string';
import * as security_html_contracts from './contracts';
import * as security_html_namealiases from './namealiases';
import { classifyElement, CustomElementClassification } from './classify';

/**
 * Type for a configuration object that can be passed to install.
 *
 * <hr>
 *
 * When `UNSAFE_passThruDisallowedValues` is `true`,
 * disallowed values will not be replaced so may reach
 * unsafe browser sinks resulting in a security vulnerability.
 * <p>
 * This mode is provided only to allow testing of an application
 * to find and compile the kinds of false positives triggered by
 * an application that is being migrated to use polymer resin.
 * <p>
 * This MUST NOT be used in production with end users and
 * MUST NOT be set based on any attacker-controllable state like
 * URL parameters.
 * <p>
 * If you never specify this property, you are safer.
 *
 * <p>
 * When not in goog.DEBUG mode, this is ignored.
 *
 * <hr>
 *
 * `allowedIdentifierPrefixes` specifies prefixes for allowed values
 * for attributes with type IDENTIFIER.
 * <p>
 * By default, only the empty identifier is allowed.
 *
 * <hr>
 *
 * `reportHandler` is a callback that receives reports about rejected
 * values and module status
 * <p>
 * By default, if `goog.DEBUG` is false at init time, reportHandler is
 * never called, and if `goog.DEBUG` is true at init time, reportHandler
 * logs to the JS developer console.
 * <p>
 * Assuming it is enabled, either via `goog.DEBUG` or an explicit call to
 * this setter, then it is called on every rejected value, and on major events
 * like module initialization.
 * <p>
 * This may be used to identify false positives during debugging; to compile
 * lists of false positives when migrating; or to gather telemetry by
 * compiling a table summarizing disallowed value reports.
 *
 * @typedef {{
 *   'UNSAFE_passThruDisallowedValues': (?boolean | undefined),
 *   'allowedIdentifierPrefixes': (?Array.<string> | undefined),
 *   'safeTypesBridge': (?security.polymer_resin.SafeTypesBridge | undefined),
 *   'reportHandler': (?security.polymer_resin.ReportHandler | undefined)
 * }}
 */
export interface Configuration {
    UNSAFE_passThruDisallowedValues?: boolean;
    allowedIdentifierPrefixes?: Array<string>;
    safeTypesBridge?: SafeTypesBridge;
    reportHandler?: ReportHandler;
}

export type SafeTypeT = 'CONSTANT' | 'HTML' | 'JAVASCRIPT' | 'RESOURCE_URL' |
    'STRING' | 'STYLE' | 'URL';
/**
 * Identifiers used for safe strings interop.
 *
 * @enum {string}
 */
export const SafeType: { [key: string]: SafeTypeT } = {
  CONSTANT: 'CONSTANT',
  HTML: 'HTML',
  JAVASCRIPT: 'JAVASCRIPT',
  RESOURCE_URL: 'RESOURCE_URL',
  /** Unprivileged but possibly wrapped string. */
  STRING: 'STRING',
  STYLE: 'STYLE',
  URL: 'URL'
};


/**
 * A function that bridges to safe type libraries.
 *
 * <p>
 * It takes three arguments:
 * <ol>
 *   <li>value - The value that has been offered as appropriate in context.</li>
 *   <li>type - Identifies the kind of string that is appropriate.</li>
 *   <li>fallback - Returned if bridge can't find a safe variant of value.</li>
 * </ol>
 *
 * <p>
 * It MUST return fallback if it cannot find a safe value.
 * Rather than substitute a safe constant if value cannot be made safe, it
 * SHOULD return fallback so that the caller can distinguish and log policy
 * violations.
 *
 * @typedef {function(*, !SafeTypeT, *): ?}
 */
export type SafeTypesBridge = (value: any, type: SafeTypeT, fallback: any) => any;


/**
 * A function that takes (isDisallowedValue, printfFormatString, printfArgs).
 * The arguments are ready to forward straight to the console with minimal
 * overhead.
 * <p>
 * If isDisallowedValue is true then the args have the printArgs have the form
 * [contextNodeName, nodeName, attributeOrPropertyName, disallowedValue].
 * <p>
 * The context node is the element being manipulated, or if nodeName is "#text",
 * then contextNode is the parent of the text node being manipulated, so
 * the contextNode should always be an element or document fragment.
 * In that case, attributeOrPropertyName can be ignored.
 * <p>
 * If null then reporting is disabled.
 *
 * @typedef {?function (boolean, string, ...*)}
 */
export type ReportHandler = (isViolation: boolean, context: string, ...args: Array<any>) => any;


/**
 * Maps Safe HTML types to handlers.
 *
 * @typedef {{
 *   filter:          ?function(string, string, string):string,
 *   safeReplacement: ?string,
 *   safeType:        ?SafeTypeT
 * }}
 */
export interface ValueHandler {
    filter: null | ((e: string, a: string, v: string) => string);
    safeReplacement: null | string;
    safeType: null | SafeTypeT;
}


/**
 * A report handler that logs to the browser's developer console.
 * <p>
 * This report handler is used if none is explicitly specified and
 * goog.DEBUG is true at install time.
 * <p>
 * Violations (see isViolation in ReportHandler docs) are logged as warnings.
 * Logging an error while running tests causes some  unit testing frameworks
 * to report the test as failing.  Tests that wish to assert that polymer-resin
 * is denying a value can instead check for the innocuous value.
 * <p>
 * Exceptions thrown by a report handler will propagate out of polymer-resin
 * so a test suite may install a report handler that throws if unsafe
 * value assignment should correspond to test failure.
 *
 * @type {!security.polymer_resin.ReportHandler}
 * @const
 */
export function CONSOLE_LOGGING_REPORT_HANDLER(
    isViolation: boolean, formatString: string, ...consoleArgs: Array<any>) {
  if (isViolation) {
    console.warn.apply(console, [formatString, ...consoleArgs]);
  } else {
    console.log.apply(console, [formatString, ...consoleArgs]);
  }
}

/**
 * @type {!security.polymer_resin.SafeTypesBridge}
 * @private
 * @const
 */
export function DEFAULT_SAFE_TYPES_BRIDGE_(_value: any, _type: SafeTypeT, fallback: any) {
  return fallback;
}

/**
 * Creates a sanitizer function with the given configuration.
 *
 * @param {!Configuration} config
 * @return {function(!Node, string, string, *): *} A function that filters
 *   and unwraps new property values in preparation for them
 *   being attached to custom elements.
 */
export function makeSanitizer(config: Configuration): Sanitizer {
  /**
   * Undefined means never set (see default behavior under docs for
   * setter above), null means disabled.
   *
   * @type {!security.polymer_resin.ReportHandler|null|undefined}
   */
  let reportHandler = config['reportHandler'] || undefined;

  /**
   * A callback used to check whether a value is a priori safe
   * in a particular context or to coerce to one that is.
   *
   * @type {!security.polymer_resin.SafeTypesBridge}
   */
  const safeTypesBridge = config['safeTypesBridge'] ||
      DEFAULT_SAFE_TYPES_BRIDGE_;

  /**
   * When passed `true`, disallowed values will not be replaced and so may
   * reach unsafe browser sinks resulting in a security violation.
   *
   * This mode is provided only to allow testing of an application to find and
   * compile the kinds of false positives triggered by an application that is
   * being migrated to use polymer resin.
   *
   * This MUST NOT be used in production with end users and MUST NOT be set
   * based on any attacker-controllable state like URL parameters.
   *
   * If you never use this option, you are safer.
   *
   * When not in goog.DEBUG mode, this is a no-op.
   *
   * @type {boolean|undefined}
   */
  const configUnsafePassThruDisallowedValues =
      config['UNSAFE_passThruDisallowedValues'];

  /**
   * @type {boolean}
   */
  let allowUnsafeValues = false;
  if (configUnsafePassThruDisallowedValues != null) {
    if (goog.DEBUG) {
      allowUnsafeValues = configUnsafePassThruDisallowedValues === true;
    }
  }

  /**
   * @type {!RegExp}
   */
  let allowedIdentifierPattern_ = /^$/;
  // This allows the empty identifier by default, which is redundant with
  // the falsey value check in sanitize below, so effectively grants no
  // authority.

  // This is the only part of the configuration that's still global.
  const configAllowedIdentifierPrefixes = config['allowedIdentifierPrefixes'];
  if (configAllowedIdentifierPrefixes) {
    for (let i = 0, n = configAllowedIdentifierPrefixes.length; i < n; ++i) {
      allowedIdentifierPattern_ = new RegExp(
          allowedIdentifierPattern_.source + '|^' +
          goog_string.regExpEscape(configAllowedIdentifierPrefixes[i]));
    }
  }

  if (goog.DEBUG && reportHandler === undefined &&
      typeof console !== 'undefined') {
    reportHandler =
        CONSOLE_LOGGING_REPORT_HANDLER;
  }

  // TODO: check not in IE quirks mode.
  if (reportHandler) {
    // Emitting this allows an integrator to tell where resin is
    // installing relative to other code that is running in the app.
    reportHandler(false, 'initResin');
  }


  /**
   * @type {!Array.<!security.polymer_resin.ValueHandler>}
   * @const
   */
  const valueHandlers: Array<ValueHandler> = [];
  valueHandlers[security_html_contracts.AttrType.NONE] = {
    filter: function(_e: string, _a: string, v: string): string {
      return v;
    },
    // A safe value that indicates a problem likely occurred
    // so an event is worth logging.
    safeReplacement: null,
    // A safe types interop identifier.
    safeType: null
  };
  valueHandlers[security_html_contracts.AttrType.SAFE_HTML] = {
    filter: null,
    safeReplacement: null,
    safeType: SafeType.HTML
  };
  valueHandlers[security_html_contracts.AttrType.SAFE_URL] = {
    filter: null,
    safeReplacement: INNOCUOUS_URL_,
    safeType: SafeType.URL
  };
  valueHandlers[security_html_contracts.AttrType.TRUSTED_RESOURCE_URL] = {
    filter: null,
    safeReplacement: INNOCUOUS_URL_,
    safeType: SafeType.RESOURCE_URL
  };
  valueHandlers[security_html_contracts.AttrType.SAFE_STYLE] = {
    filter: null,
    safeReplacement: INNOCUOUS_STRING,
    safeType: SafeType.STYLE
  };
  valueHandlers[security_html_contracts.AttrType.SAFE_SCRIPT] = {
    filter: null,
    safeReplacement: INNOCUOUS_SCRIPT_,
    safeType: SafeType.JAVASCRIPT
  };
  valueHandlers[security_html_contracts.AttrType.ENUM] = {
    filter: (
        /**
         * Checks that the input is allowed for the given attribute on the
         * given element.
         * @param {string} e element name
         * @param {string} a attribute name
         * @param {string} v attribute value
         * @return {string} v lowercased if allowed, or the safe replacement
         *   otherwise.
         */
        function(e: string, a: string, v: string): string {
          const lv = String(v).toLowerCase();
          return security_html_contracts.isEnumValueAllowed(e, a, lv) ?
              lv :
              INNOCUOUS_STRING;
        }),
    safeReplacement: INNOCUOUS_STRING,
    safeType: null
  };
  valueHandlers[security_html_contracts.AttrType.COMPILE_TIME_CONSTANT] = {
    filter: null,
    safeReplacement: INNOCUOUS_STRING,
    safeType: SafeType.CONSTANT
  };
  valueHandlers[security_html_contracts.AttrType.IDENTIFIER] = {
    filter: (
        /**
         * @param {string} _e element name
         * @param {string} _a attribute name
         * @param {string} v attribute value
         * @return {string}
         */
        function allowIdentifier(_e: string, _a: string, v: string): string {
          return allowedIdentifierPattern_.test(v) ?
              v :
              INNOCUOUS_STRING;
        }),
    safeReplacement: INNOCUOUS_STRING,
    safeType: SafeType.CONSTANT
  };

  /**
   * @param {string} name
   * @this {!Element}
   * @return {*} null indicates unknown.
   */
  function getAttributeValue(this: Element, name: string): any {
    const value = this.getAttribute(name);
    if (!value || /[\[\{]/.test(name)) {
      // If a value contains '[' or '{',
      // assume that it is a bound attribute for which
      // we have not yet computed a value.
      // The consumer of this function cares only about
      // keyword values, so this loses us nothing.
      return null;
    }
    return value;
  }

  /**
   * Uncustomized versions of custom-builtin objects.
   * {@type Object.<string, !Element>}
   */
  const uncustomizedProxies: { [key: string]: Element } = {};

  /**
   * An element that only has global attribute aliases.
   * @type {!Element}
   */
  const VANILLA_HTML_ELEMENT = document.createElement('polyresinuncustomized');

  /**
   * An opaque token used to indicate that unwrapping a safe value failed.
   * @const
   */
  const DID_NOT_UNWRAP = {};

  /**
   * @param {!Element} element
   * @return {!Element}
   */
  function getUncustomizedProxy(element: Element): Element {
    const elementName = element.localName;
    const customBuiltinElementName = element.getAttribute('is');

    if (!customBuiltinElementName) {
      // TODO: Test what happens when a Polymer element defines property
      // constructor.
      // Possible workaround:
      // 1. assert element instanceof element.constructor or
      // 2. use Object.getPrototypeOf(element).constructor.
      /** @type {!CustomElementClassification} */
      const classification = classifyElement(
          elementName, /** @type{!Function} */ (element.constructor));
      if (classification ===
          CustomElementClassification.CUSTOM) {
        // Custom elements have a layer between them and their prototype, so
        // we should not treat own properties assigned in the custom element's
        // constructor as builtin attribute aliases.
        return VANILLA_HTML_ELEMENT;
      }
    }

    // For normal custom elements, the builtin property setters are defined
    // on a prototype, so we can check hasOwnProperty.
    // For custom builtin properties we can't do that since the object is
    // a builtin object that then has custom stuff mixed in.
    // We use a non-customized version of the builtin and check that.
    let uncustomizedProxy = uncustomizedProxies[elementName];
    if (!uncustomizedProxy) {
      uncustomizedProxy = uncustomizedProxies[elementName] =
          document.createElement(elementName);
    }
    return uncustomizedProxy;
  }

  /**
   * Filters and unwraps new property values in preparation for them
   * being attached to custom elements.
   *
   * @param {!Node} node a custom element, builtin element, or text node.
   * @param {string} name the name of the property
   * @param {string} type whether name is a 'property' or 'attribute' name.
   * @param {*} value a value that may have originated outside this document's
   *    origin.
   * @return {*} a value that is safe to embed in this document's origin.
   */
  function sanitize(node: Node, name: string, type: string, value: any): any {
    if (!value && value !== document['all']) {
      // We allow clearing properties and initial values.
      // This does mean that the following strings could be introduced into
      // safe string contexts:
      //     "", "null", "undefined", "0", "NaN", "false"
      // I consider these values innocuous.
      //
      // Note the explicit check for document.all, which is spec'd to be a
      // falsy object! More info:
      // https://developer.mozilla.org/en-US/docs/Glossary/Falsy#Examples
      return value;
    }

    const nodeType = node.nodeType;
    if (nodeType !== Node.ELEMENT_NODE) {
      // TODO: does polymer use CDATA sections?
      if (nodeType === Node.TEXT_NODE) {
        // Whitelist and handle text node interpolation by checking
        // the content type of the parent node.
        const parentElement = node.parentElement;
        let allowText = !parentElement;
        if (parentElement && parentElement.nodeType === Node.ELEMENT_NODE) {
          const parentElementName = parentElement.localName;
          const parentClassification = classifyElement(
              parentElementName,
              /** @type{!Function} */ (parentElement.constructor));
          switch (parentClassification) {
            case CustomElementClassification.BUILTIN:
            case CustomElementClassification.LEGACY:
              const contentType = security_html_contracts.contentTypeForElement(
                  parentElementName);
              // TODO(samueltan): treat STRING_RCDATA differently from SAFE_HTML
              // (b/62487356).
              allowText = contentType ===
                      security_html_contracts.ElementContentType.SAFE_HTML ||
                  contentType ===
                      security_html_contracts.ElementContentType.STRING_RCDATA;
              break;
            case CustomElementClassification
                .CUSTOMIZABLE:
            case CustomElementClassification.CUSTOM:
              // Allow text in custom elements.
              allowText = true;
              break;
          }
        }
        if (allowText) {
          return '' + safeTypesBridge(value, SafeType.STRING, value);
        }
      }

      if (reportHandler) {
        reportHandler(
            true, 'Failed to sanitize %s %s%s node to value %O',
            node.parentElement && node.parentElement.nodeName, '#text', '',
            value);
      }

      return INNOCUOUS_STRING;
    }

    const element: Element = (<Element>node);
    const elementName = element.localName;

    // Check whether an uncustomized version has an own property.
    const elementProxy = getUncustomizedProxy(element);

    switch (type) {
      case 'attribute':
        // TODO: figure out why attr-property-aliasing test doesn't seem to be
        // reaching this branch but running under Polymer 1.7 inside
        // polygerrit does.
        const propName = security_html_namealiases.attrToProperty(name);
        if (propName in elementProxy) {
          break;
        }
        return value;
      case 'property':
        if (name in elementProxy) {
          break;
        }
        const worstCase =
            security_html_namealiases.specialPropertyNameWorstCase(name);
        if (worstCase && worstCase in elementProxy) {
          break;
        }
        return value;
      default:
        throw new Error(type + ': ' + typeof type);
    }

    /**
     * The HTML attribute name.
     * @type {string}
     */
    const attrName =
        // Closed set tested in switch above
        // toLowerCase is Turkish-I safe because
        // www.ecma-international.org/ecma-262/6.0/#sec-string.prototype.tolowercase
        // says
        // """
        // 5. For each code point c in cpList, if the Unicode
        // Character Database provides a LANGUAGE INSENSITIVE
        // lower case equivalent of c then replace c in cpList
        // with that equivalent code point(s).
        // ""
        // modulo bugs in old versions of Rhino.
        (type === 'attribute') ? name.toLowerCase() :
                                 security_html_namealiases.propertyToAttr(name);

    /** @type {?security_html_contracts.AttrType} */
    const attrType = security_html_contracts.typeOfAttribute(
        elementName, attrName, getAttributeValue.bind(element));
    let safeValue = DID_NOT_UNWRAP;
    let safeReplacement = null;
    if (attrType != null) {
      /** @type {!security.polymer_resin.ValueHandler} */
      const valueHandler = valueHandlers[attrType];
      const safeType : SafeTypeT|null = valueHandler.safeType;
      safeReplacement = valueHandler.safeReplacement;

      if (safeType) {
        safeValue = safeTypesBridge(value, (<SafeTypeT>safeType), DID_NOT_UNWRAP);
      }
      if (safeValue === DID_NOT_UNWRAP && valueHandler.filter) {
        // Treat as a special case.
        const stringValue =
            '' +
            safeTypesBridge(  // Unwrap as a string.
                value, SafeType.STRING, value);
        safeValue = valueHandler.filter(elementName, attrName, stringValue);
      }
    }
    if (safeValue === DID_NOT_UNWRAP) {
      safeValue =
          safeReplacement || INNOCUOUS_STRING;
      if (reportHandler) {
        reportHandler(
            true, 'Failed to sanitize attribute of <%s>: <%s %s="%O">',
            elementName, elementName, attrName, value);
      }
    }
    return safeValue;
  }
  if (allowUnsafeValues) {
    /**
     * A wrapper around sanitize() that does not use the sanitized result.
     *
     * @param {!Node} node a custom element, builtin element, or text node.
     * @param {string} name the name of the property
     * @param {string} type whether name is a 'property' or 'attribute' name.
     * @param {*} value a value that may have originated outside this document's
     *    origin.
     * @return {*} the original value, whether safe or not.
     */
    const reportingOnlySanitize = function(node: Node, name: string, type: string, value: any) {
      // Run the sanitizer on the value so it can report on issues.
      sanitize(node, name, type, value);
      // But return the original value.
      return value;
    };
    return reportingOnlySanitize;
  }
  return sanitize;
}

type SanitizeFn = (value: any, name: string, type: string, node: (Node|undefined)) => any;
type Sanitizer = (node: Node, name: string, type: string, value: any) => any;

/**
 * Creates a sanitizer function with the given configuration.
 *
 * @param {!Configuration} config
 * @param {undefined|null|function(*, string, string, ?Node): *}
 *     existingSanitizeDomFunction
 * @return {function(*, string, string, ?Node): *} A function that filters
 *   and unwraps new property values in preparation for them
 *   being attached to custom elements. Matches the API of Polymer's
 *   setSanitizeDOMValue.
 */
export function makeSanitizeDomFunction(
    config: Configuration, existingSanitizeDomFunction: undefined|null|SanitizeFn): SanitizeFn {
  const sanitize = makeSanitizer(config);

  /**
   * @param {*} value
   * @param {string} name
   * @param {string} type
   * @param {?Node} node
   * @return {*}
   */
  function sanitizeDOMValue(value: any, name: string, type: string, node: (Node|undefined)): any {
    const origSanitizedValue = existingSanitizeDomFunction ?
        existingSanitizeDomFunction(value, name, type, node) :
        value;
    const safeValue = node ? sanitize(node, name, type, origSanitizedValue) :
                             INNOCUOUS_STRING;
    return safeValue;
  }

  return sanitizeDOMValue;
}

/**
 * Analogous to goog.html.SafeUrl.INNOCUOUS_STRING but
 * used for const strings and safe html types that
 * do not have their own defined.
 * @const
 * @public
 */
export const INNOCUOUS_STRING = 'zClosurez';

/**
 * @const
 * @private
 */
export const INNOCUOUS_SCRIPT_ = ' /*zClosurez*/ ';

/**
 * @see goog.html.SafeUrl.INNOCUOUS_STRING
 * @const
 * @private
 */
export const INNOCUOUS_URL_ = 'about:invalid#zClosurez';
