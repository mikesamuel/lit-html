/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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

import {html, render} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';
import {newSafeHtmlForTest, newSafeUrlForTest} from '../../lib/goog/html/testing';

const assert = chai.assert;

suite('appsec_test.ts', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  suite('links', () => {
    function linkTo(url: any, linkText: any) {
      render(html`<a href="${ url }">${ linkText }</a>`, container);
    }

    test('link to http string', () => {
      linkTo('http://example.com', 'Hi');
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<a href="http://example.com">Hi</a>');
    });
    test('link to javascript string', () => {
      linkTo('javascript:alert(document.domain)', 'Hi');
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<a href="about:invalid#zClosurez">Hi</a>');
    });
    test('link to javascript safeurl', () => {
      linkTo(newSafeUrlForTest('javascript:alert(document.domain)'), 'Hi');
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<a href="javascript:alert(document.domain)">Hi</a>');
    });
    test('text escaped', () => {
      linkTo('/foo', '<script>alert(document.domain)</script>');
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<a href="/foo">&lt;script&gt;alert(document.domain)&lt;/script&gt;</a>');
    });
    test('safehtml link text', function () {
      this.skip();  // TODO: Fix the Part implementation to make this work.
      linkTo('/foo', newSafeHtmlForTest('<script>alert(document.domain)</script>'));
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<a href="/foo"><script>alert(document.domain)</script></a>');
    });
  });
/*
  suite('text in scripts', () => {
    test('renders plain text expression', () => {
      render(html`test`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'test');
    });
  });

  suite('CSS phones home', () => {
    test('renders plain text expression', () => {
      render(html`test`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'test');
    });
  });

  suite('src attribute is tricky', () => {
    test('renders plain text expression', () => {
      render(html`test`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'test');
    });
  });

  suite('dynamic element names', () => {
    test('renders plain text expression', () => {
      render(html`test`, container);
      assert.equal(stripExpressionMarkers(container.innerHTML), 'test');
    });
  });
*/
});
