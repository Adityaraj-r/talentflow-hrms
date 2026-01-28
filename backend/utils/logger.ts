import morgan from 'morgan';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  info(message: string, ...args: any[]): void {
    console.log(
      `${colors.blue}[INFO]${colors.reset} ${colors.cyan}${this.getTimestamp()}${colors.reset} - ${message}`,
      ...args
    );
  }

  error(message: string, ...args: any[]): void {
    console.error(
      `${colors.red}[ERROR]${colors.reset} ${colors.cyan}${this.getTimestamp()}${colors.reset} - ${message}`,
      ...args
    );
  }

  warn(message: string, ...args: any[]): void {
    console.warn(
      `${colors.yellow}[WARN]${colors.reset} ${colors.cyan}${this.getTimestamp()}${colors.reset} - ${message}`,
      ...args
    );
  }

  success(message: string, ...args: any[]): void {
    console.log(
      `${colors.green}[SUCCESS]${colors.reset} ${colors.cyan}${this.getTimestamp()}${colors.reset} - ${message}`,
      ...args
    );
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${colors.magenta}[DEBUG]${colors.reset} ${colors.cyan}${this.getTimestamp()}${colors.reset} - ${message}`,
        ...args
      );
    }
  }
}

export const logger = new Logger();

export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
  }
);
