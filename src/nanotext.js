const DEFAULT_PARAGRAPH_SEPARATOR_STRING = "defaultParagraphSeparator";
const FORMAT_BLOCK = "formatBlock";

function addEventListener(parent, type, listener) {
  return parent.addEventListener(type, listener);
}

function appendChild(parent, child) {
  return parent.appendChild(child);
}

function createElement(tag) {
  return document.createElement(tag);
}

function queryCommandState(command) {
  return document.queryCommandState(command);
}

function queryCommandValue(command) {
  return document.queryCommandValue(command);
}

function exec(command, value = null) {
  return document.execCommand(command, false, value);
}

function insertImage(url) {
  exec("insertImage", url);
}

const defaultActions = [
  {
    name: "bold",
    // lucide icon 'bold'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bold-icon lucide-bold"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/></svg>',
    title: "Bold",
    state: () => queryCommandState("bold"),
    result: () => exec("bold"),
  },
  {
    name: "italic",
    // lucide icon 'italic'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-italic-icon lucide-italic"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>',
    title: "Italic",
    state: () => queryCommandState("italic"),
    result: () => exec("italic"),
  },
  {
    name: "underline",
    // lucide icon 'underline'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-underline-icon lucide-underline"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/></svg>',
    title: "Underline",
    state: () => queryCommandState("underline"),
    result: () => exec("underline"),
  },
  {
    name: "strikethrough",
    // lucide icon 'strikethrough'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-strikethrough-icon lucide-strikethrough"><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></svg>',
    title: "Strikethrough",
    state: () => queryCommandState("strikethrough"),
    result: () => exec("strikethrough"),
  },
  {
    name: "heading1",
    // lucide icon 'heading-1'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading1-icon lucide-heading-1"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>',
    title: "Heading 1",
    result: () => exec(FORMAT_BLOCK, "<h1>"),
  },
  {
    name: "heading2",
    // lucide icon 'heading-2'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading2-icon lucide-heading-2"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>',
    title: "Heading 2",
    result: () => exec(FORMAT_BLOCK, "<h2>"),
  },
  // TODO: more headings
  {
    name: "paragraph",
    // lucide icon 'pilcrow'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pilcrow-icon lucide-pilcrow"><path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/></svg>',
    title: "Paragraph",
    result: () => exec(FORMAT_BLOCK, "<p>"),
  },
  {
    name: "quote",
    // lucide icon 'quote'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote-icon lucide-quote"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/></svg>',
    title: "Quote",
    result: () => exec(FORMAT_BLOCK, "<blockquote>"),
  },
  {
    name: "olist",
    // lucide icon 'list-ordered'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-ordered-icon lucide-list-ordered"><path d="M11 5h10"/><path d="M11 12h10"/><path d="M11 19h10"/><path d="M4 4h1v5"/><path d="M4 9h2"/><path d="M6.5 20H3.4c0-1 2.6-1.925 2.6-3.5a1.5 1.5 0 0 0-2.6-1.02"/></svg>',
    title: "Ordered List",
    result: () => exec("insertOrderedList"),
  },
  {
    name: "ulist",
    // lucide icon 'list'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-icon lucide-list"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>',
    title: "Unordered List",
    result: () => exec("insertUnorderedList"),
  },
  {
    name: "code",
    // lucide icon 'code'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-icon lucide-code"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>',
    title: "Code",
    result: () => exec(FORMAT_BLOCK, "<pre>"),
  },
  {
    name: "line",
    // lucide icon 'minus'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus-icon lucide-minus"><path d="M5 12h14"/></svg>',
    title: "Horizontal Line",
    result: () => exec("insertHorizontalRule"),
  },
  {
    name: "link",
    // lucide icon 'link'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    title: "Link",
    result: () => {
      const url = window.prompt("Enter the link URL");
      if (url) exec("createLink", url);
    },
  },
  {
    name: "image",
    // lucide icon 'image'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-icon lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
    title: "Image",
    result: () => {
      const url = window.prompt("Insert image url");
      if (url) insertImage(url);
    },
  },
  {
    name: "justifyLeft",
    // lucide icon 'text-align-start'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text-align-start-icon lucide-text-align-start"><path d="M21 5H3"/><path d="M15 12H3"/><path d="M17 19H3"/></svg>',
    title: "Justify left",
    result: () => exec("justifyLeft"),
  },
  {
    name: "justifyCenter",
    // lucide icon 'text-align-center'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text-align-center-icon lucide-text-align-center"><path d="M21 5H3"/><path d="M17 12H7"/><path d="M19 19H5"/></svg>',
    title: "Justify center",
    result: () => exec("justifyCenter"),
  },
  {
    name: "justifyRight",
    // lucide icon 'text-align-end'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text-align-end-icon lucide-text-align-end"><path d="M21 5H3"/><path d="M21 12H9"/><path d="M21 19H7"/></svg>',
    title: "Justify right",
    result: () => exec("justifyRight"),
  },
  {
    name: "justifyFull",
    // lucide icon 'text-align-justify'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-text-align-justify-icon lucide-text-align-justify"><path d="M3 5h18"/><path d="M3 12h18"/><path d="M3 19h18"/></svg>',
    title: "Justify full",
    result: () => exec("justifyFull"),
  },
  {
    name: "subscript",
    // lucide icon 'subscript'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-subscript-icon lucide-subscript"><path d="m4 5 8 8"/><path d="m12 5-8 8"/><path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"/></svg>',
    title: "Subscript",
    result: () => exec("subscript"),
  },
  {
    name: "superscript",
    // lucide icon 'superscript'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-superscript-icon lucide-superscript"><path d="m4 19 8-8"/><path d="m12 19-8-8"/><path d="M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06"/></svg>',
    title: "Superscript",
    result: () => exec("superscript"),
  },
  {
    name: "undo",
    // lucide icon 'undo'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-undo-icon lucide-undo"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>',
    title: "Undo",
    result: () => exec("undo"),
  },
  {
    name: "redo",
    // lucide icon 'redo'
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-redo-icon lucide-redo"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>',
    title: "Redo",
    result: () => exec("redo"),
  },
  // TODO:?
  // "fontName",
  // "fontSize",
  // "indent",
  // "outdent",
  // "clearFormatting",
];

const defaultClasses = {
  actionbar: "nanotext-actionbar",
  button: "nanotext-button",
  content: "nanotext-content",
  selected: "nanotext-button-selected",
};

function init(settings = {}) {
  const element =
    settings.element || document.getElementById("editor") || document.body;
  const onChange = settings.onChange || (() => {});
  const handleImageClick = settings.handleImageClick;

  const actions = settings.actions
    ? settings.actions.map((action) => {
        if (typeof action === "string") {
          const defaultAction = defaultActions.find((a) => a.name === action);
          // Override image action with custom handler if provided
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
        // Override image action with custom handler if provided
        if (defaultAction.name === "image" && handleImageClick) {
          return {
            ...defaultAction,
            result: handleImageClick,
          };
        }
        return defaultAction;
      });

  const classes = { ...defaultClasses, ...settings.classes };

  const paragraphSeparator =
    settings[DEFAULT_PARAGRAPH_SEPARATOR_STRING] || "p";

  const actionbar = createElement("div");
  actionbar.className = classes.actionbar;
  appendChild(element, actionbar);

  const content = createElement("div");
  if (settings.content) content.innerHTML = settings.content;
  element.content = content;
  content.contentEditable = true;
  content.className = classes.content;
  content.oninput = ({ target: { firstChild } }) => {
    if (firstChild && firstChild.nodeType === 3)
      exec(FORMAT_BLOCK, `<${paragraphSeparator}>`);
    else if (content.innerHTML === "<br>") content.innerHTML = "";
    onChange(content.innerHTML);
  };
  content.onkeydown = (event) => {
    if (
      event.key === "Enter" &&
      queryCommandValue(FORMAT_BLOCK) === "blockquote"
    ) {
      setTimeout(() => exec(FORMAT_BLOCK, `<${paragraphSeparator}>`), 0);
    }
  };
  appendChild(element, content);

  actions.forEach((action) => {
    const button = createElement("button");
    button.className = classes.button;
    button.innerHTML = action.icon;
    button.title = action.title;
    button.setAttribute("type", "button");
    button.onclick = () => action.result() && content.focus();

    if (action.state) {
      const handler = () =>
        button.classList[action.state() ? "add" : "remove"](classes.selected);
      addEventListener(content, "keyup", handler);
      addEventListener(content, "mouseup", handler);
      addEventListener(button, "click", handler);
    }

    appendChild(actionbar, button);
  });

  if (settings.styleWithCSS) exec("styleWithCSS");
  exec(DEFAULT_PARAGRAPH_SEPARATOR_STRING, paragraphSeparator);
  return element;
}

export { FORMAT_BLOCK, queryCommandState, exec, insertImage, init };
