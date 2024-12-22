import { describe, test } from 'vitest';
import { ExtendedPDFDocument } from './document';
import { ExpandedSideDefinition, ExtendedPDFDocumentOptions } from './types';

describe('constructor', () => {
  describe('margins', () => {
    test.for([
      ['defaults', {}, { top: 72, right: 72, bottom: 72, left: 72 }],
      ['unified', { margin: '2in' }, { top: 144, right: 144, bottom: 144, left: 144 }],
      ['expanded', { margin: { top: 1, right: 2, bottom: 3, left: 4 } }, { top: 1, right: 2, bottom: 3, left: 4 }],
      ['based on font size', { fontSize: 16, margin: '1em' }, { top: 16, right: 16, bottom: 16, left: 16 }],
      ['based on document size', { size: [250, 250], margin: '1vw' }, { top: 2.5, right: 2.5, bottom: 2.5, left: 2.5 }],
    ] as [string, ExtendedPDFDocumentOptions, ExpandedSideDefinition<number>][])(
      '%s',
      ([_name, opts, expected], { expect }) => {
        const doc = new ExtendedPDFDocument(opts);
        expect(doc.page.margins).toEqual(expected);
      }
    );
  });

  test('font', ({ expect }) => {
    const doc = new ExtendedPDFDocument({ fontSize: 16, font: 'Courier-Bold', fontFamily: 'Courier' });
    expect(doc.currentFontSize).toEqual(16);
    expect(doc.currentFont).toEqual('Courier-Bold');
    expect(doc.currentFontFamily).toEqual('Courier');
  });
});

test('contentWidth', ({ expect }) => {
  const doc = new ExtendedPDFDocument({ size: [100, 100], margin: { top: 5, right: 10, bottom: 15, left: 20 } });
  const page = doc.page;
  expect(page.contentWidth).toEqual(70);
});
test('contentHeight', ({ expect }) => {
  const doc = new ExtendedPDFDocument({ size: [100, 100], margin: { top: 5, right: 10, bottom: 15, left: 20 } });
  const page = doc.page;
  expect(page.contentHeight).toEqual(80);
});
