import { Injectable, Logger } from '@nestjs/common';

export interface SecurityIssue {
  type: 'secret' | 'vulnerability' | 'injection' | 'crypto' | 'auth' | 'dependency';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  line: number;
  code: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration ID
  file: string;
}

@Injectable()
export class SecurityScannerService {
  private readonly logger = new Logger(SecurityScannerService.name);

  // Secret patterns
  private readonly SECRET_PATTERNS = [
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      severity: 'critical' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'AWS Secret Key',
      pattern: /aws[_\-]?secret[_\-]?(?:access[_\-]?)?key["\s:=]+([a-zA-Z0-9\/\+]{40})/gi,
      severity: 'critical' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'GitHub Token',
      pattern: /gh[ps]_[a-zA-Z0-9]{36,}/g,
      severity: 'critical' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----/g,
      severity: 'critical' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'Generic API Key',
      pattern: /(?:api[_\-]?key|apikey|api[_\-]?secret)["\s:=]+["']?([a-zA-Z0-9\-_]{20,})/gi,
      severity: 'high' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'Generic Password',
      pattern: /(?:password|passwd|pwd)["\s:=]+["']([^"'\s]{8,})/gi,
      severity: 'high' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'Database Connection String',
      pattern: /(?:mongodb|mysql|postgresql|postgres):\/\/[^\s"']+:[^\s"']+@/gi,
      severity: 'critical' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'JWT Token',
      pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
      severity: 'high' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'Slack Token',
      pattern: /xox[baprs]-[0-9a-zA-Z]{10,}/g,
      severity: 'critical' as const,
      cwe: 'CWE-798',
    },
    {
      name: 'Stripe API Key',
      pattern: /(?:sk|pk)_live_[0-9a-zA-Z]{24,}/g,
      severity: 'critical' as const,
      cwe: 'CWE-798',
    },
  ];

  // SQL Injection patterns
  private readonly SQL_INJECTION_PATTERNS = [
    {
      pattern: /query\s*\(\s*["'`].*?\$\{.*?\}.*?["'`]\s*\)/gi,
      message: 'Potential SQL injection via string interpolation',
    },
    {
      pattern: /execute\s*\(\s*["'`].*?\+.*?["'`]\s*\)/gi,
      message: 'Potential SQL injection via string concatenation',
    },
    {
      pattern: /\.raw\s*\(\s*["'`].*?\$\{.*?\}.*?["'`]\s*\)/gi,
      message: 'Raw SQL query with string interpolation',
    },
  ];

  // XSS patterns
  private readonly XSS_PATTERNS = [
    {
      pattern: /dangerouslySetInnerHTML\s*=\s*\{\{?\s*__html:/g,
      message: 'Use of dangerouslySetInnerHTML without sanitization',
    },
    {
      pattern: /innerHTML\s*=\s*(?!["'])/g,
      message: 'Direct assignment to innerHTML',
    },
    {
      pattern: /document\.write\s*\(/g,
      message: 'Use of document.write',
    },
  ];

  // Insecure crypto patterns
  private readonly CRYPTO_PATTERNS = [
    {
      pattern: /\b(MD5|SHA1)\b/gi,
      message: 'Weak cryptographic hash algorithm',
      recommendation: 'Use SHA-256 or stronger',
    },
    {
      pattern: /Math\.random\(\)/g,
      message: 'Math.random() is not cryptographically secure',
      recommendation: 'Use crypto.randomBytes() or crypto.getRandomValues()',
    },
    {
      pattern: /createCipher\b/g,
      message: 'createCipher is deprecated and insecure',
      recommendation: 'Use createCipheriv with explicit IV',
    },
  ];

  // Authentication/Authorization patterns
  private readonly AUTH_PATTERNS = [
    {
      pattern: /\.verify\s*\(\s*[^,]+\s*,\s*["']{2,}["']\s*\)/g,
      message: 'Empty or weak JWT secret',
    },
    {
      pattern: /bcrypt\.hash\s*\(\s*[^,]+\s*,\s*[0-9]\s*\)/g,
      message: 'bcrypt rounds less than 10 (weak)',
      recommendation: 'Use at least 12 rounds',
    },
  ];

  // Command Injection patterns
  private readonly COMMAND_INJECTION_PATTERNS = [
    {
      pattern: /exec\s*\(\s*["'`].*?\$\{.*?\}.*?["'`]\s*\)/gi,
      message: 'Potential command injection via exec with template literals',
    },
    {
      pattern: /spawn\s*\(\s*["'`].*?\+.*?["'`]/gi,
      message: 'Potential command injection via spawn',
    },
    {
      pattern: /eval\s*\(/g,
      message: 'Use of eval() is dangerous',
    },
  ];

  /**
   * Scan file content for security issues
   */
  async scanFile(filename: string, content: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');

    // Skip non-code files
    if (this.shouldSkipFile(filename)) {
      return issues;
    }

    // Scan for secrets
    issues.push(...this.scanForSecrets(filename, content, lines));

    // Scan for SQL injection
    issues.push(...this.scanForSQLInjection(filename, content, lines));

    // Scan for XSS
    issues.push(...this.scanForXSS(filename, content, lines));

    // Scan for weak crypto
    issues.push(...this.scanForWeakCrypto(filename, content, lines));

    // Scan for auth issues
    issues.push(...this.scanForAuthIssues(filename, content, lines));

    // Scan for command injection
    issues.push(...this.scanForCommandInjection(filename, content, lines));

    // Scan for path traversal
    issues.push(...this.scanForPathTraversal(filename, content, lines));

    this.logger.log(`🔍 Scanned ${filename}: ${issues.length} security issues found`);

    return issues;
  }

  private shouldSkipFile(filename: string): boolean {
    const skipExtensions = ['.json', '.md', '.txt', '.lock', '.jpg', '.png', '.svg'];
    return skipExtensions.some(ext => filename.endsWith(ext));
  }

  private scanForSecrets(filename: string, content: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const pattern of this.SECRET_PATTERNS) {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const line = lines[lineNumber - 1];

        // Skip if in comment or test file
        if (this.isInComment(line) || this.isTestFile(filename)) {
          continue;
        }

        issues.push({
          type: 'secret',
          severity: pattern.severity,
          title: `Hardcoded ${pattern.name} detected`,
          description: `Found exposed ${pattern.name} in code. This is a critical security risk.`,
          line: lineNumber,
          code: line.trim(),
          recommendation: 'Move secrets to environment variables or use a secret management service (AWS Secrets Manager, HashiCorp Vault, etc.)',
          cwe: pattern.cwe,
          file: filename,
        });
      }
    }

    return issues;
  }

  private scanForSQLInjection(filename: string, content: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        issues.push({
          type: 'injection',
          severity: 'high',
          title: 'SQL Injection Risk',
          description: pattern.message,
          line: lineNumber,
          code: lines[lineNumber - 1].trim(),
          recommendation: 'Use parameterized queries or ORM methods with proper escaping',
          cwe: 'CWE-89',
          file: filename,
        });
      }
    }

    return issues;
  }

  private scanForXSS(filename: string, content: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const pattern of this.XSS_PATTERNS) {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        issues.push({
          type: 'vulnerability',
          severity: 'high',
          title: 'XSS Vulnerability Risk',
          description: pattern.message,
          line: lineNumber,
          code: lines[lineNumber - 1].trim(),
          recommendation: 'Sanitize user input using DOMPurify or similar library',
          cwe: 'CWE-79',
          file: filename,
        });
      }
    }

    return issues;
  }

  private scanForWeakCrypto(filename: string, content: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const pattern of this.CRYPTO_PATTERNS) {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        issues.push({
          type: 'crypto',
          severity: 'medium',
          title: 'Weak Cryptography',
          description: pattern.message,
          line: lineNumber,
          code: lines[lineNumber - 1].trim(),
          recommendation: pattern.recommendation || 'Use stronger cryptographic algorithms',
          cwe: 'CWE-327',
          file: filename,
        });
      }
    }

    return issues;
  }

  private scanForAuthIssues(filename: string, content: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const pattern of this.AUTH_PATTERNS) {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        issues.push({
          type: 'auth',
          severity: 'high',
          title: 'Authentication/Authorization Issue',
          description: pattern.message,
          line: lineNumber,
          code: lines[lineNumber - 1].trim(),
          recommendation: pattern.recommendation || 'Review authentication implementation',
          cwe: 'CWE-287',
          file: filename,
        });
      }
    }

    return issues;
  }

  private scanForCommandInjection(filename: string, content: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    for (const pattern of this.COMMAND_INJECTION_PATTERNS) {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);

        issues.push({
          type: 'injection',
          severity: 'critical',
          title: 'Command Injection Risk',
          description: pattern.message,
          line: lineNumber,
          code: lines[lineNumber - 1].trim(),
          recommendation: 'Validate and sanitize all input. Use execFile with array arguments instead.',
          cwe: 'CWE-78',
          file: filename,
        });
      }
    }

    return issues;
  }

  private scanForPathTraversal(filename: string, content: string, lines: string[]): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const pattern = /(?:readFile|writeFile|readFileSync|writeFileSync|unlink|rmdir)\s*\(\s*(?:req\.|params\.|query\.)/gi;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = this.getLineNumber(content, match.index);

      issues.push({
        type: 'vulnerability',
        severity: 'high',
        title: 'Path Traversal Risk',
        description: 'File operation with user input may allow path traversal',
        line: lineNumber,
        code: lines[lineNumber - 1].trim(),
        recommendation: 'Validate file paths and use path.join() with proper sanitization',
        cwe: 'CWE-22',
        file: filename,
      });
    }

    return issues;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private isInComment(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  }

  private isTestFile(filename: string): boolean {
    return /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(filename) || /test|spec|mock/.test(filename);
  }

  /**
   * Generate security report summary
   */
  generateReport(issues: SecurityIssue[]): string {
    if (issues.length === 0) {
      return '✅ No security issues found!';
    }

    const bySeverity = {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
    };

    const byType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let report = `🔒 Security Scan Report\n\n`;
    report += `Total Issues: ${issues.length}\n\n`;
    report += `By Severity:\n`;
    report += `  🔴 Critical: ${bySeverity.critical}\n`;
    report += `  🟠 High: ${bySeverity.high}\n`;
    report += `  🟡 Medium: ${bySeverity.medium}\n`;
    report += `  🟢 Low: ${bySeverity.low}\n\n`;
    report += `By Type:\n`;
    Object.entries(byType).forEach(([type, count]) => {
      report += `  • ${type}: ${count}\n`;
    });

    return report;
  }
}
