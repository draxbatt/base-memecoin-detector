import { ethers } from 'ethers';
/**
 * Wallet Analysis Module
 * Analyzes wallet behavior and characteristics
 */
export declare class WalletAnalyzer {
    private provider;
    constructor(provider: ethers.Provider);
    /**
     * Analyze wallet transaction history
     */
    analyzeWallet(address: string): Promise<any>;
    /**
     * Get transaction history for wallet
     */
    getTransactionHistory(address: string, _limit?: number): Promise<any[]>;
    /**
     * Score wallet based on behavior
     */
    private scoreWallet;
}
//# sourceMappingURL=wallet-analyzer.d.ts.map