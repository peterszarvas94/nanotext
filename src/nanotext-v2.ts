// Nanotext v2 - Modern Implementation
// Uses Selection/Range API instead of deprecated execCommand

// =============================================================================
// Types
// =============================================================================

type Action = {
  name: string;
  icon: string;
  title: string;
  result: () => void;
  state?: () => boolean;
};

type Classes = {
  actionbar: string;
  button: string;
  content: string;
  selected: string;
};

type Settings = {
  element?: HTMLElement;
  onChange?: (html: string) => void;
  content?: string;
  actions?: (string | Partial<Action>)[];
  classes?: Partial<Classes>;
  handleImageClick?: () => void;
};

// =============================================================================
// Constants
// =============================================================================

const BLOCK_TAGS = ['P', 'H1', 'H2', 'BLOCKQUOTE', 'PRE', 'LI', 'FIGURE'];
const INLINE_TAGS = ['STRONG', 'EM', 'U', 'S', 'SUB', 'SUP', 'A'];

// =============================================================================
// Editor State
// =============================================================================

let editorContent: HTMLElement | null = null;

function setEditorContent(el: HTMLElement | null): void {
  editorContent = el;
}

function getEditorContent(): HTMLElement | null {
  return editorContent;
}

// =============================================================================
// DOM Helpers
// =============================================================================

/**
 * Walk up the DOM tree from a node, stopping at the editor boundary
 */
function walkUp(node: Node | null, callback: (node: Node) => boolean): boolean {
  let current: Node | null = node;
  while (current && current !== editorContent) {
    if (callback(current)) return true;
    current = current.parentNode;
  }
  return false;
}

/**
 * Check if a node is an element with the given tag name
 */
function isElementWithTag(node: Node, tagName: string): boolean {
  return node.nodeType === Node.ELEMENT_NODE && 
         (node as HTMLElement).tagName === tagName.toUpperCase();
}

/**
 * Find the nearest ancestor element matching a tag name
 */
function findAncestor(node: Node | null, tagName: string): HTMLElement | null {
  let result: HTMLElement | null = null;
  walkUp(node, (current) => {
    if (isElementWithTag(current, tagName)) {
      result = current as HTMLElement;
      return true;
    }
    return false;
  });
  return result;
}

/**
 * Find the nearest block-level ancestor element
 */
function findParentBlock(node: Node | null): HTMLElement | null {
  let result: HTMLElement | null = null;
  walkUp(node, (current) => {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement;
      if (BLOCK_TAGS.includes(el.tagName)) {
        result = el;
        return true;
      }
    }
    return false;
  });
  return result;
}

// =============================================================================
// Selection Helpers
// =============================================================================

function getSelection(): Selection | null {
  return window.getSelection();
}

function getRange(): Range | null {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0);
}

// Legacy alias for compatibility
function getParentBlock(node: Node | null): HTMLElement | null {
  return findParentBlock(node);
}

// =============================================================================
// State Detection
// =============================================================================

/**
 * Check if the current selection/cursor is inside an element with the given tag
 */
function isInElement(tagName: string): boolean {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  return findAncestor(sel.anchorNode, tagName) !== null;
}

/**
 * Get the block type at the current selection
 */
function getBlockType(): string | null {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  
  const block = findParentBlock(sel.anchorNode);
  return block ? block.tagName.toLowerCase() : null;
}

/**
 * Check if the current selection is inside a list of the given type
 */
function isInListType(listType: 'ul' | 'ol'): boolean {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  return findAncestor(sel.anchorNode, listType) !== null;
}

/**
 * Get the text alignment of the current block
 */
function hasAlignment(): string | null {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  
  const block = findParentBlock(sel.anchorNode);
  if (!block) return null;
  
  return block.style.textAlign || null;
}

// =============================================================================
// Style Manipulation
// =============================================================================

function toggleElement(tagName: string): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  
  const range = sel.getRangeAt(0);
  
  // If collapsed (no selection), toggle based on cursor position
  if (range.collapsed) {
    if (isInElement(tagName)) {
      unwrapSelection(tagName);
    }
    // Can't wrap nothing - need a selection
    return;
  }
  
  // With a selection: check if ENTIRE selection is already wrapped
  // If so, unwrap. Otherwise, wrap (which handles partial overlaps).
  if (isSelectionFullyWrapped(tagName)) {
    unwrapSelection(tagName);
  } else {
    wrapSelectionPerBlock(tagName);
  }
}

function isSelectionFullyWrapped(tagName: string): boolean {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  
  const range = sel.getRangeAt(0);
  const tag = tagName.toUpperCase();
  
  // Find the common ancestor
  let ancestor: Node | null = range.commonAncestorContainer;
  
  // If the common ancestor is a text node, check its parent
  if (ancestor.nodeType === Node.TEXT_NODE) {
    ancestor = ancestor.parentNode;
  }
  
  // Walk up to find if we're completely inside a matching element
  while (ancestor && ancestor !== editorContent) {
    if (ancestor.nodeType === Node.ELEMENT_NODE && (ancestor as HTMLElement).tagName === tag) {
      // Check if the element fully contains the selection
      const elRange = document.createRange();
      elRange.selectNodeContents(ancestor);
      
      // Selection starts at or after element start, and ends at or before element end
      const startsInside = elRange.compareBoundaryPoints(Range.START_TO_START, range) <= 0;
      const endsInside = elRange.compareBoundaryPoints(Range.END_TO_END, range) >= 0;
      
      if (startsInside && endsInside) {
        return true;
      }
    }
    ancestor = ancestor.parentNode;
  }
  
  return false;
}

function wrapSelectionPerBlock(tagName: string, attributes?: Record<string, string>): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  
  // Get all blocks that intersect with selection
  const blocks = getBlocksInSelection(range);
  
  // Track first and last wrapper for restoring selection
  let firstWrapper: HTMLElement | null = null;
  let lastWrapper: HTMLElement | null = null;
  
  if (blocks.length === 0 || blocks.length === 1) {
    // Single block or no blocks - just wrap the selection
    const wrapper = wrapRange(range, tagName, attributes);
    firstWrapper = lastWrapper = wrapper;
  } else {
    // Multiple blocks - wrap each block's portion separately
    // Process in reverse order to preserve range offsets
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];
      const blockRange = document.createRange();
      
      if (i === 0) {
        // First block: from selection start to end of block
        blockRange.setStart(range.startContainer, range.startOffset);
        blockRange.setEnd(block, block.childNodes.length);
      } else if (i === blocks.length - 1) {
        // Last block: from start of block to selection end
        blockRange.setStart(block, 0);
        blockRange.setEnd(range.endContainer, range.endOffset);
      } else {
        // Middle block: entire block contents
        blockRange.selectNodeContents(block);
      }
      
      if (!blockRange.collapsed) {
        const wrapper = wrapRange(blockRange, tagName, attributes);
        if (i === 0) firstWrapper = wrapper;
        if (i === blocks.length - 1) lastWrapper = wrapper;
      }
    }
  }
  
  // Restore selection across all wrapped content
  if (firstWrapper && lastWrapper) {
    const newRange = document.createRange();
    newRange.setStart(firstWrapper, 0);
    newRange.setEnd(lastWrapper, lastWrapper.childNodes.length);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}

function getBlocksInSelection(range: Range): HTMLElement[] {
  const blocks: HTMLElement[] = [];
  const blockTags = ['P', 'H1', 'H2', 'BLOCKQUOTE', 'PRE', 'LI'];
  
  // Walk through the range and collect all block elements
  const walker = document.createTreeWalker(
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE 
      ? range.commonAncestorContainer as HTMLElement
      : range.commonAncestorContainer.parentElement || editorContent!,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const el = node as HTMLElement;
        if (blockTags.includes(el.tagName) && range.intersectsNode(el)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  let node: Node | null;
  while (node = walker.nextNode()) {
    blocks.push(node as HTMLElement);
  }
  
  return blocks;
}

function wrapRange(range: Range, tagName: string, attributes?: Record<string, string>): HTMLElement {
  const wrapper = document.createElement(tagName);
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      wrapper.setAttribute(key, value);
    });
  }
  
  // Extract contents - this handles cross-boundary selections
  const contents = range.extractContents();
  
  // Remove any existing tags of same type from the extracted content
  removeTagsFromFragment(contents, tagName);
  
  wrapper.appendChild(contents);
  range.insertNode(wrapper);
  
  // Clean up any empty elements left behind in the parent
  cleanupEmptyElements(wrapper.parentElement);
  
  return wrapper;
}

function removeTagsFromFragment(fragment: DocumentFragment, tagName: string): void {
  const tag = tagName.toUpperCase();
  const elements = fragment.querySelectorAll(tagName);
  
  // Unwrap each matching element
  elements.forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    }
  });
}

function cleanupEmptyElements(container: HTMLElement | null): void {
  if (!container) return;
  
  const inlineTags = ['STRONG', 'EM', 'U', 'S', 'SUB', 'SUP', 'A'];
  
  inlineTags.forEach(tag => {
    const elements = container.getElementsByTagName(tag);
    // Iterate in reverse to safely remove
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (!el.textContent || el.textContent.length === 0) {
        el.parentNode?.removeChild(el);
      }
    }
  });
}

function wrapSelection(tagName: string, attributes?: Record<string, string>): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;
  
  wrapRange(range, tagName, attributes);
  
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(range.commonAncestorContainer);
  sel.addRange(newRange);
}

function unwrapSelection(tagName: string): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  
  const tag = tagName.toUpperCase();
  let node: Node | null = sel.anchorNode;
  
  // Find the element to unwrap
  while (node && node !== editorContent) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === tag) {
      const el = node as HTMLElement;
      const parent = el.parentNode;
      if (parent) {
        // Move all children out of the element
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
      return;
    }
    node = node.parentNode;
  }
}

function setBlockType(tagName: string): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  
  const block = getParentBlock(sel.anchorNode);
  if (!block || !block.parentNode) return;
  
  // Don't change if already this type (and not in a list)
  if (block.tagName.toLowerCase() === tagName.toLowerCase()) return;
  
  // If we're in a list item, extract it from the list first
  if (block.tagName === 'LI') {
    const listEl = block.parentNode as HTMLElement;
    if (listEl.tagName === 'UL' || listEl.tagName === 'OL') {
      const listParent = listEl.parentNode;
      if (!listParent) return;
      
      // Create new block element with list item content
      const newBlock = document.createElement(tagName);
      newBlock.innerHTML = block.innerHTML;
      
      // Handle list splitting
      const itemIndex = Array.from(listEl.children).indexOf(block);
      const totalItems = listEl.children.length;
      
      if (totalItems === 1) {
        // Only item - replace entire list
        listParent.replaceChild(newBlock, listEl);
      } else if (itemIndex === 0) {
        // First item - insert before list
        listParent.insertBefore(newBlock, listEl);
        block.remove();
      } else if (itemIndex === totalItems - 1) {
        // Last item - insert after list
        listParent.insertBefore(newBlock, listEl.nextSibling);
        block.remove();
      } else {
        // Middle item - split list
        const newList = document.createElement(listEl.tagName);
        // Move items after current to new list
        while (block.nextSibling) {
          newList.appendChild(block.nextSibling);
        }
        // Insert new block and new list after original list
        listParent.insertBefore(newBlock, listEl.nextSibling);
        listParent.insertBefore(newList, newBlock.nextSibling);
        block.remove();
      }
      
      // Restore selection
      const range = document.createRange();
      range.selectNodeContents(newBlock);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
  }
  
  // Standard block type change
  const newBlock = document.createElement(tagName);
  newBlock.innerHTML = block.innerHTML;
  
  // Copy alignment style if present
  if (block.style.textAlign) {
    newBlock.style.textAlign = block.style.textAlign;
  }
  
  // Replace old block with new
  block.parentNode.replaceChild(newBlock, block);
  
  // Restore selection
  const range = document.createRange();
  range.selectNodeContents(newBlock);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

function setAlignment(value: string): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  
  const block = getParentBlock(sel.anchorNode);
  if (!block) return;
  
  block.style.textAlign = value;
}

// =============================================================================
// List Manipulation
// =============================================================================

function toggleList(type: 'ul' | 'ol'): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  
  const block = getParentBlock(sel.anchorNode);
  if (!block || !block.parentNode) return;
  
  // If already in a list
  if (block.tagName === 'LI') {
    const listEl = block.parentNode as HTMLElement;
    const listParent = listEl.parentNode;
    if (!listParent) return;
    
    const currentListType = listEl.tagName.toLowerCase();
    
    // Same list type - remove list (convert to paragraph)
    if (currentListType === type) {
      const p = document.createElement('p');
      p.innerHTML = block.innerHTML;
      
      const itemIndex = Array.from(listEl.children).indexOf(block);
      const totalItems = listEl.children.length;
      
      if (totalItems === 1) {
        // Only item - replace entire list
        listParent.replaceChild(p, listEl);
      } else if (itemIndex === 0) {
        // First item - insert before list
        listParent.insertBefore(p, listEl);
        block.remove();
      } else if (itemIndex === totalItems - 1) {
        // Last item - insert after list
        listParent.insertBefore(p, listEl.nextSibling);
        block.remove();
      } else {
        // Middle item - split list
        const newList = document.createElement(listEl.tagName);
        while (block.nextSibling) {
          newList.appendChild(block.nextSibling);
        }
        listParent.insertBefore(p, listEl.nextSibling);
        listParent.insertBefore(newList, p.nextSibling);
        block.remove();
      }
      
      // Restore selection
      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    
    // Different list type - convert entire list
    const newList = document.createElement(type);
    while (listEl.firstChild) {
      newList.appendChild(listEl.firstChild);
    }
    listParent.replaceChild(newList, listEl);
    
    // Restore selection to same item in new list
    const range = document.createRange();
    const newItem = newList.children[Array.from(listEl.children).indexOf(block)] || newList.lastElementChild;
    if (newItem) {
      range.selectNodeContents(newItem);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return;
  }
  
  // Not in a list - convert block to list
  const list = document.createElement(type);
  const li = document.createElement('li');
  li.innerHTML = block.innerHTML;
  list.appendChild(li);
  
  block.parentNode.replaceChild(list, block);
  
  // Restore selection
  const range = document.createRange();
  range.selectNodeContents(li);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// =============================================================================
// Special Elements
// =============================================================================

function createLink(url: string): void {
  wrapSelection('a', { href: url });
}

function insertFigure(url: string): void {
  const sel = getSelection();
  if (!sel || sel.rangeCount === 0) return;
  
  const range = sel.getRangeAt(0);
  const block = getParentBlock(sel.anchorNode);
  
  // Create figure with image
  const figure = document.createElement('figure');
  const img = document.createElement('img');
  img.src = url;
  figure.appendChild(img);
  
  // Add editable figcaption
  const caption = document.createElement('figcaption');
  caption.textContent = '';
  caption.setAttribute('contenteditable', 'true');
  figure.appendChild(caption);
  
  // Insert after current block or at cursor position
  if (block && block.parentNode) {
    block.parentNode.insertBefore(figure, block.nextSibling);
  } else {
    range.insertNode(figure);
  }
  
  // Focus the caption for editing
  const captionRange = document.createRange();
  captionRange.selectNodeContents(caption);
  captionRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(captionRange);
}

// =============================================================================
// Default Actions
// =============================================================================

const defaultActions: Action[] = [
  {
    name: "bold",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/></svg>',
    title: "Bold",
    state: () => isInElement('strong'),
    result: () => toggleElement('strong'),
  },
  {
    name: "italic",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>',
    title: "Italic",
    state: () => isInElement('em'),
    result: () => toggleElement('em'),
  },
  {
    name: "underline",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/></svg>',
    title: "Underline",
    state: () => isInElement('u'),
    result: () => toggleElement('u'),
  },
  {
    name: "strikethrough",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>',
    title: "Strikethrough",
    state: () => isInElement('s'),
    result: () => toggleElement('s'),
  },
  {
    name: "heading1",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>',
    title: "Heading 1",
    state: () => getBlockType() === 'h1',
    result: () => setBlockType('h1'),
  },
  {
    name: "heading2",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>',
    title: "Heading 2",
    state: () => getBlockType() === 'h2',
    result: () => setBlockType('h2'),
  },
  {
    name: "paragraph",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/></svg>',
    title: "Paragraph",
    state: () => getBlockType() === 'p',
    result: () => setBlockType('p'),
  },
  {
    name: "quote",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/></svg>',
    title: "Quote",
    state: () => getBlockType() === 'blockquote',
    result: () => setBlockType('blockquote'),
  },
  {
    name: "code",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>',
    title: "Code",
    state: () => getBlockType() === 'pre',
    result: () => setBlockType('pre'),
  },
  {
    name: "olist",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5h10"/><path d="M11 12h10"/><path d="M11 19h10"/><path d="M4 4h1v5"/><path d="M4 9h2"/><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"/></svg>',
    title: "Ordered List",
    state: () => isInListType('ol'),
    result: () => toggleList('ol'),
  },
  {
    name: "ulist",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>',
    title: "Unordered List",
    state: () => isInListType('ul'),
    result: () => toggleList('ul'),
  },
  {
    name: "link",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    title: "Link",
    state: () => isInElement('a'),
    result: () => {
      const url = window.prompt("Enter the link URL");
      if (url) createLink(url);
    },
  },
  {
    name: "image",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    title: "Image",
    result: () => {
      const url = window.prompt("Insert image url");
      if (url) insertFigure(url);
    },
  },
  {
    name: "justifyLeft",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H3"/><path d="M15 12H3"/><path d="M17 19H3"/></svg>',
    title: "Align Left",
    state: () => hasAlignment() === 'left',
    result: () => setAlignment('left'),
  },
  {
    name: "justifyCenter",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H3"/><path d="M17 12H7"/><path d="M19 19H5"/></svg>',
    title: "Align Center",
    state: () => hasAlignment() === 'center',
    result: () => setAlignment('center'),
  },
  {
    name: "justifyRight",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 5H3"/><path d="M21 12H9"/><path d="M21 19H7"/></svg>',
    title: "Align Right",
    state: () => hasAlignment() === 'right',
    result: () => setAlignment('right'),
  },
  {
    name: "justifyFull",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18"/><path d="M3 12h18"/><path d="M3 19h18"/></svg>',
    title: "Justify",
    state: () => hasAlignment() === 'justify',
    result: () => setAlignment('justify'),
  },
  {
    name: "subscript",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 5 8 8"/><path d="m12 5-8 8"/><path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"/></svg>',
    title: "Subscript",
    state: () => isInElement('sub'),
    result: () => toggleElement('sub'),
  },
  {
    name: "superscript",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 19 8-8"/><path d="m12 19-8-8"/><path d="M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06"/></svg>',
    title: "Superscript",
    state: () => isInElement('sup'),
    result: () => toggleElement('sup'),
  },
  {
    name: "undo",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',
    title: "Undo",
    result: () => document.execCommand('undo'),
  },
  {
    name: "redo",
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>',
    title: "Redo",
    result: () => document.execCommand('redo'),
  },
];

// =============================================================================
// Default Classes
// =============================================================================

const defaultClasses: Classes = {
  actionbar: "nanotext-actionbar",
  button: "nanotext-button",
  content: "nanotext-content",
  selected: "nanotext-button-selected",
};

// =============================================================================
// Initialization
// =============================================================================

function init(settings: Settings = {}): HTMLElement {
  const element =
    settings.element || document.getElementById("editor") || document.body;
  const onChange = settings.onChange || (() => {});
  const handleImageClick = settings.handleImageClick;

  const actions = settings.actions
    ? settings.actions.map((action) => {
        if (typeof action === "string") {
          const defaultAction = defaultActions.find((a) => a.name === action);
          if (action === "image" && handleImageClick) {
            return {
              ...defaultAction,
              result: handleImageClick,
            };
          }
          return defaultAction;
        } else {
          const defaultAction = defaultActions.find((a) => a.name === action.name);
          return defaultAction ? { ...defaultAction, ...action } : action;
        }
      })
    : defaultActions.map((defaultAction) => {
        if (defaultAction.name === "image" && handleImageClick) {
          return {
            ...defaultAction,
            result: handleImageClick,
          };
        }
        return defaultAction;
      });

  const classes = { ...defaultClasses, ...settings.classes };

  // Create actionbar
  const actionbar = document.createElement("div");
  actionbar.className = classes.actionbar;
  element.appendChild(actionbar);

  // Create content area
  const content = document.createElement("div");
  content.contentEditable = "true";
  content.className = classes.content;
  
  // Store reference for helper functions
  editorContent = content;
  (element as any).content = content;
  
  // Set initial content
  if (settings.content) {
    content.innerHTML = settings.content;
    onChange(content.innerHTML);
  } else {
    // Start with empty paragraph
    content.innerHTML = '<p><br></p>';
  }
  
  // Handle input events
  content.oninput = () => {
    // Ensure we have at least one block element
    if (content.innerHTML === '' || content.innerHTML === '<br>') {
      content.innerHTML = '<p><br></p>';
    }
    onChange(content.innerHTML);
  };
  
  element.appendChild(content);

  // Collect all state update functions
  const stateUpdaters: (() => void)[] = [];
  
  // Update all button states
  const updateAllStates = () => {
    stateUpdaters.forEach(fn => fn());
  };

  // Create action buttons
  actions.forEach((action) => {
    if (!action || !action.icon || !action.title || !action.result) return;
    
    const button = document.createElement("button") as HTMLButtonElement;
    button.className = classes.button;
    button.innerHTML = action.icon;
    button.title = action.title;
    button.setAttribute("type", "button");
    
    button.onclick = () => {
      if (action.result) action.result();
      content.focus();
      // Update all button states after action
      updateAllStates();
    };

    // Register state updater
    if (action.state) {
      const updateState = () => {
        if (action.state) {
          button.classList.toggle(classes.selected, action.state());
        }
      };
      stateUpdaters.push(updateState);
      content.addEventListener("keyup", updateState);
      content.addEventListener("mouseup", updateState);
    }

    actionbar.appendChild(button);
  });

  return element;
}

// =============================================================================
// Exports
// =============================================================================

// Main API
export { 
  init,
  insertFigure,
  createLink,
  toggleElement,
  setBlockType,
  setAlignment,
  toggleList,
  defaultActions,
  defaultClasses
};

// Helpers (exported for testing)
export {
  // Editor state
  setEditorContent,
  getEditorContent,
  // DOM helpers
  walkUp,
  isElementWithTag,
  findAncestor,
  findParentBlock,
  getParentBlock,
  // Selection helpers
  getSelection,
  getRange,
  // State detection
  isInElement,
  getBlockType,
  isInListType,
  hasAlignment,
  isSelectionFullyWrapped,
  // Range manipulation
  getBlocksInSelection,
  wrapRange,
  removeTagsFromFragment,
  cleanupEmptyElements,
};
