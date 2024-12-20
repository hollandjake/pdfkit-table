export const PageMixins = {
  contentWidth: {
    get(this: PDFKit.PDFPage): number {
      return this.width - this.margins.left - this.margins.right;
    },
  },
  contentHeight: {
    get(this: PDFKit.PDFPage): number {
      return this.height - this.margins.top - this.margins.bottom;
    },
  },
};
