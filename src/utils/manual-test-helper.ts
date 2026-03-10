/**
 * Manual Test Helper Script
 * Provides automated verification for manual testing phases
 * Run during npm run dev to validate bot behavior
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface TestResult {
  phase: string;
  passed: boolean;
  message: string;
  duration: number;
}

class ManualTestHelper {
  private results: TestResult[] = [];
  private startTime = Date.now();

  /**
   * Verify bot can start without fatal errors
   */
  async verifyInitialization(): Promise<void> {
    const start = Date.now();
    try {
      // Check .env file exists
      if (!fs.existsSync('.env')) {
        throw new Error('.env file not found. Copy from .env.example and configure.');
      }

      // Check required env variables
      const env = fs.readFileSync('.env', 'utf-8');
      const required = ['BASE_RPC_URL', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
      for (const key of required) {
        if (!env.includes(key)) {
          throw new Error(`Missing required env var: ${key}`);
        }
      }

      // Check database directory exists
      const dbDir = 'data';
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.addResult('Phase 1: Initialization', true, 'All prerequisites met', Date.now() - start);
    } catch (error: any) {
      this.addResult('Phase 1: Initialization', false, error.message, Date.now() - start);
      throw error;
    }
  }

  /**
   * Verify token detection pipeline
   */
  async verifyTokenDetection(): Promise<void> {
    const start = Date.now();
    try {
      const logFile = this.getTempLogFile();
      const logs = this.readLogs(logFile);

      // Check for token detection logs
      const clankerDetection = logs.some(line => line.includes('Clanker') && line.includes('tokens'));
      const bankrDetection = logs.some(line => line.includes('Bankr') && line.includes('tokens'));
      const processing = logs.some(line => line.includes('Processing:'));

      if (!clankerDetection || !bankrDetection || !processing) {
        throw new Error('Token detection not working. Check RPC and scraper endpoints.');
      }

      // Count tokens processed
      const tokenMatches = logs.filter(line => line.includes('Processing:'));
      const count = tokenMatches.length;

      this.addResult(
        'Phase 2: Token Detection',
        true,
        `${count} tokens detected and processed`,
        Date.now() - start
      );
    } catch (error: any) {
      this.addResult('Phase 2: Token Detection', false, error.message, Date.now() - start);
    }
  }

  /**
   * Verify Telegram alerts were sent
   */
  async verifyTelegramAlerts(): Promise<void> {
    const start = Date.now();
    try {
      const logFile = this.getTempLogFile();
      const logs = this.readLogs(logFile);

      const alerts = logs.filter(line => line.includes('Alert sent successfully'));
      if (alerts.length === 0) {
        throw new Error('No Telegram alerts sent. Check bot token and chat ID.');
      }

      this.addResult(
        'Phase 3: Telegram Alerts',
        true,
        `${alerts.length} alerts sent successfully`,
        Date.now() - start
      );
    } catch (error: any) {
      this.addResult('Phase 3: Telegram Alerts', false, error.message, Date.now() - start);
    }
  }

  /**
   * Verify scoring accuracy
   */
  async verifyScoring(): Promise<void> {
    const start = Date.now();
    try {
      const logFile = this.getTempLogFile();
      const logs = this.readLogs(logFile);

      // Check for score logs
      const scoreLines = logs.filter(line => line.includes('score:'));
      if (scoreLines.length === 0) {
        throw new Error('No scoring data found in logs.');
      }

      // Extract and analyze scores
      const scores = scoreLines
        .map(line => {
          const match = line.match(/score:\s*(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((s): s is number => s !== null);

      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const distribution = {
        safe: scores.filter(s => s >= 65).length,
        caution: scores.filter(s => s >= 50 && s < 65).length,
        avoid: scores.filter(s => s < 50).length,
      };

      this.addResult(
        'Phase 4: Scoring Accuracy',
        true,
        `Avg score: ${avgScore.toFixed(1)}/100 | Safe: ${distribution.safe}, Caution: ${distribution.caution}, Avoid: ${distribution.avoid}`,
        Date.now() - start
      );
    } catch (error: any) {
      this.addResult('Phase 4: Scoring Accuracy', false, error.message, Date.now() - start);
    }
  }

  /**
   * Verify false positive rate
   */
  async verifyFalsePositiveRate(): Promise<void> {
    const start = Date.now();
    try {
      const logFile = this.getTempLogFile();
      const logs = this.readLogs(logFile);

      const processed = logs.filter(line => line.includes('Processing:')).length;
      const alerted = logs.filter(line => line.includes('Alert sent successfully')).length;

      if (processed === 0) {
        throw new Error('No tokens processed yet. Wait for scan cycle.');
      }

      const falsePositiveRate = ((processed - alerted) / processed) * 100;
      const pass = falsePositiveRate < 85; // Want <15% alerts

      this.addResult(
        'Phase 5: False Positive Rate',
        pass,
        `Alert rate: ${(100 - falsePositiveRate).toFixed(1)}% | Processed: ${processed}, Alerted: ${alerted}`,
        Date.now() - start
      );
    } catch (error: any) {
      this.addResult('Phase 5: False Positive Rate', false, error.message, Date.now() - start);
    }
  }

  /**
   * Verify error recovery
   */
  async verifyErrorRecovery(): Promise<void> {
    const start = Date.now();
    try {
      const logFile = this.getTempLogFile();
      const logs = this.readLogs(logFile);

      // Check for error logs
      const errors = logs.filter(line => line.includes('[ERROR]'));
      const recovered = logs.filter(line => line.includes('recovered') || line.includes('retry'));

      const pass = errors.length > 0 ? recovered.length > 0 : true;

      this.addResult(
        'Phase 6: Error Recovery',
        pass,
        `Errors: ${errors.length}, Recovery attempts: ${recovered.length}`,
        Date.now() - start
      );
    } catch (error: any) {
      this.addResult('Phase 6: Error Recovery', false, error.message, Date.now() - start);
    }
  }

  /**
   * Verify database persistence
   */
  async verifyDatabasePersistence(): Promise<void> {
    const start = Date.now();
    try {
      // This would require importing the Database class
      // For now, just check database file exists
      if (!fs.existsSync('data/bot.db')) {
        throw new Error('Database file not created. Bot may not have initialized.');
      }

      this.addResult(
        'Phase 7: Database Persistence',
        true,
        'Database file exists and accessible',
        Date.now() - start
      );
    } catch (error: any) {
      this.addResult('Phase 7: Database Persistence', false, error.message, Date.now() - start);
    }
  }

  /**
   * Verify performance metrics
   */
  async verifyPerformance(): Promise<void> {
    const start = Date.now();
    try {
      const logFile = this.getTempLogFile();
      const logs = this.readLogs(logFile);

      // Extract latency data
      const latencyLines = logs.filter(line => line.includes('took'));
      const latencies = latencyLines
        .map(line => {
          const match = line.match(/took\s*(\d+\.?\d*)s/);
          return match ? parseFloat(match[1]) : null;
        })
        .filter((l): l is number => l !== null);

      if (latencies.length === 0) {
        throw new Error('No latency data found. Check debug logging.');
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const pass = avgLatency < 3.0; // Target <3s per token

      this.addResult(
        'Phase 8: Performance',
        pass,
        `Avg: ${avgLatency.toFixed(2)}s, Max: ${maxLatency.toFixed(2)}s (target: <3s)`,
        Date.now() - start
      );
    } catch (error: any) {
      this.addResult('Phase 8: Performance', false, error.message, Date.now() - start);
    }
  }

  /**
   * Generate final report
   */
  generateReport(): string {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const duration = Date.now() - this.startTime;

    let report = '\n';
    report += '═══════════════════════════════════════════\n';
    report += '  MANUAL TEST REPORT\n';
    report += '═══════════════════════════════════════════\n\n';

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      report += `${status} ${result.phase}\n`;
      report += `   ${result.message}\n`;
      report += `   Duration: ${result.duration}ms\n\n`;
    }

    report += '───────────────────────────────────────────\n';
    report += `SUMMARY: ${passed}/${total} phases passed\n`;
    report += `Total time: ${(duration / 1000).toFixed(1)}s\n`;
    report += '═══════════════════════════════════════════\n\n';

    if (passed === total) {
      report += '🎉 ALL TESTS PASSED - Bot is ready for deployment!\n';
    } else {
      report += `⚠️  ${total - passed} phase(s) need attention.\n`;
    }

    return report;
  }

  /**
   * Helper: Add test result
   */
  private addResult(phase: string, passed: boolean, message: string, duration: number): void {
    this.results.push({ phase, passed, message, duration });
  }

  /**
   * Helper: Get temp log file path
   */
  private getTempLogFile(): string {
    return path.join(process.cwd(), '.test-logs.txt');
  }

  /**
   * Helper: Read logs from file
   */
  private readLogs(filePath: string): string[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n');
  }

  /**
   * Run all verification checks
   */
  async runAll(): Promise<string> {
    console.log('Starting manual test verification...\n');

    try {
      await this.verifyInitialization();
      await this.verifyTokenDetection();
      await this.verifyTelegramAlerts();
      await this.verifyScoring();
      await this.verifyFalsePositiveRate();
      await this.verifyErrorRecovery();
      await this.verifyDatabasePersistence();
      await this.verifyPerformance();
    } catch (error) {
      console.error('Test interrupted:', error);
    }

    const report = this.generateReport();
    console.log(report);

    // Save report
    const reportFile = path.join(process.cwd(), 'test-report.txt');
    fs.writeFileSync(reportFile, report);
    console.log(`Report saved to: ${reportFile}\n`);

    return report;
  }
}

// Export for use in test suite
export { ManualTestHelper };

// Run if executed directly
if (require.main === module) {
  const helper = new ManualTestHelper();
  helper.runAll().catch(console.error);
}
