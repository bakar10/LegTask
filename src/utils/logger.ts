// src/utils/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private context: string = 'App';

  setLevel(level: LogLevel) {
    this.level = level;
  }

  setContext(context: string) {
    this.context = context;
  }

  private timestamp(): string {
    return new Date().toISOString().slice(11, 19);
  }

  private formatMessage(level: string, color: string, message: string, data?: any): void {
    const time = this.timestamp();
    const prefix = `${COLORS.dim}[${time}]${COLORS.reset} ${color}[${level}]${COLORS.reset} ${COLORS.cyan}[${this.context}]${COLORS.reset}`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: any) {
    if (this.level <= LogLevel.DEBUG) {
      this.formatMessage('DEBUG', COLORS.dim, message, data);
    }
  }

  info(message: string, data?: any) {
    if (this.level <= LogLevel.INFO) {
      this.formatMessage('INFO', COLORS.blue, message, data);
    }
  }

  success(message: string, data?: any) {
    if (this.level <= LogLevel.INFO) {
      this.formatMessage('✓', COLORS.green, message, data);
    }
  }

  warn(message: string, data?: any) {
    if (this.level <= LogLevel.WARN) {
      this.formatMessage('WARN', COLORS.yellow, message, data);
    }
  }

  error(message: string, data?: any) {
    if (this.level <= LogLevel.ERROR) {
      this.formatMessage('ERROR', COLORS.red, message, data);
    }
  }

  divider(char: string = '─', length: number = 60) {
    console.log(COLORS.dim + char.repeat(length) + COLORS.reset);
  }

  header(title: string) {
    console.log('\n');
    this.divider('═');
    console.log(`${COLORS.bright}${COLORS.cyan}  ${title}${COLORS.reset}`);
    this.divider('═');
  }

  summary(summary: { inserted: number; updated: number; duplicates: number; skipped: number; errors: number }) {
    console.log('\n');
    this.divider();
    console.log(`${COLORS.bright}  BATCH SUMMARY${COLORS.reset}`);
    this.divider();
    console.log(`  ${COLORS.green}✓ Inserted:${COLORS.reset}   ${summary.inserted}`);
    console.log(`  ${COLORS.blue}↻ Updated:${COLORS.reset}    ${summary.updated}`);
    console.log(`  ${COLORS.yellow}⚠ Duplicates:${COLORS.reset} ${summary.duplicates}`);
    console.log(`  ${COLORS.dim}○ Skipped:${COLORS.reset}    ${summary.skipped}`);
    console.log(`  ${COLORS.red}✗ Errors:${COLORS.reset}     ${summary.errors}`);
    this.divider();
  }
}

export const logger = new Logger();
export const log = logger; // Alias