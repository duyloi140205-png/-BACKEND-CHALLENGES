const { parse } = require('csv-parse');
const { Readable } = require('stream');

/**
 * Parse CSV buffer thành array of objects
 * @param {Buffer} buffer
 * @returns {Promise<Array>}
 */
const parseCsvBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse({
      columns: true,        // dùng dòng đầu làm header
      skip_empty_lines: true,
      trim: true,
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve(records));

    const readable = Readable.from(buffer);
    readable.pipe(parser);
  });
};

/**
 * Convert array of objects thành CSV string
 * @param {Array} data
 * @param {Array} columns - ['col1', 'col2', ...]
 * @returns {string}
 */
const toCsvString = (data, columns) => {
  const header = columns.join(',');
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
      // Escape dấu phẩy và nháy kép
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  return [header, ...rows].join('\n');
};

module.exports = { parseCsvBuffer, toCsvString };
