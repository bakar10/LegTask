import mammoth from 'mammoth';
import fs from 'fs';

export async function readDocx(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);

  const result = await mammoth.extractRawText({ buffer });

  return result.value;
}
