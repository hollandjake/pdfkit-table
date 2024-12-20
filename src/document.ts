import PDFDocument from 'pdfkit';
import { PageMixins } from './mixins';
import { PDFTable, PDFTableOpts } from './table';
import { ExtendedPage, PDFDocumentOptions, PDFFontSource, Size } from './types';

export type ExtendedPDFDocumentTypes = PDFDocumentOptions & {
  lazyRegisterFont?: (src: string, document: ExtendedPDFDocument) => void;
};

export class ExtendedPDFDocument extends PDFDocument {
  currentFont!: PDFFontSource;
  currentFontFamily?: string;

  public page: ExtendedPage;

  options: ExtendedPDFDocumentTypes;

  // @ts-ignore Initialized internally
  private _fontSize: number;
  // @ts-ignore Initialized internally
  private _registeredFonts: object;

  constructor(options: ExtendedPDFDocumentTypes = {}) {
    super(options);
    this.options = options;

    // @ts-ignore Page is set internally
    const page = this.page;
    // @ts-ignore this is used to silence typescript
    this.page = page;

    // Move the page to be at the content origin so that we don't have to keep offsetting the document margins
    const contentAligner = () => {
      this.translate(this.page.margins.left, this.page.margins.top);
      this.moveTo(0, 0);
      this.x = 0;
      this.y = 0;
    };
    this.on('pageAdded', contentAligner);
    if (page) contentAligner();

    // Inject the mixins to the page
    const mixin = () => {
      Object.defineProperties(this.page, PageMixins);
      // @ts-ignore Page is set internally
      Object.defineProperties(this.page.constructor, PageMixins);
    };
    if (page) mixin();
    else this.once('pageAdded', mixin);
  }

  get currentFontSize() {
    return this._fontSize;
  }

  font(src: PDFFontSource, family?: string | number, size?: number): this {
    if (typeof family === 'number') {
      size = family;
      family = undefined;
    }

    if (
      this.currentFont === src &&
      (!family || this.currentFontFamily === family) &&
      (!size || this.currentFontSize === size)
    ) {
      return this;
    }

    this.currentFont = src;
    this.currentFontFamily = family;

    if (this.options.lazyRegisterFont && typeof src === 'string' && !(src in this._registeredFonts)) {
      this.options.lazyRegisterFont(src, this);
    }

    if (family) return super.font(src, family, size);
    else return super.font(src, size);
  }

  table(opts: PDFTableOpts = {}) {
    return new PDFTable(this, opts);
  }

  /**
   * Convert a unit string into a point measurement
   *
   * @param unit - The string to convert
   * @private
   */
  unitToPt(unit: Size | boolean | undefined) {
    if (unit === undefined) return 0;
    if (typeof unit === 'boolean') return Number(unit);
    if (typeof unit === 'number') return unit;

    const match = String(unit).match(/((\d+)?(\.\d+)?)(em|px|in|cm|mm|pt)?/);
    if (!match) throw new Error(`Invalid unit '${unit}'`);
    let multiplier: number;
    switch (match[4]) {
      case 'em':
        multiplier = this.currentFontSize;
        break;
      case 'px':
        multiplier = UNIT_CONVERSIONS.PX_TO_PT;
        break;
      case 'in':
        multiplier = UNIT_CONVERSIONS.IN_TO_PT;
        break;
      case 'cm':
        multiplier = UNIT_CONVERSIONS.CM_TO_PX * UNIT_CONVERSIONS.PX_TO_PT;
        break;
      case 'mm':
        multiplier = UNIT_CONVERSIONS.MM_TO_CM * UNIT_CONVERSIONS.CM_TO_PX * UNIT_CONVERSIONS.PX_TO_PT;
        break;
      case 'pt':
      default:
        multiplier = 1;
    }

    return multiplier * Number(match[1]);
  }
}

const UNIT_CONVERSIONS = {
  MM_TO_CM: 1000,
  CM_TO_PX: 37.7952755906,
  PX_TO_PT: 0.74999943307122,
  IN_TO_PT: 1 / 72,
};
