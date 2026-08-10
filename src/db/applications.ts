/**
 * The expense claim record and the store that holds it.
 *
 * The store is an interface with two implementations -- D1 in the Worker, and
 * an in-memory one in tests. That split exists so the gates can run without a
 * database: a test suite that needs infrastructure to start is a test suite
 * that gets skipped, and a skipped gate is not a gate.
 */

export const STATUSES = ["pending", "approved", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

/** Status labels, in Japanese, for the screens. */
export const STATUS_LABEL: Record<Status, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "却下",
};

export interface Application {
  id: string;
  /** What the money was for, in a few words. */
  title: string;
  applicant: string;
  /** Date the expense was incurred, ISO 8601 date (YYYY-MM-DD). */
  spentOn: string;
  /** Expense category. Free text -- categories differ per organisation and change. */
  category: string;
  /** Who was paid. */
  payee: string;
  /**
   * Amount in whole yen.
   *
   * Integer, never a float. Money held as a float accumulates rounding error
   * that shows up the first time anything is summed, and no amount of care at
   * the display layer puts it back.
   */
  amountYen: number;
  /** Free-text justification. */
  reason: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface NewApplication {
  title: string;
  applicant: string;
  spentOn: string;
  category: string;
  payee: string;
  amountYen: number;
  reason: string;
}

export interface ApplicationStore {
  list(): Promise<Application[]>;
  get(id: string): Promise<Application | null>;
  create(input: NewApplication): Promise<Application>;
  setStatus(id: string, status: Status): Promise<Application | null>;
}

interface Row {
  id: string;
  title: string;
  applicant: string;
  spent_on: string;
  category: string;
  payee: string;
  amount_yen: number;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function fromRow(row: Row): Application {
  return {
    id: row.id,
    title: row.title,
    applicant: row.applicant,
    spentOn: row.spent_on,
    category: row.category,
    payee: row.payee,
    amountYen: row.amount_yen,
    reason: row.reason,
    status: isStatus(row.status) ? row.status : "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * The list order: most recently incurred first, then most recently filed.
 *
 * The tiebreaker matters more than it looks. Several claims often share one
 * date -- a day of travel produces a handful at once -- and without it the
 * order is whatever the storage engine happens to return, which differs
 * between D1 and the in-memory store and makes the tests lie.
 */
const LIST_ORDER = "ORDER BY spent_on DESC, created_at DESC";

export class D1ApplicationStore implements ApplicationStore {
  constructor(private readonly db: D1Database) {}

  async list(): Promise<Application[]> {
    const result = await this.db.prepare(`SELECT * FROM applications ${LIST_ORDER}`).all<Row>();
    return result.results.map(fromRow);
  }

  async get(id: string): Promise<Application | null> {
    const row = await this.db.prepare("SELECT * FROM applications WHERE id = ?").bind(id).first<Row>();
    return row ? fromRow(row) : null;
  }

  async create(input: NewApplication): Promise<Application> {
    const now = new Date().toISOString();
    const application: Application = {
      id: crypto.randomUUID(),
      ...input,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    await this.db
      .prepare(
        `INSERT INTO applications
           (id, title, applicant, spent_on, category, payee, amount_yen, reason, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        application.id,
        application.title,
        application.applicant,
        application.spentOn,
        application.category,
        application.payee,
        application.amountYen,
        application.reason,
        application.status,
        application.createdAt,
        application.updatedAt,
      )
      .run();
    return application;
  }

  async setStatus(id: string, status: Status): Promise<Application | null> {
    const now = new Date().toISOString();
    await this.db
      .prepare("UPDATE applications SET status = ?, updated_at = ? WHERE id = ?")
      .bind(status, now, id)
      .run();
    return this.get(id);
  }
}

/** Used by the gates. Same contract, no infrastructure. */
export class MemoryApplicationStore implements ApplicationStore {
  #rows: Application[] = [];

  constructor(seed: Application[] = []) {
    this.#rows = [...seed];
  }

  async list(): Promise<Application[]> {
    // Must match LIST_ORDER exactly, or the gates verify an order the real
    // store does not produce.
    return [...this.#rows].sort(
      (a, b) => b.spentOn.localeCompare(a.spentOn) || b.createdAt.localeCompare(a.createdAt),
    );
  }

  async get(id: string): Promise<Application | null> {
    return this.#rows.find((row) => row.id === id) ?? null;
  }

  async create(input: NewApplication): Promise<Application> {
    const now = new Date().toISOString();
    const application: Application = {
      id: crypto.randomUUID(),
      ...input,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    this.#rows.push(application);
    return application;
  }

  async setStatus(id: string, status: Status): Promise<Application | null> {
    const application = await this.get(id);
    if (!application) return null;
    application.status = status;
    application.updatedAt = new Date().toISOString();
    return application;
  }
}

/** 3桁区切りの円表記。表示専用で、保存には使わない。 */
export function formatYen(amountYen: number): string {
  return `¥${amountYen.toLocaleString("ja-JP")}`;
}
