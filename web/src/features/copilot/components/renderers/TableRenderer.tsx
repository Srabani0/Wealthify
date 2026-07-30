import React from 'react';

interface TableRendererProps {
  content: string;
}

export const TableRenderer: React.FC<TableRendererProps> = ({ content }) => {
  // Regex to detect markdown tables
  const lines = content.split('\n');
  const tableRows: string[][] = [];
  let isHeaders = true;
  let headers: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Check if line is a table row (starts and ends with pipe)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .split('|')
        .slice(1, -1) // remove empty elements from outer pipes
        .map((cell) => cell.trim());

      // Skip separator rows (e.g. |---|---|)
      if (cells.every((cell) => cell.match(/^[-:]+$/))) {
        isHeaders = false;
        continue;
      }

      if (isHeaders && headers.length === 0) {
        headers = cells;
      } else {
        tableRows.push(cells);
      }
    }
  }

  // If no valid markdown table was parsed, return null
  if (headers.length === 0 || tableRows.length === 0) {
    return null;
  }

  return (
    <div className="w-full my-4 overflow-x-auto rounded-lg border shadow-sm">
      <table className="w-full text-sm text-left text-muted-foreground border-collapse">
        <thead className="text-xs uppercase bg-muted text-foreground font-semibold border-b">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} scope="col" className="px-4 py-3 font-semibold tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {tableRows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="bg-card hover:bg-muted/50 transition-colors"
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-3 font-medium text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default TableRenderer;
