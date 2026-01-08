import { normalizeText } from '../Docx/normalizer';

import { Principle } from '../types';

export function parseFatwa(rawText: string) {
  const text = normalizeText(rawText);

  const principles = extractPrinciples(text);
  const sections = splitBySections(text);

  return {
    principles,
    facts: sections.facts || null,
    application: sections.application || null,
    opinion: sections.opinion || null,
    full_text: text,
  };
}

export function extractHeaderAndEntity(fullText: string) {
  const text = normalizeText(fullText);

  // Regex explanation:
  // 1. Issuing authority: (.*?)
  // 2. Fatwa number: الفتوى رقم (\d+)
  // 3. Year: لسنة (\d+)
  // 4. Optional file number: (?: رقم الملف ([\d\/]+))?
  // 5. Issue date: بتاريخ ([\d-]+)
  // 6. Session date: تاريخ الجلسة ([\d-]+)
  const headerRegex =
    /^(.*?)\s*-\s*الفتوى رقم\s*(\d+)\s*لسنة\s*(\d+)(?:\s*رقم الملف\s*([\d\/]+))?\s*بتاريخ\s*([\d-]+)\s*تاريخ الجلسة\s*([\d-]+)/;

  const headerLine = text.split('\n')[0];
  const headerMatch = headerLine.match(headerRegex);

  const header = headerMatch
    ? {
        issuing_authority: headerMatch[1].trim(),
        number: Number(headerMatch[2]),
        year: Number(headerMatch[3]),
        file_number: headerMatch[4] ? headerMatch[4].trim() : null,
        issue_date: headerMatch[5],
        session_date: headerMatch[6],
      }
    : null;

  // -------- الجهة --------
  const entityMatch = text.match(/الجهة\s*\n([\s\S]*?)(?:\n\n|موضوع الفتوى)/);
  const entity = entityMatch ? normalizeText(entityMatch[1]) : null;

  return { header, entity };
}

export function extractPrinciples(text: string): Principle[] {
  const principles: Principle[] = [];

  const regex = /مبدأ\s+(\d+)\s*([\s\S]*?)(?=مبدأ\s+\d+|$)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    principles.push({
      number: Number(match[1]),
      text: match[2].trim(),
    });
  }

  return principles;
}
// Extract facts
export function extractFacts(text: string) {
  const factsMatch = text.match(/الوقائع\s*([\s\S]*?)(?=\nالتطبيق|\nالرأى|\n$)/);
  return factsMatch ? factsMatch[1].trim() : null;
}

// Extract application
export function extractApplication(text: string) {
  const appMatch = text.match(/التطبيق\s*([\s\S]*?)(?=\nالرأى|\n$)/);
  return appMatch ? appMatch[1].trim() : null;
}

// Extract opinion
export function extractOpinion(text: string) {
  const opinionMatch = text.match(/الرأى\s*([\s\S]*)$/);
  return opinionMatch ? opinionMatch[1].trim() : null;
}
export function splitBySections(text: string) {
  const sections: Record<string, string> = {};

  const patterns = [
    { key: 'facts', regex: /الوقائع\s*/ },
    { key: 'application', regex: /التطبيق\s*/ },
    { key: 'opinion', regex: /الرأى\s*/ },
  ];

  let remaining = text;

  for (let i = 0; i < patterns.length; i++) {
    const { key, regex } = patterns[i];
    const match = remaining.match(regex);

    if (!match) continue;

    const start = match.index!;
    const end =
      i + 1 < patterns.length
        ? remaining.search(patterns[i + 1].regex)
        : -1;

    sections[key] =
      end === -1
        ? remaining.substring(start).replace(regex, '').trim()
        : remaining.substring(start, end).replace(regex, '').trim();
  }

  return sections;
}
