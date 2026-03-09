"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
class Database {
    constructor(dbPath) {
        this.db = new sqlite3_1.default.Database(dbPath, (err) => {
            if (err) {
                throw new errors_1.DatabaseError('Failed to open database', { dbPath, error: err.message });
            }
            logger_1.default.info('Database connected', { dbPath });
        });
    }
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Tokens table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contractAddress TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            symbol TEXT NOT NULL,
            launchTime INTEGER NOT NULL,
            firstSeen INTEGER NOT NULL,
            lastUpdated INTEGER NOT NULL,
            source TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
                    if (err)
                        reject(new errors_1.DatabaseError('Failed to create tokens table', { error: err.message }));
                });
                // Analyses table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tokenId INTEGER NOT NULL,
            score INTEGER NOT NULL,
            holderScore INTEGER NOT NULL,
            creatorScore INTEGER NOT NULL,
            liquidityScore INTEGER NOT NULL,
            pumpScore INTEGER NOT NULL,
            risks TEXT,
            positives TEXT,
            timestamp INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tokenId) REFERENCES tokens(id)
          )
        `, (err) => {
                    if (err)
                        reject(new errors_1.DatabaseError('Failed to create analyses table', { error: err.message }));
                });
                // Alerts sent table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS alerts_sent (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tokenId INTEGER NOT NULL,
            alertTime INTEGER NOT NULL,
            messageId TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(tokenId),
            FOREIGN KEY (tokenId) REFERENCES tokens(id)
          )
        `, (err) => {
                    if (err)
                        reject(new errors_1.DatabaseError('Failed to create alerts_sent table', { error: err.message }));
                    else
                        resolve();
                });
            });
        });
    }
    async insertToken(token) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO tokens (contractAddress, name, symbol, launchTime, firstSeen, lastUpdated, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(contractAddress) DO UPDATE SET lastUpdated = excluded.lastUpdated
      `;
            this.db.run(sql, [token.contractAddress, token.name, token.symbol, token.launchTime, token.firstSeen, token.lastUpdated, token.source], function (err) {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to insert token', { token, error: err.message }));
                else
                    resolve(this.lastID);
            });
        });
    }
    async getToken(contractAddress) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM tokens WHERE contractAddress = ?', [contractAddress], (err, row) => {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to get token', { contractAddress, error: err.message }));
                else
                    resolve(row || null);
            });
        });
    }
    async insertAnalysis(analysis) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO analyses (tokenId, score, holderScore, creatorScore, liquidityScore, pumpScore, risks, positives, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            this.db.run(sql, [
                analysis.tokenId,
                analysis.score,
                analysis.holderScore,
                analysis.creatorScore,
                analysis.liquidityScore,
                analysis.pumpScore,
                JSON.stringify(analysis.risks),
                JSON.stringify(analysis.positives),
                analysis.timestamp,
            ], function (err) {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to insert analysis', { tokenId: analysis.tokenId, error: err.message }));
                else
                    resolve(this.lastID);
            });
        });
    }
    async hasAlertBeenSent(tokenId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT id FROM alerts_sent WHERE tokenId = ?', [tokenId], (err, row) => {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to check alert', { tokenId, error: err.message }));
                else
                    resolve(!!row);
            });
        });
    }
    async recordAlertSent(tokenId, messageId) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT OR REPLACE INTO alerts_sent (tokenId, alertTime, messageId)
        VALUES (?, ?, ?)
      `;
            this.db.run(sql, [tokenId, Date.now(), messageId], function (err) {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to record alert', { tokenId, error: err.message }));
                else
                    resolve(this.lastID);
            });
        });
    }
    async getLatestAnalysis(tokenId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM analyses WHERE tokenId = ? ORDER BY timestamp DESC LIMIT 1';
            this.db.get(sql, [tokenId], (err, row) => {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to get analysis', { tokenId, error: err.message }));
                else
                    resolve(row ? { ...row, risks: JSON.parse(row.risks), positives: JSON.parse(row.positives) } : null);
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err)
                    reject(err);
                else {
                    logger_1.default.info('Database closed');
                    resolve();
                }
            });
        });
    }
}
exports.Database = Database;
//# sourceMappingURL=db.js.map