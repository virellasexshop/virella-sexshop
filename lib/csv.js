function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function countDelimiter(line, delimiter) {
  let count = 0;
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') quoted = !quoted;
    if (!quoted && line[index] === delimiter) count += 1;
  }

  return count;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  return countDelimiter(firstLine, ";") > countDelimiter(firstLine, ",") ? ";" : ",";
}

export function parseCsv(text) {
  const source = String(text || "").replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(source);
  const matrix = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) matrix.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell.trim());
  if (row.some((value) => value !== "")) matrix.push(row);

  if (quoted) throw new Error("A planilha possui aspas abertas em uma das linhas.");
  if (matrix.length < 2) throw new Error("A planilha precisa ter cabeçalho e pelo menos um produto.");

  const headers = matrix[0].map(normalizeHeader);
  if (new Set(headers).size !== headers.length) {
    throw new Error("A planilha possui colunas repetidas.");
  }

  const rows = matrix.slice(1).map((values, rowIndex) => {
    const item = { __line: rowIndex + 2 };
    headers.forEach((header, index) => {
      if (header) item[header] = values[index] ?? "";
    });
    return item;
  });

  return { headers, rows, delimiter };
}
