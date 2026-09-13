/**
 * Folds text to the form it is searched in: lowercase, æ → ae, ø → o, and accents stripped
 * (å → a, é → e, ü → u). Applied to both the stored text and the query, so "Åkerveien",
 * "akerveien" and "ÅKERVEIEN" all match.
 *
 * SQLite's own lower() and LIKE only fold ASCII, and FTS5's remove_diacritics handles å but
 * not æ/ø, which don't decompose in Unicode. Registered as an SQL function in db.ts.
 */
export function fold(text: string): string {
  return text
    .toLocaleLowerCase('nb')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Escapes LIKE wildcards so "%" and "_" in user input match literally (use with ESCAPE '\'). */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
