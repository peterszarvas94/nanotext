# Agent Guidelines for Nanotext

This document provides coding guidelines and conventions for AI coding agents working on the Nanotext WYSIWYG editor codebase.

## Project Overview

Nanotext is a lightweight, dependency-free WYSIWYG text editor forked from Pell. It uses TypeScript, vanilla JavaScript, and CSS with a focus on simplicity and minimal bundle size.

**Key Files:**
- `src/nanotext.ts` - Main TypeScript implementation
- `src/nanotext.css` - Editor styling
- `src/nanotext.test.ts` - Test file
- `example/index.html` - Demo/test page
- `vite.config.js` - Build configuration

## Build Commands

### Development
```bash
npm run dev           # Start dev server at http://localhost:3000
npm run test          # Run all tests once
npm run test:watch    # Run tests in watch mode
```

### Production
```bash
npm run build         # Build for production (outputs to dist/)
npm run preview       # Preview production build locally
npm run test          # Run tests before deployment
```

### Installation
```bash
npm install           # Install dependencies
```

**Running Single Tests:** Use Vitest's filtering capability:
```bash
npx vitest run --reporter=verbose    # See all test names
npx vitest run -t "test name"        # Run specific test by name
```

## Code Style Guidelines

### TypeScript

#### File Structure
- Use ES6 modules with named exports
- Group related functionality together
- Export constants and functions that may be reused
- All source files are in TypeScript (.ts extension)

#### Type Definitions
- Use explicit type definitions for all function parameters and return values
- Define interfaces/Types for complex objects at the top of the file

```typescript
type Action = {
  name: string;
  icon: string;
  title: string;
  result: () => void;
  state?: () => boolean;
};

type Settings = {
  element?: HTMLElement;
  onChange?: (html: string) => void;
  // ... other properties
};
```

#### Imports/Exports
```typescript
// Export helper functions and constants
export const formatBlock = "formatBlock";
export const exec = (command: string, value: string | null = null): boolean => ...;
export function insertImage(url: string): void { ... }

// Main init function is the primary export
export const init = (settings: Settings): HTMLElement => { ... };
```

#### Naming Conventions
- **Variables/Functions:** camelCase (`defaultActions`, `createElement`, `insertImage`)
- **Constants:** UPPER_SNAKE_CASE for string constants (`DEFAULT_PARAGRAPH_SEPARATOR_STRING`)
- **CSS Classes:** kebab-case with `nanotext-` prefix (`nanotext-button`, `nanotext-actionbar`)
- **Type Names:** PascalCase for types/interfaces (`Action`, `Settings`, `Classes`)
- **Internal helpers:** camelCase, not exported unless needed externally

#### Functions
- Use arrow functions for simple helpers
- Use function declarations for exported functions with complex logic
- Single-line arrow functions when possible for brevity
- Always specify return types for exported functions

```typescript
// Helper functions - arrow style with types
const addEventListener = (parent: HTMLElement, type: string, listener: EventListener): void =>
  parent.addEventListener(type, listener);

// Exported functions with logic - function declaration
export function insertImage(url: string): void {
  const imgWrapper = document.createElement("div");
  // ... implementation
}
```

#### DOM Manipulation
- Use helper functions to abstract common DOM operations
- Leverage native DOM APIs (no jQuery or similar)
- Cache DOM references when reused
- Always type DOM elements correctly

```typescript
const createElement = (tag: string): HTMLElement => document.createElement(tag);
const appendChild = (parent: HTMLElement, child: HTMLElement): HTMLElement => parent.appendChild(child);
```

#### Configuration Objects
- Use configuration objects for flexible APIs
- Provide sensible defaults
- Merge user settings with defaults using spread operator
- Use Partial<T> for optional configuration properties

```typescript
const classes = { ...defaultClasses, ...settings.classes };
```

#### Arrays and Data Structures
- Use arrays of objects for action definitions
- Each action should have: `name`, `icon`, `title`, `result`, optionally `state`

```typescript
const defaultActions: Action[] = [
  {
    name: "bold",
    icon: '<svg>...</svg>',
    title: "Bold",
    state: (): boolean => queryCommandState("bold"),
    result: (): void => exec("bold"),
  },
  // ...
];
```

#### Event Handling
- Use inline event handlers for simple cases (`oninput`, `onclick`)
- Use `addEventListener` helper for complex handlers
- Handle edge cases (e.g., check `sel.rangeCount` before using selection)

```typescript
button.onclick = (): void => {
  action.result();
  content.focus();
};
```

#### Error Handling
- Use early returns for guard clauses
- Check preconditions before proceeding
- No try-catch unless dealing with async operations or external APIs
- Use TypeScript's strict null checks effectively

```typescript
if (!sel.rangeCount) return;
const value = element?.textContent ?? '';
```

### CSS

#### Naming
- All classes use `nanotext-` prefix
- Use kebab-case for class names
- Descriptive names based on purpose (`nanotext-actionbar`, `nanotext-button-selected`)

#### Structure
- Group related selectors
- Use modern CSS features (`:has()`, CSS nesting where supported)
- Keep specificity low (single class selectors preferred)

```css
.nanotext-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
}

.nanotext-button-selected {
  background-color: #f0f0f0;
}
```

#### Layout
- Use flexbox for layouts
- Prefer modern CSS properties (`fit-content`, `sticky`)
- Mobile-friendly with `flex-wrap`

### Testing

#### Test Structure
- Use Vitest as the test framework
- Test files should end with `.test.ts`
- Group related tests with `describe` blocks
- Use descriptive test names

```typescript
import { describe, it, expect } from 'vitest';
import { init } from './nanotext';

describe('Nanotext Editor', () => {
  it('should initialize with default settings', () => {
    const editor = init({ element: document.body });
    expect(editor).toBeDefined();
  });
});
```

## Architecture Patterns

### Initialization Pattern
The editor follows a single initialization pattern:

```typescript
const editor = init({
  element: document.getElementById('editor') as HTMLElement,
  content: '<div>Initial content...</div>',
  onChange: (html: string): void => { /* handle changes */ },
  actions: ['bold', 'italic'], // optional
  classes: { /* custom classes */ }, // optional
});
```

### Action System
- Actions are objects with name, icon, title, result, and optional state
- Users can provide action names (strings) or full action objects
- Default actions are merged with user-provided actions

### DOM Structure
- Editor consists of actionbar + content area
- Actionbar contains buttons for each action
- Content area is contentEditable div

## Common Patterns

### Adding New Actions
1. Add to `defaultActions` array with required properties
2. Include icon as inline SVG
3. Implement `result()` function using `exec()` helper
4. Add `state()` if action has toggle state (bold, italic, etc.)

### Working with execCommand
- Use the `exec()` helper wrapper
- First parameter is command name, second is optional value
- Common commands: `bold`, `italic`, `formatBlock`, `insertOrderedList`

### CSS Class Management
- Store class names in `defaultClasses` object
- Allow users to override via settings
- Apply classes using `className` property

## Migration Notes

This project was forked from Pell and is being renamed to Nanotext. When making changes:
- Use `nanotext-` prefix for new CSS classes (not `pell-`)
- Update any remaining `pell` references to `nanotext`
- Maintain backward compatibility where reasonable
- Update package.json metadata when making significant changes

## File Naming
- Source files: `nanotext.ts`, `nanotext.css`
- Test files: `nanotext.test.ts`
- Package main points to built files in `dist/`
- Keep example files in `example/` directory

## TypeScript Configuration
- Strict mode enabled
- Target ES2020, module ESNext
- Output directory: `dist/`
- Declaration files generated for TypeScript users
