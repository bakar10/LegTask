export function normalizeText(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}


export async function normalizeArabicDate(raw?: string): Promise<string | undefined> {
  if (!raw) return undefined;

  // matches: 31 / 1 / 1990 OR 31/1/1990
  const match = raw.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/);
  if (!match) return undefined;

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];

  return `${year}-${month}-${day}`;
}




