import { Judgment, JudgmentHeader, JudgmentPrinciple } from "../types";
import * as crypto from 'crypto';
import * as mammoth from 'mammoth';
import { normalizeArabicDate } from "../Docx/normalizer";


// src/parsers/Docx/extractors.ts
// src/parsers/Judgment/extractors.ts



export function extractJudgmentHeader(text: string): JudgmentHeader {
  let issuing_authority: string | undefined = undefined;
  let court_name = 'غير محدد';
  let case_type: string | undefined = undefined;
  let case_number = 0;
  let case_year = 0;
  let session_date: string | undefined = undefined;
  let technical_office: number | undefined = undefined;
  let volume_number: number | undefined = undefined;
  let page_number: number | undefined = undefined;
  let rule_number: number | undefined = undefined;
  let reference_number: string | undefined = undefined;

  // 1. Extract first line: "جمهورية مصر العربية - محكمة النقض - مدني"
  const firstLineMatch = text.match(/^(.+?)\s*-\s*(.+?)\s*-\s*(.+?)(?:\n|$)/);
  if (firstLineMatch) {
    issuing_authority = firstLineMatch[1].trim();
    court_name = firstLineMatch[2].trim();
    case_type = firstLineMatch[3].trim();
  }

  // 2. Extract case number and year
  const caseMatch = text.match(/الطعن\s+رقم\s+(\d+)\s+لسنة\s+(\d+)/);
  if (caseMatch) {
    case_number = parseInt(caseMatch[1], 10);
    case_year = parseInt(caseMatch[2], 10);
  }

  // 3. Extract session date
  const sessionMatch = text.match(/تاريخ\s+الجلسة\s*:\s*(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
  if (sessionMatch) {
    const day = sessionMatch[1].padStart(2, '0');
    const month = sessionMatch[2].padStart(2, '0');
    const year = sessionMatch[3];
    session_date = `${year}-${month}-${day}`;
  }

  // 4. Extract technical info
  const techMatch = text.match(/مكتب\s+فني\s+(\d+)/);
  if (techMatch) {
    technical_office = parseInt(techMatch[1], 10);
  }

  const volumeMatch = text.match(/رقم\s+الجزء\s+(\d+)/);
  if (volumeMatch) {
    volume_number = parseInt(volumeMatch[1], 10);
  }

  const pageMatch = text.match(/رقم\s+الصفحة\s+(\d+)/);
  if (pageMatch) {
    page_number = parseInt(pageMatch[1], 10);
  }

  const ruleMatch = text.match(/القاعدة\s+رقم\s+(\d+)/);
  if (ruleMatch) {
    rule_number = parseInt(ruleMatch[1], 10);
  }

  // 5. Extract reference number
  const refMatch = text.match(/الرقم\s+المرجعي\s*:\s*(\d+)/);
  if (refMatch) {
    reference_number = refMatch[1].trim();
  }

  return {
    issuing_authority,
    court_name,
    case_type,
    case_number,
    case_year,
    session_date,
    technical_office,
    volume_number,
    page_number,
    rule_number,
    reference_number,
  };
}

export function extractPanel(text: string): string | undefined {
  // Extract: "الهيئة\nبرئاسة السيد المستشار/..."
  const match = text.match(/الهيئة\s*\n([\s\S]*?)(?=\n\s*المبادئ القانونية|\n\s*مبدأ رقم)/);
  return match ? match[1].trim() : undefined;
}

export function extractJPrinciples(text: string): JudgmentPrinciple[] {
  const principles: JudgmentPrinciple[] = [];

  // Step 1: Extract section between "المبادئ القانونية" and "الوقائع"
  const sectionMatch = text.match(/المبادئ\s*القانونية([\s\S]*?)الوقائع/);
  
  if (!sectionMatch) {
    console.log('[WARN] Principles section not found');
    return principles;
  }

  const sectionText = sectionMatch[1];

  // Step 2: Split by "مبدأ رقم"
  const parts = sectionText.split(/مبدأ\s*رقم\s*/);

  // Step 3: Process each part (skip first empty part)
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Extract number from start (e.g., "1\n\nالشركاء...")
    const numMatch = part.match(/^(\d+)\s*([\s\S]*)/);
    
    if (numMatch) {
      const number = parseInt(numMatch[1], 10);
      const principleText = numMatch[2].trim();
      
      if (principleText) {
        principles.push({
          number,
          text: principleText,
        });
      }
    }
  }

  console.log(`[INFO] Extracted ${principles.length} principle(s)`);
  return principles;
}
export function extractJFacts(text: string): string | undefined {
  // Extract: "الوقائع\n...text..." until "الحيثيات"
  const match = text.match(/الوقائع\s*\n([\s\S]*?)(?=\n\s*الحيثيات)/);
  return match ? match[1].trim() : undefined;
}

export function extractReasoning(text: string): string | undefined {
  // Extract: "الحيثيات\n...text..." until end or "لما تقدم"
  const match = text.match(/الحيثيات\s*\n([\s\S]*?)(?=ولما\s+تقدم|لما\s+تقدم|$)/);
  return match ? match[1].trim() : undefined;
}

export function extractRuling(text: string): string | undefined {
  // Extract: "لما تقدم..." or "ولما تقدم..." until end
  const match = text.match(/(و?لما\s+تقدم[\s\S]*?)$/);
  return match ? match[1].trim() : undefined;
}