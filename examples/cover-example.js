/**
 * You need to install on terminal (node.js):
 * -----------------------------------------------------
 * $ npm install @hollandjake/pdfkit-table
 * -----------------------------------------------------
 * Run this file:
 * -----------------------------------------------------
 * $ node basic-example.js
 * -----------------------------------------------------
 *
 */

const fs = require('fs');
const PDFDocument = require('@hollandjake/pdfkit-table');
const path = require('path');

// start pdf document
const doc = new PDFDocument({ size: 'A4' });

doc.registerFont('lato', path.join(__dirname, './Lato.ttc'), 'Lato-Regular');
doc.registerFont('lato-bold', path.join(__dirname, './Lato.ttc'), 'Lato-Bold');
doc.font('lato')

doc.pipe(fs.createWriteStream('./cover-example.pdf'));

doc
  .table({ defaultCell: { align: 'center' } })
  .row(
    [
      { value: 'Name', colspan: 2 },
      { value: 'Country', rowspan: 2 },
    ],
    { fontSize: 15, font: 'lato-bold', backgroundColor: 'lightgray' }
  )
  .row(['First Name', 'Last Name'], { backgroundColor: 'lightgray' })
  .row([
    'Jake',
    'Holland',
    { value: 'UK', textColor: 'red', textStroke: '1px', textStrokeColor: 'white', backgroundColor: 'blue' },
  ]);

doc.end();
