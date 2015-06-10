Polyfill for the `inert` HTML attribute.

The `inert` attribute is an [upcoming feature](https://html.spec.whatwg.org/multipage/interaction.html#inert-subtrees) [of HTML](http://drafts.htmlwg.org/html/master/editing.html#inert-subtrees).
Its implementation is being tracked by some major browser vendors.

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

You may optionally install via Bower-

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

