
export const getRootNode = Element.prototype.getRootNode ? (node) => node.getRootNode() : document;
