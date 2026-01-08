export interface Principle {
  number: number;
  text: string;
}
// types.ts
export interface Fatwa {
  header: FatwaHeader | null;
  entity: string | null;
  principles: any[];
  facts: string | null;
  application: string | null;
  opinion: string | null;
  full_text: string;
}
// types.ts
export interface FatwaHeader {
  issuing_authority: string;
  number: number;
  year: number;
  issue_date?: string;
  session_date?: string;
  file_number?: string;
}

export interface LawHeader {
  issuing_authority: string;     // "جمهورية مصر العربية"
  law_number: number;            // 6
  law_year: number              // 2022
  issue_date?: string;
  president_name?: string;
  publish_date?: string;
  effective_date?: string;
  gazette_ref?: string;
  title: string;

}
export interface LawArticle {
  number: string;   // "1", "2", "3"
  text: string;
}
export interface Law {
  header: LawHeader;
  preamble?: string;
  articles: LawArticle[];
  full_text: string;
}


export interface JudgmentPrinciple {
  number: number;
  text: string;
}



export interface JudgmentPrinciple {
  number: number;
  text: string;
}

export interface JudgmentHeader {
  issuing_authority?: string;      // جمهورية مصر العربية
  court_name: string;              // محكمة النقض
  case_type?: string;              // مدني
  case_number: number;             // 1784
  case_year: number;               // 54
  session_date?: string;           // 1990-01-31
  technical_office?: number;       // 41
  volume_number?: number;          // 1
  page_number?: number;            // 366
  rule_number?: number;            // 67
  reference_number?: string;       // 10232
}

export interface Judgment {
  header: JudgmentHeader;
  panel?: string;
  principles: JudgmentPrinciple[];
  facts?: string;
  reasoning?: string;
  ruling?: string;
  full_text: string;
}