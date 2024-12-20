import { ExtendedPDFDocument } from './document';
import { Cell, Ensure, ExpandedSideDefinition, PDFColor, PDFTextOptions, SideDefinition, Wideness } from './types';
import { normalizeSides } from './utils';

export type PDFTableOpts = {
  cols?: number;
  rowsPerPage?: number;
  x?: number | undefined;
  y?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  border?: SideDefinition<Wideness>;
  borderColor?: SideDefinition<PDFColor>;
  /** Any config you wish to apply to all cells **/
  defaultCell?: Cell;
};

export class PDFTable {
  private cellWidth: number;
  private readonly cellHeight: number;
  private currCellX: number;
  private currCellY: number;

  private cellClaim: Set<string>;
  private readonly x: number;
  private readonly y: number;
  private readonly border: ExpandedSideDefinition<number>;
  private readonly borderColor: ExpandedSideDefinition<PDFColor>;

  constructor(
    readonly document: ExtendedPDFDocument,
    readonly opts: PDFTableOpts
  ) {
    this.x = opts.x ?? this.document.x;
    this.y = opts.y ?? this.document.y;

    if (!opts.width) {
      if (opts.x) opts.width = this.document.page.contentWidth - opts.x;
      else opts.width = this.document.page.contentWidth;
    }
    if (!opts.height) {
      if (opts.y) opts.height = this.document.page.contentHeight - opts.y;
      else opts.height = this.document.page.contentHeight;
    }

    if (this.opts.cols === 0) throw new Error('cols must be greater than 0');
    this.cellWidth = this.opts.cols ? this.opts.width! / this.opts.cols : 60; // Default cell width

    if (this.opts.rowsPerPage === 0) throw new Error('rowsPerPage must be greater than 0');
    this.cellHeight = this.opts.rowsPerPage ? this.opts.height! / this.opts.rowsPerPage : 20; // Default cell height

    this.border = normalizeSides(this.opts.border, 1, this.document.unitToPt.bind(this.document));
    this.borderColor = normalizeSides(this.opts.borderColor);

    this.currCellX = 0;
    this.currCellY = 0;
    this.cellClaim = new Set();
  }

  private initCellWidth(cols: number) {
    if (this.opts.cols === undefined) {
      this.opts.cols = cols;
      if (this.opts.cols === 0) throw new Error('cols must be greater than 0');
      this.cellWidth = this.opts.width! / this.opts.cols;
    }
  }

  /**
   * Draws a row of cells to the table
   *
   * @example
   * ```
   * doc.table({cols: 3})
   *    .row(['A', 'B', 'C'])
   *    .row(['D', 'E', 'F'])
   * ```
   * would render a 3x2 table
   *
   * |  A  |  B  |  C  |
   * | --- | --- | --- |
   * |  D  |  E  |  F  |
   *
   * @param cells - The cells to render
   * @param defaultCell - Any config you wish to apply to all cells in this row
   */
  row(cells: Iterable<Cell | Cell['value']>, defaultCell: Cell = {}) {
    // If you haven't provided any 'cols' indication,
    // then we will use the first non-empty row to infer it (assuming it's an array) else it will use the default
    if (Array.isArray(cells)) {
      const colspan = cells.reduce((acc, _cell) => {
        const cellColspan =
          _cell === null || _cell === undefined || typeof _cell !== 'object' ? undefined : _cell.colspan;

        return acc + Math.max(1, Math.floor(cellColspan ?? defaultCell.colspan ?? this.opts.defaultCell?.colspan ?? 1));
      }, 0);
      if (colspan > 0) this.initCellWidth(colspan);
    }

    const startY = this.currCellY;
    this.currCellX = 0;

    let maxY = this.y;

    for (let _cell of cells) {
      if (_cell === null || _cell === undefined || typeof _cell !== 'object') _cell = { value: _cell };
      const cell: Ensure<Cell, 'colspan' | 'rowspan'> = {
        rowspan: 1,
        colspan: 1,
        ...this.opts.defaultCell,
        ...defaultCell,
        ..._cell,
      };

      // spanning can only be integer
      cell.rowspan = Math.max(1, Math.floor(cell.rowspan));
      cell.colspan = Math.max(1, Math.floor(cell.colspan));

      // Find first available cell
      while (this.cellClaim.has(`${this.currCellX},${this.currCellY}`)) {
        this.currCellX++;
        if (this.opts.cols && this.currCellX >= this.opts.cols) {
          this.currCellX = 0;
          this.currCellY++;
        }
      }

      maxY = Math.max(maxY, this.renderCell(cell));

      // Claim any spanning cells
      for (let i = 0; i < cell.colspan; i++) {
        for (let j = 0; j < cell.rowspan; j++) {
          if (i !== 0 || j !== 0) this.cellClaim.add(`${this.currCellX + i},${this.currCellY + j}`);
        }
      }
      // Move to next cell
      this.currCellX++;
    }

    this.currCellY++;

    // Draw borders
    this.renderBorder(
      this.border,
      this.borderColor,
      this.x,
      this.y + startY * this.cellHeight,
      this.opts.width!,
      maxY - (this.y + startY * this.cellHeight),
      { top: startY === 0, right: true, bottom: false, left: true }
    );

    this.document.x = this.x;
    this.document.y = maxY;
    this.document.moveTo(this.document.x, this.document.y);

    return this;
  }

  /**
   * Indicates to the table that it is finished
   *
   * so that it can do any cleanup such as drawing the bottom border
   *
   * Not strictly required to call but may leave your table in an undesirable state
   *
   * @returns the document
   */
  end() {
    // Draw bottom border
    this.renderBorder(this.border, this.borderColor, this.x, this.document.y, this.opts.width!, 0, {
      top: false,
      right: false,
      bottom: true,
      left: false,
    });

    return this.document;
  }

  private renderCell({
    border: _border,
    borderColor: _borderColor,
    padding: _padding,
    align: _align,
    fontSize: _fontSize,
    textStroke: _textStroke,
    textColor,
    textStrokeColor,
    backgroundColor,
    value,
    colspan,
    rowspan,
    font,
    fontFamily,
    debug,
    x,
    y,
    ...cell
  }: Ensure<Cell, 'colspan' | 'rowspan'>) {
    // Set font temporarily
    const rollbackFont = this.document.currentFont;
    const rollbackFontSize = this.document.currentFontSize;
    const rollbackFontFamily = this.document.currentFontFamily;
    if (font) this.document.font(font, fontFamily);
    const fontSize = this.document.unitToPt(_fontSize);
    if (fontSize) this.document.fontSize(fontSize);

    // Normalize options
    const border = normalizeSides(_border, 1, this.document.unitToPt.bind(this.document));
    const borderColor = normalizeSides(_borderColor, undefined);
    const padding = normalizeSides(_padding, '0.25em', this.document.unitToPt.bind(this.document));
    const align = _align === undefined || typeof _align === 'string' ? { x: _align, y: _align } : _align;
    const textStroke = this.document.unitToPt(_textStroke);

    // Default alignment
    if (align.x === undefined) align.x = 'left';
    if (align.y === undefined) align.y = 'center';

    if (typeof value === 'boolean') value = value ? '\u2713' : '\u2715';
    if (value !== null && value !== undefined) value = String(value);

    // Render the cell borders
    const rectHeight = this.cellHeight * rowspan;
    const rectWidth = this.cellWidth * colspan;
    const posX = x ?? this.x + this.currCellX * this.cellWidth;
    const posY = y ?? this.y + this.currCellY * this.cellHeight;

    if (backgroundColor !== undefined) {
      this.document.save().rect(posX, posY, rectWidth, rectHeight).fill(backgroundColor).restore();
    }
    this.renderBorder(border, borderColor, posX, posY, rectWidth, rectHeight);

    // Render text

    // Compute bounds of text
    const textRectWidth = rectWidth - padding.left - padding.right;
    const textRectHeight = rectHeight - padding.top - padding.bottom;

    const textOptions: PDFTextOptions = {
      align: align.x,
      ellipsis: true,
      lineBreak: false,
      stroke: textStroke > 0,
      fill: true,
      ...cell,
      width: textRectWidth,
      height: textRectHeight,
    };

    // Compute actual position of text based on alignment
    const textHeight = this.document.heightOfString(value ?? '', textOptions);
    const yOffset = (textRectHeight - textHeight) * (align.y === 'bottom' ? 1 : align.y === 'center' ? 0.5 : 0);

    const textPosX = posX + padding.left;
    const textPosY = posY + padding.top;

    // Debug viewer
    if (debug) {
      this.document.save().dash(1, { space: 1 }).lineWidth(1).strokeOpacity(0.3);
      // Debug text bounds
      if (value?.length) this.document.rect(textPosX, textPosY + yOffset, textRectWidth, textHeight).stroke('red');
      // Debug text allocated space
      this.document.rect(textPosX, textPosY, textRectWidth, textRectHeight).stroke('blue');
      this.document.restore();
    }

    if (value?.length) {
      this.document.save();
      if (textColor !== undefined) this.document.fillColor(textColor);
      if (textStroke > 0) this.document.lineWidth(textStroke);
      if (textStrokeColor !== undefined) this.document.strokeColor(textStrokeColor);
      this.document.text(value, textPosX, textPosY + yOffset, textOptions);
      this.document.restore();
    }
    if (font || fontSize) this.document.font(rollbackFont, rollbackFontFamily, rollbackFontSize);

    // Return bottom Y position of cell
    return posY + rectHeight;
  }

  private renderBorder(
    border: ExpandedSideDefinition<number>,
    borderColor: ExpandedSideDefinition<PDFColor | undefined>,
    x: number,
    y: number,
    width: number,
    height: number,
    mask?: Partial<Record<keyof ExpandedSideDefinition, boolean>>
  ): void {
    const computedBorder = Object.fromEntries(
      Object.entries(border).map(([k, v]) => [k, mask && !mask[k as never] ? 0 : v])
    ) as ExpandedSideDefinition<number>;

    if ([computedBorder.right, computedBorder.bottom, computedBorder.left].every(val => val === computedBorder.top)) {
      if (computedBorder.top > 0) {
        this.document.save().lineWidth(computedBorder.top).rect(x, y, width, height);
        if (borderColor.top) this.document.strokeColor(borderColor.top);
        this.document.stroke().restore();
      }
    } else {
      // Top
      if (computedBorder.top > 0) {
        this.document
          .save()
          .lineWidth(computedBorder.top)
          .polygon([x, y], [x + width, y]);
        if (borderColor.top) this.document.strokeColor(borderColor.top);
        this.document.stroke().restore();
      }
      // Right
      if (computedBorder.right > 0) {
        this.document
          .save()
          .lineWidth(computedBorder.right)
          .polygon([x + width, y], [x + width, y + height]);
        if (borderColor.right) this.document.strokeColor(borderColor.right);
        this.document.stroke().restore();
      }
      // Bottom
      if (computedBorder.bottom > 0) {
        this.document
          .save()
          .lineWidth(computedBorder.bottom)
          .polygon([x + width, y + height], [x, y + height]);
        if (borderColor.bottom) this.document.strokeColor(borderColor.bottom);
        this.document.stroke().restore();
      }
      // Left
      if (computedBorder.left > 0) {
        this.document
          .save()
          .lineWidth(computedBorder.left)
          .polygon([x, y + height], [x, y]);
        if (borderColor.left) this.document.strokeColor(borderColor.left);
        this.document.stroke().restore();
      }
    }
  }
}