import { describe, test } from 'vitest';
import { ExtendedPDFDocument } from './document';

describe('PDFPage Mixins', () => {
  test('contentWidth', ({ expect }) => {
    const doc = new ExtendedPDFDocument({ size: [100, 100], margin: { top: 5, right: 10, bottom: 15, left: 20 } });
    const page = doc.page;
    expect(page.contentWidth).toBe(70);
  });
  test('contentHeight', ({ expect }) => {
    const doc = new ExtendedPDFDocument({ size: [100, 100], margin: { top: 5, right: 10, bottom: 15, left: 20 } });
    const page = doc.page;
    expect(page.contentHeight).toBe(80);
  });
});
