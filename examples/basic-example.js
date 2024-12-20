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
const doc = new PDFDocument({ margin: 30, size: 'A4' });

doc.registerFont('lato', path.join(__dirname, './Lato.ttc'), 'Lato-Regular').font('lato');

// to save on server
doc.pipe(fs.createWriteStream('./basic-example.pdf'));

// -----------------------------------------------------------------------------------------------------
// Simple Table
// -----------------------------------------------------------------------------------------------------

// By default, will fill all the remaining width of the page
doc
  .table()
  .row(['Country', 'Conversion rate', 'Trend'])
  .row(['Switzerland', '12%', '+1.12%'])
  .row(['France', '67%', '-0.98%'])
  .row(['England', '33%', '+4.44%']);

// by default the document cursor will be moved to the bottom left cell of the table
doc.moveDown(); // so move it down by one line for the next table

// -----------------------------------------------------------------------------------------------------
// Complex Table with Object
// -----------------------------------------------------------------------------------------------------
doc
  .table({ width: 400, height: 100, rowsPerPage: 3, defaultCell: { fontSize: 16, align: 'center' } })
  .row(
    [
      { value: 'Name', colspan: 2 },
      { value: 'Country', rowspan: 2 },
    ],
    { fontSize: 20, backgroundColor: 'pink' }
  )
  .row(['First Name', 'Last Name'], { backgroundColor: 'hotpink' })
  .row([
    'Jake',
    'Holland',
    { value: 'UK', textColor: 'red', textStroke: '1px', textStrokeColor: 'white', backgroundColor: 'blue' },
  ]);

// if your run express.js server:
// HTTP response only to show pdf
// doc.pipe(res);

// done
doc.end();
