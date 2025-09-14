// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock for getBoundingClientRect in JSDOM
Object.defineProperty(window.document, 'createRange', {
  value: () => {
    const range = new Range();

    range.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      toJSON: () => {},
    });

    range.getClientRects = () => ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: () => ({
        next: () => ({ value: undefined, done: true })
      }),
    });

    return range;
  },
});
