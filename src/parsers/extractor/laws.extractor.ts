import { LawHeader } from '../types';
import { LawArticle } from '../types';
// src/parsers/law/index.ts

import { Law } from '../types';
import * as mammoth from 'mammoth';




export function extractLawHeader(text: string): LawHeader | null {
  const header: Partial<LawHeader> = {};

  // 1️⃣ Issuing authority
  if (/جمهورية مصر العربية/.test(text)) {
    header.issuing_authority = 'جمهورية مصر العربية';
  }

  // 2️⃣ Law number & year (REQUIRED)
  const lawMatch = text.match(/قانون\s+رقم\s+(\d+)\s+لسنة\s+(\d{4})/);
  if (!lawMatch) return null;

  header.law_number = Number(lawMatch[1]);
  header.law_year = Number(lawMatch[2]);
// 3️⃣ Title (AFTER "بشأن" — stop before "الجريدة الرسمية")
const titleMatch = text.match(/بشأن\s+([^\n]+)/);
if (titleMatch) {
  header.title = titleMatch[1]
    .replace(/الجريدة الرسمية.*$/, '')
    .trim();
}


  // 4️⃣ Gazette reference (FULL LINE)
  // Example:
  // الجريدة الرسمية 3 مكرر (هـ)
  const gazetteMatch = text.match(/(الجريدة الرسمية[^\n]+)/);
  if (gazetteMatch) {
    header.gazette_ref = gazetteMatch[1].trim();
  }

  // 5️⃣ President name (AFTER "توقيع")
  // Example:
  // توقيع : عبد الفتاح السيسي - رئيس الجمهورية
  const presidentMatch = text.match(/توقيع\s*[:\-]?\s*([^\n\-]+)/);
  if (presidentMatch) {
    header.president_name = presidentMatch[1].trim();
  }

  // 6️⃣ Dates (optional – keep if present)
  const issueMatch = text.match(/الصادر بتاريخ\s+(\d{4}-\d{2}-\d{2})/);
  if (issueMatch) header.issue_date = issueMatch[1];

  const publishMatch = text.match(/نشر بتاريخ\s+(\d{4}-\d{2}-\d{2})/);
  if (publishMatch) header.publish_date = publishMatch[1];

// 6️⃣ Effective date (accept اعتبارا / إعتبارا)
    const effectiveMatch = text.match(/يعمل به\s+(?:اعتبارا|إعتبارا)\s+من\s+(\d{4}-\d{2}-\d{2})/);
   if (effectiveMatch) {
    header.effective_date = effectiveMatch[1];
    }


  return header as LawHeader;
}

// src/parsers/law/extractArticles.ts


export function extractArticles(text: string): LawArticle[] {
  const articles: LawArticle[] = [];

  // Match “المادة X” followed by text until next “المادة” or end
  const articleRegex = /المادة\s+(\d+)(?:\s+[\w\s]*)?\n([\s\S]*?)(?=المادة\s+\d+|$)/g;

  let match: RegExpExecArray | null;
  while ((match = articleRegex.exec(text)) !== null) {
    const number = match[1];
    const body = match[2].trim();
    articles.push({ number, text: body });
  }

  return articles;
}


export async function parseLawDocx(path: string): Promise<Law> {
  const { value } = await mammoth.extractRawText({ path });
  const text = value.replace(/\r/g, ''); // normalize line endings

  const header = extractLawHeader(text);
  const articles = extractArticles(text);

  return {
    header: header!,
    articles,
    full_text: text,
  };
}
export async function extractPreamble(text: string): Promise<string | null> {
  const match = text.match(/([\s\S]*?)(?=المادة\s+1)/);
  if (!match) return null;

  const preamble = match[1].trim();
  return preamble.length ? preamble : null;
}

