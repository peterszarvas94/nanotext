import { describe, it, expect } from 'vitest';
import { 
  FORMAT_BLOCK, 
  exec, 
  insertImage, 
  defaultActions, 
  defaultClasses 
} from './nanotext.js';

describe('Constants', () => {
  it('FORMAT_BLOCK should be "formatBlock"', () => {
    expect(FORMAT_BLOCK).toBe('formatBlock');
  });
});

describe('defaultActions', () => {
  it('should be an array', () => {
    expect(Array.isArray(defaultActions)).toBe(true);
  });

  it('should have at least 20 actions', () => {
    expect(defaultActions.length).toBeGreaterThanOrEqual(20);
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

  it('should have unique action names', () => {
    const names = defaultActions.map(a => a.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('should include common actions', () => {
    const names = defaultActions.map(a => a.name);
    expect(names).toContain('bold');
    expect(names).toContain('italic');
    expect(names).toContain('underline');
    expect(names).toContain('heading1');
    expect(names).toContain('heading2');
    expect(names).toContain('olist');
    expect(names).toContain('ulist');
    expect(names).toContain('link');
    expect(names).toContain('image');
  });

  it('action with state should have state function', () => {
    const boldAction = defaultActions.find(a => a.name === 'bold');
    expect(boldAction).toHaveProperty('state');
    expect(typeof boldAction.state).toBe('function');
  });
});

describe('defaultClasses', () => {
  it('should have all required class properties', () => {
    expect(defaultClasses).toHaveProperty('actionbar');
    expect(defaultClasses).toHaveProperty('button');
    expect(defaultClasses).toHaveProperty('content');
    expect(defaultClasses).toHaveProperty('selected');
  });

  it('all class names should use nanotext- prefix', () => {
    Object.values(defaultClasses).forEach(className => {
      expect(className).toMatch(/^nanotext-/);
    });
  });

  it('should have correct class names', () => {
    expect(defaultClasses.actionbar).toBe('nanotext-actionbar');
    expect(defaultClasses.button).toBe('nanotext-button');
    expect(defaultClasses.content).toBe('nanotext-content');
    expect(defaultClasses.selected).toBe('nanotext-button-selected');
  });
});

describe('exec', () => {
  it('should be a function', () => {
    expect(typeof exec).toBe('function');
  });

  it('should have default value parameter', () => {
    expect(exec.length).toBe(1); // Only required param is command
  });
});

describe('insertImage', () => {
  it('should be a function', () => {
    expect(typeof insertImage).toBe('function');
  });

  it('should accept exactly one parameter', () => {
    expect(insertImage.length).toBe(1);
  });
});
