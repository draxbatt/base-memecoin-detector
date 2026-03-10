/**
 * Manual Test Helper Script
 * Provides automated verification for manual testing phases
 * Run during npm run dev to validate bot behavior
 */
declare class ManualTestHelper {
    private results;
    private startTime;
    /**
     * Verify bot can start without fatal errors
     */
    verifyInitialization(): Promise<void>;
    /**
     * Verify token detection pipeline
     */
    verifyTokenDetection(): Promise<void>;
    /**
     * Verify Telegram alerts were sent
     */
    verifyTelegramAlerts(): Promise<void>;
    /**
     * Verify scoring accuracy
     */
    verifyScoring(): Promise<void>;
    /**
     * Verify false positive rate
     */
    verifyFalsePositiveRate(): Promise<void>;
    /**
     * Verify error recovery
     */
    verifyErrorRecovery(): Promise<void>;
    /**
     * Verify database persistence
     */
    verifyDatabasePersistence(): Promise<void>;
    /**
     * Verify performance metrics
     */
    verifyPerformance(): Promise<void>;
    /**
     * Generate final report
     */
    generateReport(): string;
    /**
     * Helper: Add test result
     */
    private addResult;
    /**
     * Helper: Get temp log file path
     */
    private getTempLogFile;
    /**
     * Helper: Read logs from file
     */
    private readLogs;
    /**
     * Run all verification checks
     */
    runAll(): Promise<string>;
}
export { ManualTestHelper };
//# sourceMappingURL=manual-test-helper.d.ts.map