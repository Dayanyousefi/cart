import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface MigrationRecord {
  version: string;
  name: string;
  filename: string;
  checksumSha256: string;
  sqlContent: string;
  tablesCreated: string[];
  indexesCreated: string[];
  appliedAt: string;
  executionTimeMs: number;
}

export class MigrationRunner {
  private appliedMigrations: Map<string, MigrationRecord> = new Map();
  private readonly migrationsDir: string;

  constructor(migrationsDir = path.resolve(process.cwd(), 'src/server/db/migrations')) {
    this.migrationsDir = migrationsDir;
  }

  public scanMigrationFiles(): Array<{
    version: string;
    name: string;
    filename: string;
    fullPath: string;
  }> {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    return files.map((filename) => {
      const match = /^(\d+)_(.+)\.sql$/.exec(filename);
      const version = match ? match[1] : '000';
      const name = match ? match[2] : filename.replace('.sql', '');
      return {
        version,
        name,
        filename,
        fullPath: path.join(this.migrationsDir, filename),
      };
    });
  }

  public runPendingMigrations(): MigrationRecord[] {
    const files = this.scanMigrationFiles();
    const newlyApplied: MigrationRecord[] = [];

    for (const file of files) {
      const sqlContent = fs.readFileSync(file.fullPath, 'utf-8');
      const checksumSha256 = crypto.createHash('sha256').update(sqlContent).digest('hex');

      const existing = this.appliedMigrations.get(file.version);
      if (existing) {
        if (existing.checksumSha256 !== checksumSha256) {
          throw new Error(
            `Migration checksum mismatch for ${file.filename}: expected ${existing.checksumSha256}, got ${checksumSha256}`
          );
        }
        continue;
      }

      const startTime = Date.now();
      const tablesCreated = Array.from(
        sqlContent.matchAll(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-z0-9_]+)/gi),
        (m) => m[1]
      );
      const indexesCreated = Array.from(
        sqlContent.matchAll(/CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+([a-z0-9_]+)/gi),
        (m) => m[1]
      );

      const record: MigrationRecord = {
        version: file.version,
        name: file.name,
        filename: file.filename,
        checksumSha256,
        sqlContent,
        tablesCreated,
        indexesCreated,
        appliedAt: new Date().toISOString(),
        executionTimeMs: Math.max(1, Date.now() - startTime),
      };

      this.appliedMigrations.set(file.version, record);
      newlyApplied.push(record);
    }

    return newlyApplied;
  }

  public getAppliedMigrations(): MigrationRecord[] {
    return Array.from(this.appliedMigrations.values()).sort((a, b) =>
      a.version.localeCompare(b.version)
    );
  }
}
