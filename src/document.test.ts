import path from 'path';
import { beforeEach, describe, test, vi } from 'vitest';
import { ExtendedPDFDocument } from './document';
import { PDFTable } from './table';
import { Size } from './types';

describe('constructor', () => {
  test('font', ({ expect }) => {
    const doc = new ExtendedPDFDocument({
      fontSize: 16,
      font: 'Courier-Bold',
      fontFamily: 'Courier',
      autoFirstPage: false,
    });
    expect(doc.currentFontSize).toEqual(16);
    expect(doc.currentFont).toEqual('Courier-Bold');
    expect(doc.currentFontFamily).toEqual('Courier');
  });
});

describe('addPage', () => {
  test('content alignment', ({ expect }) => {
    const addContent = vi.spyOn(ExtendedPDFDocument.prototype, 'addContent');
    const doc = new ExtendedPDFDocument({ autoFirstPage: false });

    doc.on('pageAdded', () => {
      expect(doc.x).toEqual(0);
      expect(doc.y).toEqual(0);
    });

    doc.addPage({ size: [500, 500], margins: 100 });

    expect(addContent).toHaveBeenCalledWith('1 0 0 -1 100 400 cm');
    expect(addContent).toHaveBeenCalledWith('0 0 m');
    expect(doc.x).toEqual(0);
    expect(doc.y).toEqual(0);

    // Make sure the event emission was checked
    expect.assertions(6);
  });
});

test('currentFontSize', ({ expect }) => {
  const doc = new ExtendedPDFDocument();
  expect(doc.currentFontSize).toEqual(12);
  doc.fontSize(16);
  expect(doc.currentFontSize).toEqual(16);
});

describe('font', () => {
  test('basic', ({ expect }) => {
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

  test('lazyRegisterFont', ({ expect }) => {
    const doc = new ExtendedPDFDocument({
      lazyRegisterFont: function (doc, src) {
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
});

test('fontSize', ({ expect }) => {
  const doc = new ExtendedPDFDocument();
  expect(doc.currentFontSize).toEqual(12);
  doc.fontSize(15);
  expect(doc.currentFontSize).toEqual(15);
});

test('table', ({ expect }) => {
  const doc = new ExtendedPDFDocument();
  const table = doc.table();
  expect(table).toBeInstanceOf(PDFTable);
});

describe('sizeToPoint', () => {
  let doc: ExtendedPDFDocument;
  beforeEach(() => {
    doc = new ExtendedPDFDocument({
      font: 'Helvetica',
      fontSize: 12,
      size: [250, 500],
      margin: { top: 10, right: 5, bottom: 10, left: 5 },
    });
  });

  test.for([
    [1, 1],
    ['1', 1],
    [true, 1],
    [false, 0],
    ['1em', 12],
    ['1in', 72],
    ['1px', 0.75],
    ['1cm', 28.3465],
    ['1mm', 2.83465],
    ['1pc', 12],
    ['1ex', 11.1],
    ['1ch', 6.672],
    ['1vw', 2.5],
    ['1vh', 5],
    ['1vmin', 2.5],
    ['1vmax', 5],
    ['1%', 0.12],
    ['1pt', 1],
  ] as [Size, number][])('%o -> %s', ([size, expected], { expect }) => {
    expect(doc.sizeToPoint(size)).toBeCloseTo(expected, 4);
  });

  test('1rem -> 12', ({ expect }) => {
    doc.fontSize(15);
    expect(doc.sizeToPoint('1em')).toEqual(15);
    expect(doc.sizeToPoint('1rem')).toEqual(12);
  });
});
