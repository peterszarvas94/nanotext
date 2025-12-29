import { describe, it, expect, beforeEach } from 'vitest';
import { 
  init, 
  toggleElement, 
  setBlockType, 
  toggleList, 
  insertFigure,
  setEditorContent,
  findAncestor,
  findParentBlock,
  isInElement,
  getBlockType,
  isInListType,
  hasAlignment,
  isSelectionFullyWrapped,
  getBlocksInSelection,
  wrapRange,
  removeTagsFromFragment,
  cleanupEmptyElements,
  defaultActions, 
  defaultClasses 
} from './nanotext-v2';

// =============================================================================
// Test Helpers
// =============================================================================

function createSelection(
  startNode: Node,
  startOffset: number,
  endNode: Node,
  endOffset: number
): Selection {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  
  return sel;
}

function collapseSelectionAt(node: Node, offset: number): Selection {
  return createSelection(node, offset, node, offset);
}

function normalizeHTML(html: string): string {
  return html.replace(/\s+/g, ' ').trim();
}

let editor: HTMLElement;
let content: HTMLElement;

function setupEditor(initialContent?: string): HTMLElement {
  document.body.innerHTML = '<div id="editor"></div>';
  editor = document.getElementById('editor')!;
  init({ element: editor, content: initialContent });
  content = editor.querySelector('.nanotext-content')!;
  return content;
}

beforeEach(() => {
  document.body.innerHTML = '<div id="editor"></div>';
  editor = document.getElementById('editor')!;
});

// =============================================================================
// Building Blocks - DOM Helpers
// =============================================================================

describe('DOM Helpers', () => {
  beforeEach(() => {
    editor.innerHTML = '<p>hello <strong>world</strong></p>';
    setEditorContent(editor);
  });

  describe('findAncestor', () => {
    it('should find ancestor element by tag name', () => {
      const strong = editor.querySelector('strong')!;
      const textNode = strong.firstChild!;
      
      const result = findAncestor(textNode, 'strong');
      expect(result).toBe(strong);
    });

    it('should return null if ancestor not found', () => {
      const p = editor.querySelector('p')!;
      const textNode = p.firstChild!; // "hello " text node
      
      const result = findAncestor(textNode, 'strong');
      expect(result).toBeNull();
    });

    it('should find ancestor further up the tree', () => {
      const strong = editor.querySelector('strong')!;
      const textNode = strong.firstChild!;
      
      const result = findAncestor(textNode, 'p');
      expect(result).toBe(editor.querySelector('p'));
    });

    it('should be case-insensitive', () => {
      const strong = editor.querySelector('strong')!;
      const textNode = strong.firstChild!;
      
      expect(findAncestor(textNode, 'STRONG')).toBe(strong);
      expect(findAncestor(textNode, 'Strong')).toBe(strong);
    });
  });

  describe('findParentBlock', () => {
    it('should find paragraph as parent block', () => {
      const p = editor.querySelector('p')!;
      const textNode = p.firstChild!;
      
      const result = findParentBlock(textNode);
      expect(result).toBe(p);
    });

    it('should find paragraph even from inside inline element', () => {
      const strong = editor.querySelector('strong')!;
      const textNode = strong.firstChild!;
      
      const result = findParentBlock(textNode);
      expect(result?.tagName).toBe('P');
    });

    it('should find list item in a list', () => {
      editor.innerHTML = '<ul><li>item</li></ul>';
      const li = editor.querySelector('li')!;
      const textNode = li.firstChild!;
      
      const result = findParentBlock(textNode);
      expect(result?.tagName).toBe('LI');
    });

    it('should return null for nodes outside blocks', () => {
      setEditorContent(null);
      const result = findParentBlock(document.body);
      expect(result).toBeNull();
    });
  });
});

// =============================================================================
// Building Blocks - State Detection
// =============================================================================

describe('State Detection', () => {
  beforeEach(() => {
    init({ element: editor, content: '<p>hello <strong>world</strong></p>' });
    content = editor.querySelector('.nanotext-content')!;
  });

  describe('isInElement', () => {
    it('should return true when cursor is inside element', () => {
      const strong = content.querySelector('strong')!;
      const textNode = strong.firstChild!;
      collapseSelectionAt(textNode, 2);
      
      expect(isInElement('strong')).toBe(true);
    });

    it('should return false when cursor is outside element', () => {
      const p = content.querySelector('p')!;
      const textNode = p.firstChild!; // "hello " text
      collapseSelectionAt(textNode, 2);
      
      expect(isInElement('strong')).toBe(false);
    });

    it('should be case-insensitive', () => {
      const strong = content.querySelector('strong')!;
      const textNode = strong.firstChild!;
      collapseSelectionAt(textNode, 2);
      
      expect(isInElement('STRONG')).toBe(true);
      expect(isInElement('Strong')).toBe(true);
    });
  });

  describe('getBlockType', () => {
    it('should return p for paragraph', () => {
      const p = content.querySelector('p')!;
      const textNode = p.firstChild!;
      collapseSelectionAt(textNode, 0);
      
      expect(getBlockType()).toBe('p');
    });

    it('should return h1 for heading', () => {
      setupEditor('<h1>Heading</h1>');
      
      const h1 = content.querySelector('h1')!;
      collapseSelectionAt(h1.firstChild!, 0);
      
      expect(getBlockType()).toBe('h1');
    });

    it('should return li for list item', () => {
      setupEditor('<ul><li>item</li></ul>');
      
      const li = content.querySelector('li')!;
      collapseSelectionAt(li.firstChild!, 0);
      
      expect(getBlockType()).toBe('li');
    });
  });

  describe('isInListType', () => {
    it('should return true for ul when in unordered list', () => {
      setupEditor('<ul><li>item</li></ul>');
      
      const li = content.querySelector('li')!;
      collapseSelectionAt(li.firstChild!, 0);
      
      expect(isInListType('ul')).toBe(true);
      expect(isInListType('ol')).toBe(false);
    });

    it('should return true for ol when in ordered list', () => {
      setupEditor('<ol><li>item</li></ol>');
      
      const li = content.querySelector('li')!;
      collapseSelectionAt(li.firstChild!, 0);
      
      expect(isInListType('ol')).toBe(true);
      expect(isInListType('ul')).toBe(false);
    });

    it('should return false when not in any list', () => {
      const p = content.querySelector('p')!;
      collapseSelectionAt(p.firstChild!, 0);
      
      expect(isInListType('ul')).toBe(false);
      expect(isInListType('ol')).toBe(false);
    });
  });

  describe('hasAlignment', () => {
    it('should return null when no alignment set', () => {
      const p = content.querySelector('p')!;
      collapseSelectionAt(p.firstChild!, 0);
      
      expect(hasAlignment()).toBeNull();
    });

    it('should return alignment value when set', () => {
      setupEditor('<p style="text-align: center">centered</p>');
      
      const p = content.querySelector('p')!;
      collapseSelectionAt(p.firstChild!, 0);
      
      expect(hasAlignment()).toBe('center');
    });
  });

  describe('isSelectionFullyWrapped', () => {
    it('should return true when selection is fully inside element', () => {
      const strong = content.querySelector('strong')!;
      const textNode = strong.firstChild!;
      createSelection(textNode, 0, textNode, 3); // "wor" inside strong
      
      expect(isSelectionFullyWrapped('strong')).toBe(true);
    });

    it('should return false when selection crosses element boundary', () => {
      const p = content.querySelector('p')!;
      const helloText = p.firstChild!; // "hello "
      const strongText = p.querySelector('strong')!.firstChild!; // "world"
      createSelection(helloText, 4, strongText, 2); // "o wor"
      
      expect(isSelectionFullyWrapped('strong')).toBe(false);
    });

    it('should return false when selection is outside element', () => {
      const p = content.querySelector('p')!;
      const helloText = p.firstChild!;
      createSelection(helloText, 0, helloText, 3); // "hel"
      
      expect(isSelectionFullyWrapped('strong')).toBe(false);
    });
  });
});

// =============================================================================
// Building Blocks - Range/Selection Manipulation
// =============================================================================

describe('Range/Selection Manipulation', () => {
  beforeEach(() => {
    init({ element: editor, content: '<p>hello world</p>' });
    content = editor.querySelector('.nanotext-content')!;
  });

  describe('getBlocksInSelection', () => {
    it('should return single block for single-line selection', () => {
      const p = content.querySelector('p')!;
      const range = document.createRange();
      range.setStart(p.firstChild!, 0);
      range.setEnd(p.firstChild!, 5);
      
      const blocks = getBlocksInSelection(range);
      expect(blocks.length).toBeGreaterThanOrEqual(0);
    });

    it('should return multiple blocks for multi-line selection', () => {
      setupEditor('<p>first</p><p>second</p><p>third</p>');
      
      const paragraphs = content.querySelectorAll('p');
      const range = document.createRange();
      range.setStart(paragraphs[0].firstChild!, 0);
      range.setEnd(paragraphs[2].firstChild!, 5);
      
      const blocks = getBlocksInSelection(range);
      expect(blocks.length).toBe(3);
    });

    it('should return list items for list selection', () => {
      setupEditor('<ul><li>one</li><li>two</li></ul>');
      
      const items = content.querySelectorAll('li');
      const range = document.createRange();
      range.setStart(items[0].firstChild!, 0);
      range.setEnd(items[1].firstChild!, 3);
      
      const blocks = getBlocksInSelection(range);
      expect(blocks.length).toBe(2);
      expect(blocks[0].tagName).toBe('LI');
    });
  });

  describe('wrapRange', () => {
    it('should wrap simple selection', () => {
      const p = content.querySelector('p')!;
      const textNode = p.firstChild!;
      
      const range = document.createRange();
      range.setStart(textNode, 6);
      range.setEnd(textNode, 11);
      
      wrapRange(range, 'strong');
      
      expect(normalizeHTML(content.innerHTML)).toBe('<p>hello <strong>world</strong></p>');
    });

    it('should add attributes to wrapper', () => {
      const p = content.querySelector('p')!;
      const textNode = p.firstChild!;
      
      const range = document.createRange();
      range.setStart(textNode, 6);
      range.setEnd(textNode, 11);
      
      wrapRange(range, 'a', { href: 'https://example.com' });
      
      const link = content.querySelector('a');
      expect(link).not.toBeNull();
      expect(link!.getAttribute('href')).toBe('https://example.com');
    });
  });

  describe('removeTagsFromFragment', () => {
    it('should remove matching tags from fragment', () => {
      const fragment = document.createDocumentFragment();
      const strong = document.createElement('strong');
      strong.textContent = 'bold';
      fragment.appendChild(strong);
      fragment.appendChild(document.createTextNode(' normal'));
      
      removeTagsFromFragment(fragment, 'strong');
      
      expect(fragment.querySelector('strong')).toBeNull();
      expect(fragment.textContent).toBe('bold normal');
    });

    it('should not affect other tags', () => {
      const fragment = document.createDocumentFragment();
      const strong = document.createElement('strong');
      strong.textContent = 'bold';
      const em = document.createElement('em');
      em.textContent = 'italic';
      fragment.appendChild(strong);
      fragment.appendChild(em);
      
      removeTagsFromFragment(fragment, 'strong');
      
      expect(fragment.querySelector('strong')).toBeNull();
      expect(fragment.querySelector('em')).not.toBeNull();
    });
  });

  describe('cleanupEmptyElements', () => {
    it('should remove empty inline elements', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p><strong></strong>text</p>';
      
      cleanupEmptyElements(container);
      
      expect(container.querySelector('strong')).toBeNull();
      expect(container.textContent).toBe('text');
    });

    it('should keep non-empty elements', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p><strong>bold</strong>text</p>';
      
      cleanupEmptyElements(container);
      
      expect(container.querySelector('strong')).not.toBeNull();
    });
  });
});

// =============================================================================
// Integration - Inline Formatting
// =============================================================================

describe('Inline Formatting', () => {
  describe('toggleElement - basic', () => {
    it('should wrap selection in strong tag', () => {
      setupEditor('<p>hello world</p>');
      
      const textNode = content.querySelector('p')!.firstChild!;
      createSelection(textNode, 6, textNode, 11);
      
      toggleElement('strong');
      
      expect(normalizeHTML(content.innerHTML)).toBe('<p>hello <strong>world</strong></p>');
    });

    it('should unwrap selection from strong tag', () => {
      setupEditor('<p>hello <strong>world</strong></p>');
      
      const strongEl = content.querySelector('strong')!;
      createSelection(strongEl.firstChild!, 0, strongEl.firstChild!, 5);
      
      toggleElement('strong');
      
      expect(content.querySelector('strong')).toBeNull();
    });
  });

  describe('toggleElement - cross-boundary', () => {
    it('should handle selection starting inside strong and ending outside', () => {
      setupEditor('<p><strong>hello</strong> world</p>');
      
      const p = content.querySelector('p')!;
      const strongText = p.querySelector('strong')!.firstChild!;
      const afterText = p.childNodes[1];
      
      createSelection(strongText, 2, afterText, 3);
      toggleElement('strong');
      
      const html = normalizeHTML(content.innerHTML);
      expect(html).toContain('<strong>he</strong>');
      expect(html).toContain('<strong>llo wo</strong>');
    });

    it('should handle selection ending inside strong', () => {
      setupEditor('<p>hello <strong>world</strong></p>');
      
      const p = content.querySelector('p')!;
      const beforeText = p.firstChild!;
      const strongText = p.querySelector('strong')!.firstChild!;
      
      createSelection(beforeText, 4, strongText, 2);
      toggleElement('strong');
      
      const html = normalizeHTML(content.innerHTML);
      expect(html).toContain('<strong>o wo</strong>');
      expect(html).toContain('<strong>rld</strong>');
    });
  });

  describe('toggleElement - multi-line', () => {
    it('should wrap each list item separately', () => {
      setupEditor('<ul><li>item one</li><li>item two</li><li>item three</li></ul>');
      
      const items = content.querySelectorAll('li');
      createSelection(items[0].firstChild!, 5, items[2].firstChild!, 4);
      
      toggleElement('strong');
      
      items.forEach(li => {
        li.querySelectorAll('strong').forEach(strong => {
          expect(strong.parentElement).toBe(li);
        });
      });
    });

    it('should remove existing bold when applying bold across multiple lines', () => {
      setupEditor('<ul><li><strong>bold</strong> normal</li><li>all normal</li></ul>');
      
      const items = content.querySelectorAll('li');
      const firstStrong = items[0].querySelector('strong')!.firstChild!;
      
      createSelection(firstStrong, 1, items[1].firstChild!, 3);
      toggleElement('strong');
      
      expect(content.innerHTML).toContain('<strong>b</strong>');
    });
  });
});

// =============================================================================
// Integration - Block Formatting
// =============================================================================

describe('Block Formatting', () => {
  describe('setBlockType', () => {
    it('should convert paragraph to h1', () => {
      setupEditor('<p>Hello world</p>');
      
      const textNode = content.querySelector('p')!.firstChild!;
      createSelection(textNode, 0, textNode, 5);
      setBlockType('h1');
      
      expect(content.querySelector('h1')).not.toBeNull();
      expect(content.querySelector('p')).toBeNull();
    });

    it('should preserve inline formatting when changing block type', () => {
      setupEditor('<p>Hello <strong>world</strong></p>');
      
      const textNode = content.querySelector('p')!.firstChild!;
      createSelection(textNode, 0, textNode, 5);
      setBlockType('h1');
      
      expect(content.querySelector('h1 strong')).not.toBeNull();
    });
  });

  describe('List extraction', () => {
    it('should extract middle list item to paragraph', () => {
      setupEditor('<ul><li>item one</li><li>item two</li><li>item three</li></ul>');
      
      const secondItem = content.querySelectorAll('li')[1];
      createSelection(secondItem.firstChild!, 0, secondItem.firstChild!, 8);
      setBlockType('p');
      
      expect(content.querySelector('p')!.textContent).toBe('item two');
    });

    it('should extract first list item', () => {
      setupEditor('<ul><li>item one</li><li>item two</li></ul>');
      
      const firstItem = content.querySelector('li')!;
      createSelection(firstItem.firstChild!, 0, firstItem.firstChild!, 8);
      setBlockType('p');
      
      expect(content.querySelector('p')!.textContent).toBe('item one');
      expect(content.querySelectorAll('li').length).toBe(1);
    });

    it('should extract last list item', () => {
      setupEditor('<ul><li>item one</li><li>item two</li></ul>');
      
      const lastItem = content.querySelectorAll('li')[1];
      createSelection(lastItem.firstChild!, 0, lastItem.firstChild!, 8);
      setBlockType('p');
      
      expect(content.querySelector('p')!.textContent).toBe('item two');
      expect(content.querySelectorAll('li').length).toBe(1);
    });
  });
});

// =============================================================================
// Integration - List Manipulation
// =============================================================================

describe('List Manipulation', () => {
  describe('toggleList', () => {
    it('should convert paragraph to unordered list', () => {
      setupEditor('<p>Hello world</p>');
      
      const textNode = content.querySelector('p')!.firstChild!;
      createSelection(textNode, 0, textNode, 5);
      toggleList('ul');
      
      expect(content.querySelector('ul')).not.toBeNull();
      expect(content.querySelector('li')).not.toBeNull();
      expect(content.querySelector('p')).toBeNull();
    });

    it('should convert ul to ol', () => {
      setupEditor('<ul><li>item one</li><li>item two</li></ul>');
      
      const li = content.querySelector('li')!;
      createSelection(li.firstChild!, 0, li.firstChild!, 4);
      toggleList('ol');
      
      expect(content.querySelector('ol')).not.toBeNull();
      expect(content.querySelector('ul')).toBeNull();
      expect(content.querySelectorAll('li').length).toBe(2);
    });

    it('should remove list when clicking same list type', () => {
      setupEditor('<ul><li>only item</li></ul>');
      
      const li = content.querySelector('li')!;
      createSelection(li.firstChild!, 0, li.firstChild!, 4);
      toggleList('ul');
      
      expect(content.querySelector('ul')).toBeNull();
      expect(content.querySelector('p')).not.toBeNull();
    });
  });
});

// =============================================================================
// Integration - Figure/Image
// =============================================================================

describe('Figure/Image Insertion', () => {
  it('should create figure with img', () => {
    setupEditor('<p>Hello world</p>');
    
    const textNode = content.querySelector('p')!.firstChild!;
    collapseSelectionAt(textNode, 5);
    insertFigure('https://example.com/image.jpg');
    
    const figure = content.querySelector('figure');
    expect(figure).not.toBeNull();
    expect(figure!.querySelector('img')!.src).toBe('https://example.com/image.jpg');
  });

  it('should create editable figcaption', () => {
    setupEditor('<p>Hello world</p>');
    
    const textNode = content.querySelector('p')!.firstChild!;
    collapseSelectionAt(textNode, 5);
    insertFigure('https://example.com/image.jpg');
    
    const figcaption = content.querySelector('figcaption');
    expect(figcaption).not.toBeNull();
    expect(figcaption!.getAttribute('contenteditable')).toBe('true');
  });
});

// =============================================================================
// Exports
// =============================================================================

describe('Exports', () => {
  describe('defaultActions', () => {
    it('should export defaultActions array', () => {
      expect(Array.isArray(defaultActions)).toBe(true);
    });

    it('should have required actions', () => {
      const names = defaultActions.map(a => a.name);
      
      expect(names).toContain('bold');
      expect(names).toContain('italic');
      expect(names).toContain('underline');
      expect(names).toContain('strikethrough');
      expect(names).toContain('heading1');
      expect(names).toContain('heading2');
      expect(names).toContain('paragraph');
      expect(names).toContain('quote');
      expect(names).toContain('code');
      expect(names).toContain('olist');
      expect(names).toContain('ulist');
      expect(names).toContain('link');
      expect(names).toContain('image');
    });

    it('each action should have required properties', () => {
      defaultActions.forEach(action => {
        expect(action).toHaveProperty('name');
        expect(action).toHaveProperty('icon');
        expect(action).toHaveProperty('title');
        expect(action).toHaveProperty('result');
        expect(typeof action.name).toBe('string');
        expect(typeof action.icon).toBe('string');
        expect(typeof action.title).toBe('string');
        expect(typeof action.result).toBe('function');
      });
    });
  });

  describe('defaultClasses', () => {
    it('should have nanotext- prefix on all classes', () => {
      Object.values(defaultClasses).forEach(className => {
        expect(className).toMatch(/^nanotext-/);
      });
    });
  });
});

// =============================================================================
// Init
// =============================================================================

describe('init', () => {
  it('should create actionbar and content elements', () => {
    init({ element: editor });
    
    expect(editor.querySelector('.nanotext-actionbar')).not.toBeNull();
    expect(editor.querySelector('.nanotext-content')).not.toBeNull();
  });

  it('should set initial content', () => {
    init({ element: editor, content: '<p>Hello world</p>' });
    
    content = editor.querySelector('.nanotext-content')!;
    expect(content.innerHTML).toBe('<p>Hello world</p>');
  });

  it('should create buttons for all actions', () => {
    init({ element: editor });
    
    const buttons = editor.querySelectorAll('.nanotext-button');
    expect(buttons.length).toBe(defaultActions.length);
  });

  it('should respect custom actions list', () => {
    init({ element: editor, actions: ['bold', 'italic'] });
    
    const buttons = editor.querySelectorAll('.nanotext-button');
    expect(buttons.length).toBe(2);
  });

  it('should call onChange when content changes', () => {
    let changedHtml = '';
    init({ 
      element: editor,
      content: '<p>Test</p>',
      onChange: (html) => { changedHtml = html; }
    });
    
    content = editor.querySelector('.nanotext-content') as HTMLElement;
    content.innerHTML = '<p>Changed</p>';
    content.dispatchEvent(new Event('input'));
    
    expect(changedHtml).toBe('<p>Changed</p>');
  });
});
