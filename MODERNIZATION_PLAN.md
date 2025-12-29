# Nanotext Modernization Plan

## Overview

This document outlines the plan to modernize Nanotext by removing deprecated APIs and implementing a clean, predictable architecture using modern web standards.

---

## Core Architecture Decisions

### 1. Remove Deprecated APIs
- ❌ **Remove:** `document.execCommand()` (deprecated)
- ❌ **Remove:** `document.queryCommandState()` (deprecated)
- ❌ **Remove:** `document.queryCommandValue()` (deprecated)
- ✅ **Use:** Modern Selection API + Range API + Direct DOM manipulation

### 2. Flat Content Structure
The content div (`contentEditable`) will only contain these direct children:

**Block Elements:**
- `<p>` - Paragraph (default)
- `<h1>`, `<h2>` - Headings
- `<blockquote>` - Quotes
- `<pre>` - Code blocks
- `<ul>`, `<ol>` - Lists (containing `<li>` children)
- `<figure>` - Images with optional caption

**Inline Elements (within blocks):**
- `<strong>` - Bold
- `<em>` - Italic
- `<u>` - Underline
- `<s>` - Strikethrough
- `<a href="...">` - Links
- `<sub>`, `<sup>` - Subscript/Superscript

**NO NESTING:**
- No `<div>` in `<div>`
- No nested block elements (except `<li>` inside `<ul>`/`<ol>`, `<figcaption>` inside `<figure>`)
- Semantic tags can be nested as needed (e.g., `<strong><em>text</em></strong>`)

### 3. Inline Formatting Strategy

**Use semantic HTML elements for inline formatting:**
```html
<!-- Bold -->
<strong>text</strong>

<!-- Italic -->
<em>text</em>

<!-- Underline -->
<u>text</u>

<!-- Strikethrough -->
<s>text</s>

<!-- Multiple styles - nest elements -->
<strong><em>bold and italic</em></strong>

<!-- Links -->
<a href="url">text</a>

<!-- Subscript/Superscript -->
<sub>text</sub>
<sup>text</sup>
```

**Block-level styles (use CSS):**
```html
<!-- Text alignment on block elements -->
<p style="text-align: center">centered text</p>
<h1 style="text-align: right">right-aligned heading</h1>
```

**Why semantic HTML instead of styled spans:**
- Simpler HTML output
- Better semantics and accessibility
- Easier state detection (just check if selection is inside `<strong>`)
- No text-decoration conflicts between underline and strikethrough

### 4. Two-State Button System (Google Docs Style)

**Button States:**
- **OFF** - Style not applied to ALL text in selection (any text is unstyled)
- **ON** - Style applied to ALL text in selection (100% coverage)

**Toggle Logic:**
```
OFF → (click) → ON (apply to entire selection)
ON → (click) → OFF (remove from entire selection)
```

**State Detection:**
- If ANY character in selection lacks the style → OFF
- Only if ALL characters have the style → ON
- Simple boolean check, no mixed state needed

**Visual States:**
- OFF: Normal button appearance
- ON: Highlighted (`.nanotext-button-selected`)

---

## UX Decisions

### Selection & State Detection (Google Docs Behavior)

**Context-Aware State (No Global Pending Styles):**

Button state is determined by cursor position or selection:

1. **No Selection (Cursor Only):**
   - Cursor in normal text → Button OFF
   - Cursor in styled text → Button ON
   - State reflects the style at cursor position

2. **With Selection:**
   - **ALL** selected text has style → Button ON
   - **ANY** selected text lacks style → Button OFF

3. **Typing Behavior:**
   - Browser naturally continues style at cursor position
   - No need to track "pending styles" manually
   - Typing in bold text creates bold text
   - Typing in normal text creates normal text

**Toggle Behavior:**
- Button OFF → Apply style to **entire** selection
- Button ON → Remove style from **entire** selection

**Key Insight:** No global state tracking needed! Just inspect DOM at cursor/selection position.

### Image Insertion

**Always block-level using `<figure>` with optional caption:**
```html
<!-- Image without caption -->
<figure>
  <img src="url" />
</figure>

<!-- Image with caption -->
<figure>
  <img src="url" />
  <figcaption contenteditable="true">Caption here</figcaption>
</figure>
```

**Behavior:**
- Images are always in separate line (block-level)
- Caption is editable via nested contentEditable
- Inserting image creates new `<figure>` block at cursor position

### List Creation

**Convert selected paragraphs to list items:**
```javascript
// Single paragraph
<p>Item</p> + click UL
→ <ul><li>Item</li></ul>

// Multiple paragraphs selected
<p>Item 1</p>
<p>Item 2</p>
<p>Item 3</p> + click UL
→ <ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

**List items can contain inline formatting:**
```html
<ul>
  <li>Buy <strong>milk</strong></li>
</ul>
```

**Don't intercept Enter key:**
- Rely on browser's default behavior for creating new list items
- Browser handles undo/redo automatically with contentEditable

### DOM Normalization

**Skip normalization entirely:**
- Browser's contentEditable handles undo/redo history automatically
- Normalizing the DOM breaks the browser's undo stack
- Keep it simple - let the browser handle nested/adjacent elements naturally
- No need to merge adjacent `<strong>` tags or clean up nesting
- Can add optional normalization later if needed (opt-in feature)

---

## Implementation Plan

### Phase 1: Helper Functions - Selection & Range

**Selection Helpers:**
```typescript
function getSelection(): Selection | null
function getRange(): Range | null
function getSelectedNodes(): Node[]
function getParentBlock(node: Node): HTMLElement | null
```

**Style Detection (for semantic tags):**
```typescript
function isInElement(tagName: string): boolean // Check if selection is inside <strong>, <em>, etc.
function getBlockType(): string | null // Returns 'p', 'h1', 'h2', 'blockquote', 'li', etc.
function hasAlignment(): string | null // Returns 'left', 'center', 'right', 'justify', or null
```

**Style Manipulation:**
```typescript
function toggleElement(tagName: string): void // Toggle <strong>, <em>, <u>, <s>
function wrapSelection(tagName: string, attributes?: Record<string, string>): void // Wrap in element
function unwrapSelection(tagName: string): void // Remove wrapping element
function setBlockType(tagName: string): void // Convert to <p>, <h1>, <h2>, <blockquote>
function setAlignment(value: string): void // Set text-align CSS on block element
```

**Block Manipulation:**
```typescript
function toggleList(type: 'ul' | 'ol'): void
function insertFigure(url: string): void
function createLink(url: string): void
```

### Phase 2: Update Action Definitions

**Inline Format Actions:**
```typescript
{
  name: "bold",
  result: () => toggleElement('strong'),
  state: () => isInElement('strong')
}

{
  name: "italic",
  result: () => toggleElement('em'),
  state: () => isInElement('em')
}

{
  name: "underline",
  result: () => toggleElement('u'),
  state: () => isInElement('u')
}

{
  name: "strikethrough",
  result: () => toggleElement('s'),
  state: () => isInElement('s')
}
```

**Block Format Actions:**
```typescript
{
  name: "heading1",
  result: () => setBlockType('h1'),
  state: () => getBlockType() === 'h1'
}

{
  name: "heading2",
  result: () => setBlockType('h2'),
  state: () => getBlockType() === 'h2'
}

{
  name: "paragraph",
  result: () => setBlockType('p'),
  state: () => getBlockType() === 'p'
}

{
  name: "quote",
  result: () => setBlockType('blockquote'),
  state: () => getBlockType() === 'blockquote'
}

{
  name: "code",
  result: () => setBlockType('pre'),
  state: () => getBlockType() === 'pre'
}
```

**List Actions:**
```typescript
{
  name: "olist",
  result: () => toggleList('ol'),
  state: () => getBlockType() === 'li' && isInListType('ol')
}

{
  name: "ulist",
  result: () => toggleList('ul'),
  state: () => getBlockType() === 'li' && isInListType('ul')
}
```

**Special Actions:**
```typescript
{
  name: "subscript",
  result: () => toggleElement('sub'),
  state: () => isInElement('sub')
}

{
  name: "superscript",
  result: () => toggleElement('sup'),
  state: () => isInElement('sup')
}

{
  name: "link",
  result: () => {
    const url = window.prompt("Enter the link URL");
    if (url) createLink(url);
  },
  state: () => isInElement('a')
}

{
  name: "image",
  result: () => {
    const url = window.prompt("Insert image url");
    if (url) insertFigure(url);
  }
}
```

**Alignment Actions:**
```typescript
{
  name: "justifyLeft",
  result: () => setAlignment('left'),
  state: () => hasAlignment() === 'left'
}

{
  name: "justifyCenter",
  result: () => setAlignment('center'),
  state: () => hasAlignment() === 'center'
}

{
  name: "justifyRight",
  result: () => setAlignment('right'),
  state: () => hasAlignment() === 'right'
}

{
  name: "justifyFull",
  result: () => setAlignment('justify'),
  state: () => hasAlignment() === 'justify'
}
```

**Undo/Redo Actions:**
```typescript
{
  name: "undo",
  result: () => document.execCommand('undo'), // Browser native undo
}

{
  name: "redo",
  result: () => document.execCommand('redo'), // Browser native redo
}
```

**Note:** We keep undo/redo using execCommand since browser handles the history automatically. No need to reimplement this.

### Phase 3: Update Button Rendering

**Two-state button logic:**
```typescript
if (action.state) {
  const handler = () => {
    if (action.state) {
      const isActive = action.state(); // returns boolean
      button.classList.toggle(classes.selected, isActive);
    }
  };
  
  addEventListener(content, "keyup", handler);
  addEventListener(content, "mouseup", handler);
  addEventListener(button, "click", handler);
}
```

### Phase 4: CSS Updates

**No changes needed:**
- Already have `.nanotext-button-selected` for ON state
- Default styling for OFF state
- No indeterminate state required

### Phase 5: Input Event Handler

**Simple onChange callback (no normalization):**
```typescript
content.oninput = (event: Event) => {
  const target = event.target as HTMLElement;
  
  // Trigger onChange callback
  onChange(target.innerHTML);
};
```

**No normalization needed:**
- Browser handles DOM structure automatically
- Undo/redo works natively
- Keep it simple

### Phase 6: Remove Deprecated Code

**Delete these functions:**
```typescript
// Remove
function exec(command: string, value: string | null = null): boolean
function queryCommandState(command: string): boolean
function queryCommandValue(command: string): string
```

**Update exports:**
```typescript
// Remove from exports
export { 
  // FORMAT_BLOCK, // REMOVE
  // queryCommandState, // REMOVE
  // exec, // REMOVE
  insertImage, 
  init 
}
```

---

## Testing Strategy

### Unit Tests

**State detection:**
- Test `isInElement()` with various semantic tags
- Test `getBlockType()` with different block elements (p, h1, h2, blockquote, pre, li)
- Test `hasAlignment()` with various text-align values

**Style manipulation:**
- Test `toggleElement()` wrapping/unwrapping text in semantic tags
- Test `setBlockType()` converting between block elements
- Test `toggleList()` creating and removing lists
- Test `insertFigure()` creating figure with image
- Test `createLink()` wrapping selection in anchor tag

### Integration Tests

**User workflows:**
- Type text → select → bold → italic → unbold
- Create list → type items → format items → press Enter (new list item)
- Insert image → creates figure block
- Change block types with formatted content (p → h1 → h2 → blockquote → pre)
- Apply text alignment to blocks
- Test undo/redo throughout all operations

---

## Migration Notes

### Breaking Changes

1. **HTML output format changed:**
   - Old: `<b>text</b>`, `<i>text</i>` (from execCommand)
   - New: `<strong>text</strong>`, `<em>text</em>`, `<u>text</u>`, `<s>text</s>`

2. **Removed exports:**
   - `FORMAT_BLOCK`
   - `queryCommandState`
   - `queryCommandValue`
   - `exec`

3. **Image handling changed:**
   - Old: Inline `<img>` inserted via execCommand
   - New: Block-level `<figure><img /></figure>`

4. **Actions API (backward compatible):**
   - String arrays still supported: `['bold', 'italic']`
   - Object arrays also supported: `[{ name: 'bold' }, { name: 'italic' }]`

### Backward Compatibility

**Content format:**
- Old content with `<b>`, `<i>`, `<u>` tags still renders correctly
- New content uses semantic tags `<strong>`, `<em>`, etc.
- No automatic migration - output format simply changes going forward

---

## Feature Set (Final)

**Inline Formatting:**
- ✅ Bold (`<strong>`)
- ✅ Italic (`<em>`)
- ✅ Underline (`<u>`)
- ✅ Strikethrough (`<s>`)
- ✅ Subscript (`<sub>`)
- ✅ Superscript (`<sup>`)

**Block Types:**
- ✅ Paragraph (`<p>`)
- ✅ Heading 1 (`<h1>`)
- ✅ Heading 2 (`<h2>`)
- ✅ Blockquote (`<blockquote>`)
- ✅ Code block (`<pre>`)

**Lists:**
- ✅ Ordered list (`<ol>`)
- ✅ Unordered list (`<ul>`)

**Special:**
- ✅ Link (`<a>`)
- ✅ Image (`<figure>` with optional `<figcaption>`)
- ✅ Text alignment (left, center, right, justify) via CSS

**Undo/Redo:**
- ✅ Browser native undo/redo (keep using execCommand for this)

---

## API (Backward Compatible)

### Simple API (Recommended)
```typescript
const editor = init({
  element: document.getElementById("editor"),
  actions: ['bold', 'italic', 'underline', 'heading1', 'heading2']
});
```

### Advanced API (Custom Actions)
```typescript
const editor = init({
  element: document.getElementById("editor"),
  actions: [
    'bold', // Use default
    { 
      name: 'italic', 
      title: 'Make Italic', // Override title
      icon: '<svg>...</svg>' // Override icon
    },
    {
      name: 'custom',
      icon: '...',
      title: 'Custom Action',
      result: () => { /* custom logic */ },
      state: () => false
    }
  ]
});
```

**Backward compatible:**
- String arrays work as before
- Object arrays work for customization
- Mix and match strings and objects

---

## Success Criteria

- ✅ No deprecation warnings in console (except undo/redo which use execCommand)
- ✅ All formatting actions work without execCommand (using Selection/Range API)
- ✅ Flat DOM structure with semantic HTML tags
- ✅ Two-state buttons work correctly (ON/OFF, no indeterminate)
- ✅ Browser native undo/redo works throughout
- ✅ All existing tests pass (with updates for new HTML output)
- ✅ Example page works identically to before
- ✅ Clean, maintainable codebase
- ✅ Backward compatible API (string arrays still work)

---

## Implementation Notes

### Key Decisions
1. **Semantic HTML over styled spans** - Simpler, more accessible, easier to work with
2. **No DOM normalization** - Let browser handle structure, preserve native undo/redo
3. **Block-level images** - Using `<figure>` with optional `<figcaption>`
4. **Two-state buttons only** - "Indeterminate" (mixed state) counts as OFF
5. **Keep execCommand for undo/redo** - Browser handles history automatically, no need to reimplement
6. **Backward compatible API** - String arrays still work, objects optional for customization

### Simplifications from Original Plan
- Removed h3-h6 (only h1-h2 needed for bare minimum)
- Removed horizontal rule (not essential)
- Removed normalization (adds complexity, breaks undo/redo)
- Simplified helper functions (fewer abstractions)
- Using semantic tags instead of inline styles (much simpler)

---

*Document created: 2025-12-28*
*Document updated: 2025-12-29*
*Status: Planning Complete - Ready for Implementation*
