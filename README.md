# Parchment

A simple and lightweight WYSIWYG text editor for web with no dependencies.

Forked from [pell](https://github.com/jaredreich/pell).

## Usage

```javascript
import { init } from 'parchment';
import 'parchment/dist/parchment.css';

const editor = init({
  element: document.getElementById('editor'),
  onChange: html => console.log(html),
  defaultParagraphSeparator: 'p',
  styleWithCSS: false,
  actions: ['bold', 'italic', 'underline']
});
```

## Options

- `element` (HTMLElement, required) - Container element for the editor
- `onChange` (Function, required) - Callback triggered when content changes
- `defaultParagraphSeparator` (String, default: 'p') - Element injected via Enter key
- `styleWithCSS` (Boolean, default: false) - Use inline styles instead of HTML tags
- `actions` (Array, optional) - List of actions to include (defaults to all actions)
- `classes` (Object, optional) - Custom CSS class names

## Available Actions

bold, italic, underline, strikethrough, heading1, heading2, paragraph, quote, olist, ulist, code, line, link, image, justifyLeft, justifyCenter, justifyRight, justifyFull, subscript, superscript, undo, redo

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## License

MIT