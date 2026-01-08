// src/parsers/docx/index.ts
import mammoth from 'mammoth';
import { normalizeText } from './normalizer'; // if you have a normalize function
import { extractOpinion,extractFacts, extractApplication,extractPrinciples,extractHeaderAndEntity} from '../extractor/fatwa.extractor'; // the function we wrote above
import { extractLawHeader } from '../extractor/laws.extractor';
import { extractArticles } from '../extractor/laws.extractor';
import { extractPreamble } from '../extractor/laws.extractor';
import { Judgment } from '../types';
import { 
  extractJudgmentHeader, 
  extractPanel, 
  extractJPrinciples,
  extractJFacts,
  extractReasoning, 
  extractRuling 
} from '../extractor/judgment.extractor';


export async function parseFatwaDocx(filePath: string) {

    console.log('[Parser] Starting DOCX parsing:', filePath);
  // 1️⃣ Extract raw text from DOCX
  const { value: fullText } = await mammoth.extractRawText({ path: filePath });

  // 2️⃣ Normalize the text
  const normalizedText = normalizeText(fullText);

  // 3️⃣ Extract header and الجهة
  const { header, entity } = extractHeaderAndEntity(normalizedText);
    if (header) {
    console.log('[Parser] Header extracted', {
      number: header.number,
      year: header.year,
      authority: header.issuing_authority,
    });
  } else {
    console.warn('[Parser] Header missing — document unnumbered');
  }

  // 4️⃣ Extract other parts (you likely already have these)
  const principles = extractPrinciples(normalizedText);
    console.log(`[Parser] Principles extracted: ${principles.length}`);
  const facts = extractFacts(normalizedText);
  facts
    ? console.log('[Parser] Facts extracted')
    : console.warn('[Parser] Facts missing');

  const application = extractApplication(normalizedText);
  application
    ? console.log('[Parser] Application extracted')
    : console.warn('[Parser] Application missing');

  const opinion = extractOpinion(normalizedText);
  opinion
    ? console.log('[Parser] Opinion extracted')
    : console.warn('[Parser] Opinion missing');

  if (header && !header.file_number) {
    console.warn('[Parser][Assumption] file_number not found → null');
  }

  console.log('[Parser] Parsing completed');
  // 5️⃣ Return everything as structured object
  return {
    header,
    entity,
    principles,
    facts,
    application,
    opinion,
    full_text: normalizedText,
  };
}

export async function parseLawDocx(filePath: string) {
  console.log('Parser', `Starting LAW parsing: ${filePath}`);

  const { value } = await mammoth.extractRawText({ path: filePath });
  const fullText = normalizeText(value);

  const header = extractLawHeader(fullText);
  if (!header) {
    console.log('Parser', 'Header not found', 'WARN');
  }

  const articles = extractArticles(fullText);
  console.log('Parser', `Articles extracted: ${articles.length}`);
  // Extract preamble: text before first article
  let preambleText = '';
  const firstArticleMatch = fullText.match(/المادة\s+\d+/);
  if (firstArticleMatch) {
    preambleText = fullText.slice(0, firstArticleMatch.index).trim();
  }
  console.log('[Parser] Extracted preamble Successfull');

  return {
    header,
    articles,
     preamble: preambleText,
    full_text: fullText,
  };
}

export async function parseJudgmentDocx(path: string): Promise<Judgment> {
  // 1. Extract raw text from DOCX
  const { value } = await mammoth.extractRawText({ path });
  const text = value.replace(/\r/g, '');

  // 2. Extract header
  const header = extractJudgmentHeader(text);

  // 3. Validate required fields
  if (!header.case_number || !header.case_year) {
    console.warn('[WARN] Missing case_number or case_year, using defaults');
  }

  // 4. Extract and return all sections
  return {
    header,  // ✅ Fixed - already extracted above
    panel: extractPanel(text) ?? undefined,
    principles: extractJPrinciples(text),
    facts: extractJFacts(text) ?? undefined,
    reasoning: extractReasoning(text) ?? undefined,
    ruling: extractRuling(text) ?? undefined,
    full_text: text,
  };
}