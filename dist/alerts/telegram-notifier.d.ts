import { ScoringResult } from '../scoring/score-engine';
export interface AlertPayload {
    tokenName: string;
    symbol: string;
    contractAddress: string;
    score: ScoringResult;
    launchTime: number;
}
export declare class TelegramNotifier {
    private bot;
    private chatId;
    private lastAlertTime;
    private alertCooldown;
    constructor(botToken: string, chatId: string);
    sendAlert(alert: AlertPayload): Promise<string>;
    private formatAlert;
    private formatTimeAgo;
    private escapeMarkdown;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=telegram-notifier.d.ts.map