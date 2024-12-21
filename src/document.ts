import PDFDocument from 'pdfkit';
import { PDFPage } from './page';
import { PDFTable, PDFTableOpts } from './table';
import { ExtendedPDFDocumentOptions, PDFFontSource, Size } from './types';

export class ExtendedPDFDocument extends PDFDocument {
  /** The documents current font **/
  currentFont!: PDFFontSource;
  /** The documents current font family (if provided) **/
  currentFontFamily?: string;

  // @ts-ignore Complaints about margin is irrelevant as it isn't used internally
  public page: PDFPage;

  // @ts-ignore Complaints about margin is irrelevant as it isn't used internally
  public options: ExtendedPDFDocumentOptions;

  // @ts-ignore Initialized internally
  private _fontSize: number;
  // @ts-ignore Initialized internally
  private _registeredFonts: object;
  // @ts-ignore Initialized internally
  private _ctm: number[];
  // @ts-ignore Initialized internally
  private _pageBuffer: any;
  // @ts-ignore Initialized internally
  private _root: any;

  constructor(options: ExtendedPDFDocumentOptions = {}) {
    super(options as never);
    this.options = options;

    if (options.fontSize !== undefined) this.fontSize(options.fontSize);
  }

  // @ts-ignore Complaints about margin is irrelevant as it isn't used internally
  addPage(options?: ExtendedPDFDocumentOptions) {
    if (!options) options = this.options;

    // end the current page if needed
    if (!this.options.bufferPages) this.flushPages();

    // create a page object
    this.page = new PDFPage(this, options);
    this._pageBuffer.push(this.page);

    // add the page to the object store
    const pages = this._root.data.Pages.data;
    pages.Kids.push(this.page.dictionary);
    pages.Count++;

    // flip PDF coordinate system so that the origin is in
    // the top left rather than the bottom left
    this._ctm = [1, 0, 0, 1, 0, 0];
    // Position the document at the content origin
    this.transform(1, 0, 0, -1, this.page.margins.left, this.page.height - this.page.margins.bottom);

    // reset x and y coordinates
    this.x = 0;
    this.y = 0;
    this.moveTo(0, 0);

    this.emit('pageAdded');
    return this;
  }

  /** The documents current font size (in points) **/
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

  fontSize(size: Size): this {
    return super.fontSize(this.sizeToPoint(size));
  }

  table(opts: PDFTableOpts = {}) {
    return new PDFTable(this, opts);
  }

  /**
   * Convert a {@link Size} into a point measurement
   *
   * @param size - The string to convert
   * @param defaultValue - The default value when undefined
   * @param page - The page used for computing font sizes
   */
  sizeToPoint(
    size: Size | boolean | undefined,
    defaultValue: Size | boolean | undefined = 0,
    page = this.page
  ): number {
    if (typeof defaultValue !== 'number') defaultValue = this.sizeToPoint(defaultValue);
    if (size === undefined) return defaultValue;
    if (typeof size === 'number') {
      if (size > 0) return size;
      return defaultValue;
    }
    if (typeof size === 'boolean') return Number(size);

    const match = String(size).match(/((\d+)?(\.\d+)?)(em|in|px|cm|mm|pc|ex|ch|rem|vw|vmin|vmax|%|pt)?/);
    if (!match) throw new Error(`Unsupported size '${size}'`);
    let multiplier: number;
    switch (match[4]) {
      case 'em':
        multiplier = this.currentFontSize;
        break;
      case 'in':
        multiplier = UNIT_CONVERSIONS.IN_TO_PT;
        break;
      case 'px':
        multiplier = UNIT_CONVERSIONS.PX_TO_IN * UNIT_CONVERSIONS.IN_TO_PT;
        break;
      case 'cm':
        multiplier = UNIT_CONVERSIONS.CM_TO_IN * UNIT_CONVERSIONS.IN_TO_PT;
        break;
      case 'mm':
        multiplier = UNIT_CONVERSIONS.MM_TO_CM * UNIT_CONVERSIONS.CM_TO_IN * UNIT_CONVERSIONS.IN_TO_PT;
        break;
      case 'pc':
        multiplier = UNIT_CONVERSIONS.PC_TO_PT;
        break;
      case 'ex':
        multiplier = this.currentLineHeight();
        break;
      case 'ch':
        multiplier = this.widthOfString('0');
        break;
      case 'rem':
        multiplier = 12; // Default font size
        break;
      case 'vw':
        multiplier = page.width / 100;
        break;
      case 'vh':
        multiplier = page.height / 100;
        break;
      case 'vmin':
        multiplier = Math.min(page.width, page.height) / 100;
        break;
      case 'vmax':
        multiplier = Math.max(page.width, page.height) / 100;
        break;
      case '%':
        multiplier = this.currentFontSize / 100;
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
  CM_TO_IN: 25.2 / 64, // 1CM = 25.2/64 IN
  PX_TO_IN: 1 / 96, // 1 PX = 1/96 IN
  IN_TO_PT: 72, // 1 IN = 72 PT
  PC_TO_PT: 12, // 1 PC = 12 PT
};
