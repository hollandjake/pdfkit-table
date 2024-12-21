import path from 'path';
import { afterEach, describe, test, vi } from 'vitest';
import { ExtendedPDFDocument } from './document';
import { PDFTable } from './table';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PDFPage Mixins', () => {
  describe('are loaded correctly', () => {
    test('in auto first page', ({ expect }) => {
      const pdfDocument = new ExtendedPDFDocument({ autoFirstPage: true });
      const page = pdfDocument.page;
      expect(page).toHaveProperty('contentWidth');
      expect(page).toHaveProperty('contentHeight');
    });
    test('in addPage', ({ expect }) => {
      const pdfDocument = new ExtendedPDFDocument({ autoFirstPage: false });
      const page = pdfDocument.addPage().page;
      expect(page).toHaveProperty('contentWidth');
      expect(page).toHaveProperty('contentHeight');
    });
  });
});

test('content alignment', ({ expect }) => {
  const addContent = vi.spyOn(ExtendedPDFDocument.prototype, 'addContent');
  const doc = new ExtendedPDFDocument();

  expect(addContent).toHaveBeenCalledWith('1 0 0 -1 72 720 cm');
  expect(addContent).toHaveBeenCalledWith('0 0 m');
  expect(doc.x).toBe(0);
  expect(doc.y).toBe(0);
});

test('font', ({ expect }) => {
  const doc = new ExtendedPDFDocument({ font: 'Helvetica' });
  expect(doc.currentFont).toEqual('Helvetica');
  expect(doc.currentFontFamily).toEqual(undefined);
  expect(doc.currentFontSize).toEqual(12);

  doc.font('Courier', 15);
  expect(doc.currentFont).toEqual('Courier');
  expect(doc.currentFontFamily).toEqual(undefined);
  expect(doc.currentFontSize).toEqual(15);

  doc.font('Courier', 'Family');
  expect(doc.currentFont).toEqual('Courier');
  expect(doc.currentFontFamily).toEqual('Family');
  expect(doc.currentFontSize).toEqual(15);
});

test('fontSize', ({ expect }) => {
  const doc = new ExtendedPDFDocument();
  expect(doc.currentFontSize).toEqual(12);
  doc.fontSize(15);
  expect(doc.currentFontSize).toEqual(15);
});

test('lazyRegisterFont', ({ expect }) => {
  const doc = new ExtendedPDFDocument({
    lazyRegisterFont(src: string, doc: ExtendedPDFDocument) {
      if (src === 'lato') {
        doc.registerFont('lato', path.join(__dirname, '../__test__/Lato.ttc'), 'Lato-Regular');
      }
    },
  });

  const registerFontSpy = vi.spyOn(doc, 'registerFont');

  doc.font('lato');
  expect(doc.currentFont).toEqual('lato');
  expect(registerFontSpy).toHaveBeenCalled();

  // Check that the font isn't re-registered
  doc.font('Helvetica');
  doc.font('lato');
  expect(registerFontSpy).toHaveBeenCalledOnce();
});

test('table', ({ expect }) => {
  const doc = new ExtendedPDFDocument();
  const table = doc.table();
  expect(table).toBeInstanceOf(PDFTable);
});
