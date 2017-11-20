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

if (!('inert' in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, 'inert', {
    enumerable: true,

    /**
     * @return {boolean}
     * @this {Element}
     */
    get: function() { return this.hasAttribute('inert'); },

    /**
     * @param {boolean} inert
     * @this {Element}
     */
    set: function(inert) {
      if (inert) {
        this.setAttribute('inert', '');
      } else {
        this.removeAttribute('inert');
      }
    }
  });

  window.addEventListener('load', function() {
    function applyStyle(css) {
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      document.body.appendChild(style);
    }
    var css = "/*[inert]*/*[inert]{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;pointer-events:none}";
    applyStyle(css);

    /**
     * Sends a fake tab event. This is only supported by some browsers.
     *
     * @param {boolean=} opt_shiftKey whether to send this tab with shiftKey
     */
    function dispatchTabEvent(opt_shiftKey) {
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
     * Determines whether the specified element is inert, and returns the element
     * which caused this state. This is limited to, but may include, the body
     * element.
     *
     * @param {Element} e to check
     * @return {Element} element is made inert by, if any
     */
    function madeInertBy(e) {
      while (e && e !== document.documentElement) {
        if (e.hasAttribute('inert')) {
          return e;
        }
        e = e.parentElement;
      }
      return null;
    }

    /**
     * Finds the nearest shadow root from an element that's within said shadow root.
     *
     * TODO(samthor): We probably want to find the highest shadow root.
     *
     * @param {Element} e to check
     * @return {Node} shadow root, if any
     */
    var findShadowRoot = function(e) { return null; };
    if (window.ShadowRoot) {
      findShadowRoot = function(e) {
        while (e && e !== document.documentElement) {
          if (e instanceof window.ShadowRoot) { return e; }
          e = e.parentNode;
        }
        return null;
      }
    }

    /**
     * Returns the target of the passed event. If there's a path (shadow DOM only), then prefer it.
     *
     * @param {!Event} event
     * @return {Element} target of event
     */
    function targetForEvent(event) {
      var p = event.path;
      return  /** @type {Element} */ (p && p[0] || event.target);
    }

    // Hold onto the last tab direction: next (tab) or previous (shift-tab). This
    // can be used to step over inert elements in the correct direction. Mouse
    // or non-tab events should reset this and inert events should focus nothing.
    var lastTabDirection = 0;
    document.addEventListener('keydown', function(ev) {
      if (ev.keyCode === 9) {
        lastTabDirection = ev.shiftKey ? -1 : +1;
      } else {
        lastTabDirection = 0;
      }
    });
    document.addEventListener('mousedown', function(ev) {
      lastTabDirection = 0;
    });

    // Retain the currently focused shadowRoot.
    var focusedShadowRoot = null;
    function updateFocusedShadowRoot(root) {
      if (root == focusedShadowRoot) { return; }
      if (focusedShadowRoot) {
        if (!(focusedShadowRoot instanceof window.ShadowRoot)) {
          throw new Error('not shadow root: ' + focusedShadowRoot);
        }
        focusedShadowRoot.removeEventListener('focusin', shadowFocusHandler, true);  // remove
      }
      if (root) {
        root.addEventListener('focusin', shadowFocusHandler, true);  // add
      }
      focusedShadowRoot = root;
    }

    /**
     * Focus handler on a Shadow DOM host. This traps focus events within that root.
     *
     * @param {!Event} ev
     */
    function shadowFocusHandler(ev) {
      // ignore "direct" focus, we only want shadow root focus
      var last = ev.path[ev.path.length - 1];
      if (last === /** @type {*} */ (window)) { return; }
      sharedFocusHandler(targetForEvent(ev));
      ev.preventDefault();
      ev.stopPropagation();
    }

    /**
     * Called indirectly by both the regular focus handler and Shadow DOM host focus handler. This
     * is the bulk of the polyfill which prevents focus.
     *
     * @param {Element} target focused on
     */
    function sharedFocusHandler(target) {
      var inertElement = madeInertBy(target);
      if (!inertElement) { return; }

      // If the page has been tabbed recently, then focus the next element
      // in the known direction (if available).
      if (document.hasFocus() && lastTabDirection !== 0) {
        function getFocused() {
          return (focusedShadowRoot || document).activeElement;
        }

        // Send a fake tab event to enumerate through the browser's view of
        // focusable elements. This is supported in some browsers (not Firefox).
        var previous = getFocused();
        dispatchTabEvent(lastTabDirection < 0 ? true : false);
        if (previous != getFocused()) { return; }

        // Otherwise, enumerate through adjacent elements to find the next
        // focusable element. This won't respect any custom tabIndex.
        var filter = /** @type {NodeFilter} */ ({
          /**
           * @param {Node} node
           * @return {number}
           */
          acceptNode: function(node) {
            if (!node || !node.focus || node.tabIndex < 0) {
              return NodeFilter.FILTER_SKIP;  // look at descendants
            }
            var contained = inertElement.contains(node);
            return contained ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
          },
        });
        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, filter);
        walker.currentNode = inertElement;

        var nextFunc = Math.sign(lastTabDirection) === -1 ? walker.previousNode : walker.nextNode
        var next = nextFunc.bind(walker);
        for (var candidate; candidate = next(); ) {
          candidate.focus();
          if (getFocused() !== previous) { return; }
        }

        // FIXME: If a focusable element can't be found here, it's likely to mean
        // that this is the start or end of the page. Blurring is then not quite
        // right, as it prevents access to the browser chrome.
      }

      // Otherwise, immediately blur the targeted element. Technically, this
      // still generates focus and blur events on the element. This is (probably)
      // the price to pay for this polyfill.
      target.blur();
    }

    // The 'focusin' event bubbles, but instead, use 'focus' with useCapture set
    // to true as this is supported in Firefox. Additionally, target the body so
    // this doesn't generate superfluous events on document itself.
    document.body.addEventListener('focus', function(ev) {
      var target = targetForEvent(ev);
      updateFocusedShadowRoot((target == ev.target ? null : findShadowRoot(target)));
      sharedFocusHandler(target);  // either real DOM node or shadow node
    }, true);

    // Use a capturing click listener as both a safety fallback where pointer-events is not
    // available (IE10 and below), and to prevent accessKey access to inert elements.
    // TODO(samthor): Note that pointer-events polyfills trap more mouse events, e.g.-
    //   https://github.com/kmewhort/pointer_events_polyfill
    document.addEventListener('click', function(ev) {
      var target = targetForEvent(ev);
      if (madeInertBy(target)) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }, true);
  });
}