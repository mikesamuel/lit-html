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

import * as safeDom from 'goog:goog.dom.safe';
import SafeHtml from 'goog:goog.html.SafeHtml';

import {directive, NodePart, Part} from '../lit-html.js';

const previousValues = new WeakMap<NodePart, SafeHtml>();

/**
 * Renders the value as HTML, rather than text.
 *
 * Note, this must be called with an instance of goog.dom.SafeHtml, otherwise it
 * will not work (i.e. it will fail safe, but it won't display the content that
 * you were hoping for).
 *
 * See `goog.html.sanitizer.HtmlSanitizer.prototype.sanitize` for a
 * straightforward way to get a SafeHtml instance.
 */
export const safeHTML = directive((value: SafeHtml) => (part: Part): void => {
  if (!(part instanceof NodePart)) {
    throw new Error('unsafeHTML can only be used in text bindings');
  }
  const previousValue = previousValues.get(part);
  // We can treat SafeHtml values as primitives for dirty checking purposes
  // because they are immutable, so if the previous value is the current
  // value, then we don't have to do anything.
  if (previousValue === value) {
    return;
  }

  // Use a <template> to parse HTML into Nodes
  const tmp = document.createElement('template');
  safeDom.setInnerHtml(tmp, value);
  part.setValue(document.importNode(tmp.content, true));
  previousValues.set(part, value);
});
