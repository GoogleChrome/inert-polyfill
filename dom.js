
import * as shim from './dom-shim.js';


const dummyNode = document.createElement('div');


/**
 * What element makes the target node inert, if any.
 *
 * @param {!Node} target
 * @return {?Element}
 */
export function madeInertBy(target) {
  while (target) {
    const cand = target.closest('[inert]');
    if (cand) {
      return cand;
    }

    const root = target.getRootNode();
    if (root === document) {
      break;
    }
    target = root.host;
  }

  return null;
}


/**
 * Is the passed node inert?
 *
 * @param {!Node} target
 * @return {boolean}
 */
export function isInert(target) {
  return madeInertBy(target) !== null;
}


function indexIn(nodeList, target) {
  // TODO: should bisect?
  for (let i = 0; i < nodeList.length; ++i) {
    if (nodeList[i] === target) {
      return i;
    }
  }
  return -1;
}


/**
 * Move forward or backwards from the specified target node, finding the next tabbable node.
 *
 * This doesn't know anything about, e.g., skipping `<button>` by default on Safari, or optionally
 * skipping `<a href>` in Chrome.
 *
 * @param {!Element} target
 * @param {number} dir +ve/-ve
 * @return {?Element}
 */
export function traverse(target, dir) {
  if (!dir) {
    return null;  // no direction, no future node is valid
  }
  const forward = (dir > 0);
  dir = forward ? +1 : -1;

outer:
  while (target) {
    const root = shim.getRootNode(target);

    const tabIndex = target.tabIndex || 0;
    if (tabIndex > 0) {
      // we're in the middle of +ve tabindex-land, so iterate to find relative element

      const all = root.querySelectorAll('[tabindex]');
      const index = indexIn(all);
      if (index === -1) {
        throw new TypeError(`can't find self with tabIndex=${target.getAttribute('tabindex')}`);
      }

      let previousInert = dummyNode;

      for (let i = index; all[i]; i += dir) {
        const cand = all[i];
        if (cand.tabIndex <= 0) {
          continue;
        }

        // Some previous candidate node was made inert by something. Maybe we are too?
        if (previousInert.contains(cand)) {
          continue;
        }

        // If not, traverse the DOM to find something that makes us inert.
        const inertParent = madeInertBy(cand);
        if (!inertParent) {
          return cand;
        }
        previousInert = inertParent;

        // Is this entire root made inert? If so, just bail out completely. (How did we get here?)
        if (getRootNode(inertParent) !== root) {
          break;
        }
      }

      if (dir < 0) {
        if (root === document) {
          return null;  // done, top of document
        }
        // start again at outer root
        target = root.host;
        continue outer;
      }

      // We've exhausted elements with a +ve tabindex (which in reality is probably very common).
      // Fall-through to the regular case.
    }

    // Either: move forward to the next focusable, or back to the next focusable (including the "highest" tabindex).

    // We're at a target with a zero tabindex and want to move +/-, or with a +ve tabindex and want to move forward.
  }
}