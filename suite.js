/*
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */


void function() {

  /**
   * Sends a tab event on this document. Note that this is a copy of
   * dispatchTabEvent from the polyfill source.
   *
   * @param {boolean=} opt_shiftKey whether to send this tab with shiftKey
   */
  function sendTab(opt_shiftKey) {
    var ev = null;
    try {
      ev = new KeyboardEvent('keydown', {
        keyCode: 9,
        which: 9,
        key: 'Tab',
        code: 'Tab',
        keyIdentifier: 'U+0009',
        shiftKey: !!opt_shiftKey,
        bubbles: true
      });
    } catch (e) {
      try {
        // Internet Explorer
        ev = document.createEvent('KeyboardEvent');
        ev.initKeyboardEvent(
          'keydown',
          true,
          true,
          window,
          'Tab',
          0,
          opt_shiftKey ? 'Shift' : '',
          false,
          'en'
        )
      } catch (e) {}
    }
    if (ev) {
      try {
        Object.defineProperty(ev, 'keyCode', { value: 9 });
      } catch (e) {}
      document.dispatchEvent(ev);
    }
  }

  /**
   * Creates a text input element and adds it to <body>.
   *
   * @param {string=} opt_text to use as placeholder
   * @return {!HTMLInputElement} added to page
   */
  function createInput(opt_text) {
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = opt_text || '';
    holder.appendChild(input);
    return input;
  }

  var holder;  // global holder for all tests
  setup(function() {
    holder = document.createElement('div');
    document.body.appendChild(holder);
  });
  teardown(function() {
    holder.parentNode && holder.parentNode.removeChild(holder);
  });

  test('default css applied', function() {
    var div = document.createElement('div');
    div.setAttribute('inert', '');
    holder.appendChild(div);

    var s = window.getComputedStyle(div);
    assert.equal(s.webkitUserSelect || s.MozUserSelect || s.msUserSelect || s.userSelect, 'none');

    var bs = window.getComputedStyle(div, ':before');
    assert.equal(bs.position, 'absolute');
  });
  test('no programatic focus', function() {
    var div = document.createElement('div');
    div.setAttribute('inert', '');
    holder.appendChild(div);

    var input = createInput('test inert');
    div.appendChild(input);

    // TODO: fails when developer console is open, even though focus doesn't go
    // anywhere
    input.focus();
    assert.notEqual(document.activeElement, input, 'element should not be focusable');

    div.tabIndex = 1;
    div.focus();
    assert.notEqual(document.activeElement, div, 'inert element itself unavailable');
  });
  test('click prevented', function() {
    var clickCount = 0;
    var div = document.createElement('div');
    holder.appendChild(div);

    var button = document.createElement('button');
    button.addEventListener('click', function() {
      ++clickCount;
    });
    div.appendChild(button);
    button.click();
    assert.equal(clickCount, 1, 'programatic click once');

    div.setAttribute('inert', '');
    button.click();
    assert.equal(clickCount, 1, 'programatic click disabled via inert');
  });
  test('focused click prevented', function() {
    var clickCount = 0;
    var div = document.createElement('div');
    holder.appendChild(div);

    var input = document.createElement('input');
    input.type = 'text';
    input.addEventListener('click', function() {
      ++clickCount;
    });
    div.appendChild(input);
    input.focus();
    assert.equal(document.activeElement, input);
    input.click();
    assert.equal(clickCount, 1, 'programatic click once');

    div.setAttribute('inert', '');
    input.click();
    assert.equal(clickCount, 1, 'programatic click, even while ? focused, disabled via inert');
  });
  test('tab-over works', function() {
    var beforeInput = createInput('before');
    var duringInputInert = createInput('during');
    var afterInput = createInput('after');

    duringInputInert.setAttribute('inert', '');

    beforeInput.focus();
    assert.equal(document.activeElement, beforeInput, 'sanity check before input focused');

    sendTab();
    if (document.activeElement == beforeInput) {
      // TODO: work around Firefox not actually acting on tab
      console.warn('manual focus after tab');
      duringInputInert.focus();
    }
    assert.equal(document.activeElement, afterInput, 'tab-over inert works');

    sendTab(true);
    if (document.activeElement == afterInput) {
      // TODO: work around Firefox not actually acting on tab
      console.warn('manual focus after shift-tab');
      duringInputInert.focus();
    }
    assert.equal(document.activeElement, beforeInput, 'tab-over (reverse) inert works');
  });

}();
