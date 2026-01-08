import { parseFatwaDocx, parseLawDocx } from '../src/parsers/Docx/index';
import { insertFatwa } from '../src/config/db/insertFatwas';
import { insertLaw } from '../src/config/db/insertlaws';
import { parseJudgmentDocx } from '../src/parsers/Docx/index';
import { insertJudgment } from '../src/config/db/insertJudgment';
import crypto from 'crypto';  // ✅ Correct import
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Judgment } from '../src/parsers/types';



type DocumentType = 'fatwa' | 'law' | 'judgment';

interface ProcessingResult {
  file: string;
  type: DocumentType;
  status: 'inserted' | 'duplicate' | 'skipped' | 'error';
  id?: number;
  message: string;
}

interface Summary {
  total: number;
  inserted: number;
  duplicates: number;
  skipped: number;
  errors: number;
}



function getDocxFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    console.log(`[WARN] Directory not found: ${directory}`);
    return [];
  }

  return fs.readdirSync(directory)
    .filter(file => file.endsWith('.docx') && !file.startsWith('~$'))
    .map(file => path.join(directory, file));
}

function printDivider() {
  console.log('='.repeat(60));
}

function printSummary(summary: Summary) {
  console.log('\n');
  printDivider();
  console.log('PROCESSING SUMMARY');
  printDivider();
  console.log(`Total Processed: ${summary.total}`);
  console.log(`Inserted:        ${summary.inserted}`);
  console.log(`Duplicates:      ${summary.duplicates}`);
  console.log(`Skipped:         ${summary.skipped}`);
  console.log(`Errors:          ${summary.errors}`);
  printDivider();
}



async function processFatwa(filePath: string): Promise<ProcessingResult> {
  const fileName = path.basename(filePath);
  console.log(`[Fatwa] Processing: ${fileName}`);

  try {
    const parsed = await parseFatwaDocx(filePath);

    if (!parsed.header) {
      console.log(`[Fatwa] SKIPPED: ${fileName} - Missing header`);
      return { file: fileName, type: 'fatwa', status: 'skipped', message: 'Missing header' };
    }

  
    const fatwaForDb = {
      ...parsed,
      header: {
        issuing_authority: parsed.header.issuing_authority,
        number: parsed.header.number,
        year: parsed.header.year,
        file_number: parsed.header.file_number ?? undefined,
        issue_date: parsed.header.issue_date ?? undefined,
        session_date: parsed.header.session_date ?? undefined,
      },
    };

   
    await insertFatwa(fatwaForDb);

    console.log(`[Fatwa] PROCESSED: ${parsed.header.number}/${parsed.header.year}`);
    return { 
      file: fileName, 
      type: 'fatwa', 
      status: 'inserted', 
      message: `Processed Fatwa ${parsed.header.number}/${parsed.header.year}` 
    };

  } catch (err: any) {
    console.log(`[Fatwa] ERROR: ${fileName} - ${err.message}`);
    return { file: fileName, type: 'fatwa', status: 'error', message: err.message };
  }
}

async function processLaw(filePath: string): Promise<ProcessingResult> {
  const fileName = path.basename(filePath);
  console.log(`[Law] Processing: ${fileName}`);

  try {
    const parsed = await parseLawDocx(filePath);

    if (!parsed.header) {
      console.log(`[Law] SKIPPED: ${fileName} - Missing header`);
      return { file: fileName, type: 'law', status: 'skipped', message: 'Missing header' };
    }

    // Normalize header for database
    const lawForDb = {
      ...parsed,
      header: {
        issuing_authority: parsed.header.issuing_authority,
        number: parsed.header.law_number,
        year: parsed.header.law_year,
        issue_date: parsed.header.issue_date,
        publish_date: parsed.header.publish_date,
        effective_date: parsed.header.effective_date,
        gazette_ref: parsed.header.gazette_ref ?? undefined,
        title: parsed.header.title ?? undefined,
        president_name: parsed.header.president_name ?? undefined,
      },
      preamble: parsed.preamble ?? null,
    };

    await insertLaw(lawForDb);

    console.log(`[Law] INSERTED: Law ${parsed.header.law_number}/${parsed.header.law_year}`);
    return { file: fileName, type: 'law', status: 'inserted', message: 'Inserted successfully' };

  } catch (err: any) {
    console.log(`[Law] ERROR: ${fileName} - ${err.message}`);
    return { file: fileName, type: 'law', status: 'error', message: err.message };
  }
}

async function processJudgment(filePath: string): Promise<ProcessingResult> {
  const fileName = path.basename(filePath);
  console.log(`[Judgment] Processing: ${fileName}`);

  try {
    const parsed = await parseJudgmentDocx(filePath);

    if (!parsed.header.case_number || !parsed.header.case_year) {
      console.log(`[Judgment] SKIPPED: ${fileName} - Missing case number/year`);
      return { file: fileName, type: 'judgment', status: 'skipped', message: 'Missing case number/year' };
    }

    const id = await insertJudgment(parsed);

    if (id) {
      console.log(`[Judgment] INSERTED: Case ${parsed.header.case_number}/${parsed.header.case_year} (ID: ${id})`);
      return { file: fileName, type: 'judgment', status: 'inserted', id, message: 'Inserted successfully' };
    } else {
      console.log(`[Judgment] DUPLICATE: Case ${parsed.header.case_number}/${parsed.header.case_year}`);
      return { file: fileName, type: 'judgment', status: 'duplicate', message: 'Already exists' };
    }

  } catch (err: any) {
    console.log(`[Judgment] ERROR: ${fileName} - ${err.message}`);
    return { file: fileName, type: 'judgment', status: 'error', message: err.message };
  }
}

async function processFatwas(directory: string): Promise<ProcessingResult[]> {
  const files = getDocxFiles(directory);
  const results: ProcessingResult[] = [];

  if (files.length === 0) {
    console.log(`[Fatwa] No files found in: ${directory}`);
    return results;
  }

  console.log(`[Fatwa] Found ${files.length} file(s)`);

  for (const file of files) {
    const result = await processFatwa(file);
    results.push(result);
  }

  return results;
}

async function processLaws(directory: string): Promise<ProcessingResult[]> {
  const files = getDocxFiles(directory);
  const results: ProcessingResult[] = [];

  if (files.length === 0) {
    console.log(`[Law] No files found in: ${directory}`);
    return results;
  }

  console.log(`[Law] Found ${files.length} file(s)`);

  for (const file of files) {
    const result = await processLaw(file);
    results.push(result);
  }

  return results;
}

async function processJudgments(directory: string): Promise<ProcessingResult[]> {
  const files = getDocxFiles(directory);
  const results: ProcessingResult[] = [];

  if (files.length === 0) {
    console.log(`[Judgment] No files found in: ${directory}`);
    return results;
  }

  console.log(`[Judgment] Found ${files.length} file(s)`);

  for (const file of files) {
    const result = await processJudgment(file);
    results.push(result);
  }

  return results;
}


// MAIN FUNCTION


async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let type: string = 'all';
  let file: string | null = null;
  let directory: string = './samples';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' || args[i] === '-t') {
      type = args[++i];
    } else if (args[i] === '--file' || args[i] === '-f') {
      file = args[++i];
    } else if (args[i] === '--dir' || args[i] === '-d') {
      directory = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Legal Documents Parser & Loader

Usage:
  npx ts-node scripts/main.ts [options]

Options:
  --type, -t <type>    Document type: fatwa, law, judgment, all (default: all)
  --file, -f <path>    Process single file
  --dir, -d <path>     Base directory for samples (default: ./samples)
  --help, -h           Show this help message

Examples:
  npx ts-node scripts/main.ts                           # Process all documents
  npx ts-node scripts/main.ts --type judgment           # Process only judgments
  npx ts-node scripts/main.ts --type fatwa --file ./samples/fatwa1.docx
      `);
      process.exit(0);
    }
  }

  // Print header
  console.log('\n');
  printDivider();
  console.log('LEGAL DOCUMENTS PARSER & LOADER');
  printDivider();
  console.log(`Mode: ${file ? 'Single File' : 'Batch Processing'}`);
  console.log(`Type: ${type}`);
  if (file) console.log(`File: ${file}`);
  console.log(`Directory: ${directory}`);
  printDivider();
  console.log('');

  // Track results
  const summary: Summary = {
    total: 0,
    inserted: 0,
    duplicates: 0,
    skipped: 0,
    errors: 0,
  };

  const allResults: ProcessingResult[] = [];

  try {
    // Single file processing
    if (file) {
      let result: ProcessingResult;

      if (type === 'fatwa') {
        result = await processFatwa(file);
      } else if (type === 'law') {
        result = await processLaw(file);
      } else if (type === 'judgment') {
        result = await processJudgment(file);
      } else {
        console.log('[ERROR] Please specify --type (fatwa, law, judgment) when using --file');
        process.exit(1);
      }

      allResults.push(result);

    } else {
      // Batch processing

      // Process Fatwas
      if (type === 'all' || type === 'fatwa') {
        console.log('\n--- PROCESSING FATWAS ---\n');
        const fatwaDir = path.join(directory, 'fatwas');
        const results = await processFatwas(fatwaDir);
        allResults.push(...results);
      }

      // Process Laws
      if (type === 'all' || type === 'law') {
        console.log('\n--- PROCESSING LAWS ---\n');
        const lawDir = path.join(directory, 'laws');
        const results = await processLaws(lawDir);
        allResults.push(...results);
      }

      // Process Judgments
      if (type === 'all' || type === 'judgment') {
        console.log('\n--- PROCESSING JUDGMENTS ---\n');
        const judgmentDir = path.join(directory, 'judgments');
        const results = await processJudgments(judgmentDir);
        allResults.push(...results);
      }
    }


    // Print errors if any
    if (summary.errors > 0) {
      console.log('\nERRORS:');
      allResults
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`  - ${r.file}: ${r.message}`));
      console.log('');
    }

    // Exit with appropriate code
    process.exit(summary.errors > 0 ? 1 : 0);

  } catch (err: any) {
    console.log(`\n[FATAL ERROR] ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Run main
main();