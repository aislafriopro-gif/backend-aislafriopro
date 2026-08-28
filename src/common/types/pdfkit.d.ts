declare module 'pdfkit' {
  interface PDFDocumentOptions {
    margin?: number | { top?: number; bottom?: number; left?: number; right?: number };
    size?: string | [number, number];
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: Date;
    };
    compress?: boolean;
    tag?: string;
    displayTitle?: boolean;
    autoFirstPage?: boolean;
    bufferPages?: boolean;
    layout?: 'portrait' | 'landscape';
  }

  interface ImageOptions {
    width?: number;
    height?: number;
    scale?: number;
    fit?: [number, number];
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'center' | 'bottom';
    x?: number;
    y?: number;
  }

  interface TextOptions {
    width?: number;
    height?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
    indent?: number;
    lineGap?: number;
    paragraphGap?: number;
    lineBreak?: boolean;
    continued?: boolean;
    ellipsis?: boolean;
    columns?: number;
    columnGap?: number;
    columnWidth?: number;
    characterSpacing?: number;
    wordSpacing?: number;
    features?: string[];
    language?: string;
    direction?: 'ltr' | 'rtl';
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    
    x: number;
    y: number;
    page: { width: number; height: number };
    
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    moveDown(lines?: number): this;
    moveUp(lines?: number): this;
    font(src: string | Buffer, family?: string): this;
    fontSize(size: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    strokeColor(color: string): this;
    lineWidth(width: number): this;
    image(src: string | Buffer, x?: number, y?: number, options?: ImageOptions): this;
    addPage(options?: PDFDocumentOptions): this;
    
    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
    
    end(): this;
  }

  export = PDFDocument;
}