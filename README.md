Polyfill for the `inert` HTML attribute. [Check out a small demo](https://rawgit.com/GoogleChrome/inert-polyfill/master/demo.html).

The `inert` attribute is a [draft feature](https://html.spec.whatwg.org/multipage/interaction.html#inert-subtrees) [of HTML](http://drafts.htmlwg.org/html/master/editing.html#inert-subtrees).
In 2015, some [browser](https://bugzilla.mozilla.org/show_bug.cgi?id=921504) [vendors](https://code.google.com/p/chromium/issues/detail?id=269846) decided not to implement this feature; but as of 2016, there has been some renewed interest.

From the HTML spec-

> A node (in particular elements and text nodes) can be marked as inert.
> When a node is inert, then the user agent must act as if the node was absent for the purposes of targeting user interaction events, may ignore the node for the purposes of text search user interfaces (commonly known as "find in page"), and may prevent the user from selecting text in that node.

While not a replacement for proper state management, web developers can use the `inert` attribute to prevent access to subtrees.
This could be useful to prevent access to active HTML forms, to enable modal-like popovers, or to block user interaction while awaiting the result of an asynchronous operation.

## Example

```html
<div inert>
  <button>I'm unclickable!</button>
  <input type="text" placeholder="I'm unfocusable!" />
</div>
```

## Usage

Include the [inert-polyfill script](https://cdn.rawgit.com/GoogleChrome/inert-polyfill/v0.1.0/inert-polyfill.min.js) at the end of your page.
There are no other initialization steps.

The polyfill prevents tab-focusing, using the `accessKey` to access an element, the `click` event (mostly for sanity, as elements should be unfocusable), and any other approach to focus.

### Installation

You may optionally install via NPM or Bower-

    $ npm install inert-polyfill
    $ bower install inert-polyfill

### Supports

This polyfill works on modern versions of all major browsers. It also supports IE9 and above.

## Limitations

Most limitations revolve around keyboard access and the tab key-

- Some browsers (Firefox) don't support emulating tab events, so positive values of `tabIndex` may be ignored
  - Avoid relying on a specific tab order
- Inert elements at the very start or end of a page may prevent tab access to the browser's chrome
- While tabbing over inert elements, inner elements may still receive intermediate `focus` and `blur` events

Other limitations include-

- Content within an inert element may still be searched for (using the browser's Find box) or selected
- Focused elements that become inert due to surrounding HTML changes will remain focused

If these limitations do not work for your project, there is also a [WICG polyfill](https://github.com/WICG/inert), which uses `MutationObserver` to recursively walk HTML trees to clear `tabIndex` (clearing or setting to -1).
The `GoogleChrome` hosted polyfill simply overloads `focus` and related events to prevent focus, which has less setup cost.

# Release

Compile code with [Closure Compiler](https://closure-compiler.appspot.com/home).

```
// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name inert-polyfill.min.js
// ==/ClosureCompiler==

// code here
```
