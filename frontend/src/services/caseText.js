const LOWERCASE_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'com', 'para', 'por', 'o', 'a', 'os', 'as',
  'um', 'uma', 'no', 'na', 'nos', 'nas', 'ao', 'aos', 'entre', 'ate', 'até', 'sem', 'sob',
  'sobre', 'per', 'pela', 'pelas', 'pelo', 'pelos', 'ante', 'apos', 'após', 'desde',
]);

export function titleCase(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      if (/^[A-Za-zÀ-ÿ]/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(' ');
}

export function normalizeCase(value, mode) {
  if (value == null) return value;
  const s = String(value);
  if (!s) return s;
  if (mode === 'upper') return s.toUpperCase();
  if (mode === 'title') return titleCase(s);
  return s;
}
