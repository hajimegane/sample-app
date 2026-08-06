/**
 * The application record and the store that holds it.
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
  title: string;
  applicant: string;
  reason: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface NewApplication {
  title: string;
  applicant: string;
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
    reason: row.reason,
    status: isStatus(row.status) ? row.status : "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class D1ApplicationStore implements ApplicationStore {
  constructor(private readonly db: D1Database) {}

  async list(): Promise<Application[]> {
    const result = await this.db
      .prepare("SELECT * FROM applications ORDER BY created_at DESC")
      .all<Row>();
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
      title: input.title,
      applicant: input.applicant,
      reason: input.reason,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    await this.db
      .prepare(
        `INSERT INTO applications (id, title, applicant, reason, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        application.id,
        application.title,
        application.applicant,
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

  async list(): Promise<Application[]> {
    return [...this.#rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
