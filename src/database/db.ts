import sqlite3 from 'sqlite3';
import path from 'path';
import { DatabaseError } from '../utils/errors';
import logger from '../utils/logger';

export interface TokenRecord {
  id?: number;
  contractAddress: string;
  name: string;
  symbol: string;
  launchTime: number;
  firstSeen: number;
  lastUpdated: number;
  source: 'clanker' | 'bankr';
}

export interface AnalysisRecord {
  id?: number;
  tokenId: number;
  score: number;
  holderScore: number;
  creatorScore: number;
  liquidityScore: number;
  pumpScore: number;
  risks: string[];
  positives: string[];
  timestamp: number;
}

export interface AlertRecord {
  id?: number;
  tokenId: number;
  alertTime: number;
  messageId?: string;
}

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        throw new DatabaseError('Failed to open database', { dbPath, error: err.message });
      }
      logger.info('Database connected', { dbPath });
    });
  }

  async initialize(): Promise<void> {
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
          if (err) reject(new DatabaseError('Failed to create tokens table', { error: err.message }));
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
          if (err) reject(new DatabaseError('Failed to create analyses table', { error: err.message }));
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
          if (err) reject(new DatabaseError('Failed to create alerts_sent table', { error: err.message }));
          else resolve();
        });
      });
    });
  }

  async insertToken(token: TokenRecord): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO tokens (contractAddress, name, symbol, launchTime, firstSeen, lastUpdated, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(contractAddress) DO UPDATE SET lastUpdated = excluded.lastUpdated
      `;
      this.db.run(
        sql,
        [token.contractAddress, token.name, token.symbol, token.launchTime, token.firstSeen, token.lastUpdated, token.source],
        function (err) {
          if (err) reject(new DatabaseError('Failed to insert token', { token, error: err.message }));
          else resolve(this.lastID);
        }
      );
    });
  }

  async getToken(contractAddress: string): Promise<TokenRecord | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM tokens WHERE contractAddress = ?', [contractAddress], (err, row: any) => {
        if (err) reject(new DatabaseError('Failed to get token', { contractAddress, error: err.message }));
        else resolve(row as TokenRecord || null);
      });
    });
  }

  async insertAnalysis(analysis: AnalysisRecord): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO analyses (tokenId, score, holderScore, creatorScore, liquidityScore, pumpScore, risks, positives, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      this.db.run(
        sql,
        [
          analysis.tokenId,
          analysis.score,
          analysis.holderScore,
          analysis.creatorScore,
          analysis.liquidityScore,
          analysis.pumpScore,
          JSON.stringify(analysis.risks),
          JSON.stringify(analysis.positives),
          analysis.timestamp,
        ],
        function (err) {
          if (err) reject(new DatabaseError('Failed to insert analysis', { tokenId: analysis.tokenId, error: err.message }));
          else resolve(this.lastID);
        }
      );
    });
  }

  async hasAlertBeenSent(tokenId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT id FROM alerts_sent WHERE tokenId = ?', [tokenId], (err, row) => {
        if (err) reject(new DatabaseError('Failed to check alert', { tokenId, error: err.message }));
        else resolve(!!row);
      });
    });
  }

  async recordAlertSent(tokenId: number, messageId?: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO alerts_sent (tokenId, alertTime, messageId)
        VALUES (?, ?, ?)
      `;
      this.db.run(
        sql,
        [tokenId, Date.now(), messageId],
        function (err) {
          if (err) reject(new DatabaseError('Failed to record alert', { tokenId, error: err.message }));
          else resolve(this.lastID);
        }
      );
    });
  }

  async getLatestAnalysis(tokenId: number): Promise<AnalysisRecord | null> {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM analyses WHERE tokenId = ? ORDER BY timestamp DESC LIMIT 1';
      this.db.get(sql, [tokenId], (err, row: any) => {
        if (err) reject(new DatabaseError('Failed to get analysis', { tokenId, error: err.message }));
        else resolve(row ? { ...row, risks: JSON.parse(row.risks), positives: JSON.parse(row.positives) } as AnalysisRecord : null);
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else {
          logger.info('Database closed');
          resolve();
        }
      });
    });
  }
}
