import 'pdfkit';

export type PDFTextOptions = PDFKit.Mixins.TextOptions;
type NamedColor =
  | 'aliceblue'
  | 'antiquewhite'
  | 'aqua'
  | 'aquamarine'
  | 'azure'
  | 'beige'
  | 'bisque'
  | 'black'
  | 'blanchedalmond'
  | 'blue'
  | 'blueviolet'
  | 'brown'
  | 'burlywood'
  | 'cadetblue'
  | 'chartreuse'
  | 'chocolate'
  | 'coral'
  | 'cornflowerblue'
  | 'cornsilk'
  | 'crimson'
  | 'cyan'
  | 'darkblue'
  | 'darkcyan'
  | 'darkgoldenrod'
  | 'darkgray'
  | 'darkgreen'
  | 'darkgrey'
  | 'darkkhaki'
  | 'darkmagenta'
  | 'darkolivegreen'
  | 'darkorange'
  | 'darkorchid'
  | 'darkred'
  | 'darksalmon'
  | 'darkseagreen'
  | 'darkslateblue'
  | 'darkslategray'
  | 'darkslategrey'
  | 'darkturquoise'
  | 'darkviolet'
  | 'deeppink'
  | 'deepskyblue'
  | 'dimgray'
  | 'dimgrey'
  | 'dodgerblue'
  | 'firebrick'
  | 'floralwhite'
  | 'forestgreen'
  | 'fuchsia'
  | 'gainsboro'
  | 'ghostwhite'
  | 'gold'
  | 'goldenrod'
  | 'gray'
  | 'grey'
  | 'green'
  | 'greenyellow'
  | 'honeydew'
  | 'hotpink'
  | 'indianred'
  | 'indigo'
  | 'ivory'
  | 'khaki'
  | 'lavender'
  | 'lavenderblush'
  | 'lawngreen'
  | 'lemonchiffon'
  | 'lightblue'
  | 'lightcoral'
  | 'lightcyan'
  | 'lightgoldenrodyellow'
  | 'lightgray'
  | 'lightgreen'
  | 'lightgrey'
  | 'lightpink'
  | 'lightsalmon'
  | 'lightseagreen'
  | 'lightskyblue'
  | 'lightslategray'
  | 'lightslategrey'
  | 'lightsteelblue'
  | 'lightyellow'
  | 'lime'
  | 'limegreen'
  | 'linen'
  | 'magenta'
  | 'maroon'
  | 'mediumaquamarine'
  | 'mediumblue'
  | 'mediumorchid'
  | 'mediumpurple'
  | 'mediumseagreen'
  | 'mediumslateblue'
  | 'mediumspringgreen'
  | 'mediumturquoise'
  | 'mediumvioletred'
  | 'midnightblue'
  | 'mintcream'
  | 'mistyrose'
  | 'moccasin'
  | 'navajowhite'
  | 'navy'
  | 'oldlace'
  | 'olive'
  | 'olivedrab'
  | 'orange'
  | 'orangered'
  | 'orchid'
  | 'palegoldenrod'
  | 'palegreen'
  | 'paleturquoise'
  | 'palevioletred'
  | 'papayawhip'
  | 'peachpuff'
  | 'peru'
  | 'pink'
  | 'plum'
  | 'powderblue'
  | 'purple'
  | 'red'
  | 'rosybrown'
  | 'royalblue'
  | 'saddlebrown'
  | 'salmon'
  | 'sandybrown'
  | 'seagreen'
  | 'seashell'
  | 'sienna'
  | 'silver'
  | 'skyblue'
  | 'slateblue'
  | 'slategray'
  | 'slategrey'
  | 'snow'
  | 'springgreen'
  | 'steelblue'
  | 'tan'
  | 'teal'
  | 'thistle'
  | 'tomato'
  | 'turquoise'
  | 'violet'
  | 'wheat'
  | 'white'
  | 'whitesmoke'
  | 'yellow'
  | 'yellowgreen';

type HexColor = `#${string}`;
export type PDFColor = HexColor | NamedColor | PDFKit.Mixins.ColorValue;
export type PDFDocumentOptions = PDFKit.PDFDocumentOptions;
export type PDFFontSource = PDFKit.Mixins.PDFFontSource;

export type Ensure<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Side definitions
 *
 * - To define all sides, use a single value
 * - To define up-down left-right, use a `[Y, X]` array
 * - To define each side, use `[top, right, bottom, left]` array
 * - Or `{vertical: SideValue, horizontal: SideValue}`
 * - Or `{top: SideValue, right: SideValue, bottom: SideValue, left: SideValue}`
 **/
export type SideDefinition<T> =
  | T
  | [T, T]
  | [T, T, T, T]
  | { vertical: T; horizontal: T }
  | { top: T; right: T; bottom: T; left: T };

export type ExpandedSideDefinition<T = any> = { top: T; right: T; bottom: T; left: T };

/** Measurement of size **/
export type Size = number | `${number}` | `${number}${'em' | 'px' | 'in' | 'cm' | 'mm' | 'pt'}`;

/** Measurement of how wide something is, false means 0 and true means 1 **/
export type Wideness = Size | boolean;

/** Configuration for a table cell **/
export interface Cell
  extends Omit<
    PDFTextOptions,
    | 'align' // We use our own alignment logic
    | 'width' // It doesn't make sense in this context to use text-width as that is something computed by the table
    | 'height' // It doesn't make sense in this context to use text-height as that is something computed by the table
    | 'stroke' // This is replaced by `textStroke` to control rendering and thickness
  > {
  /** How many columns this cell covers, follows the same logic as HTML `colspan` **/
  colspan?: number;
  /** How many rows this cell covers **/
  rowspan?: number;

  /**
   * The text value
   *
   * This will be cast to a string
   * unless it is a boolean in which it will be converted to ✓ (tick) or ✕ (cross)
   *
   * Note that null and undefined are not rendered but the cell is still outlined
   */
  value?: any;

  /** The padding for the cell **/
  padding?: SideDefinition<Wideness>;
  /** The border for the cell **/
  border?: SideDefinition<Wideness>;
  /** The border colors for the cell **/
  borderColor?: SideDefinition<PDFColor>;

  /** The color of the cell **/
  backgroundColor?: PDFColor;

  /** The color of the text **/
  textColor?: PDFColor;
  /** The text stroke **/
  textStroke?: Wideness;
  /** The text stroke **/
  textStrokeColor?: PDFColor;

  /**
   * The alignment of the text (center, justify, left, right)
   *
   * To define both horizontal and vertical as centered use 'center'
   * Otherwise define the x and y alignments in an object
   */
  align?: 'center' | { x?: 'left' | 'center' | 'right'; y?: 'top' | 'center' | 'bottom' };

  /** The font of the cell **/
  font?: string;
  /** The font family of the cell **/
  fontFamily?: string;
  /** The font size of the cell **/
  fontSize?: Size;

  /** Render the debug lines of the cell **/
  debug?: boolean;

  /** Override the position of the cell **/
  x?: number;
  /** Override the position of the cell **/
  y?: number;
}

export interface ExtendedPage extends PDFKit.PDFPage {
  contentWidth: number;
  contentHeight: number;
}

export type NonUndefined<T> = T extends undefined ? never : T;
