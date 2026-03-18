import pg from "pg"

export class PgError extends Error {
  readonly _tag = "PgError" as const
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message)
    this.name = "PgError"
  }
}

export class PgClient {
  private pool: pg.Pool

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString })
  }

  async query(sql: string, params?: unknown[]): Promise<pg.QueryResult> {
    try {
      return await this.pool.query(sql, params)
    } catch (err) {
      throw new PgError(String(err), err)
    }
  }

  async end(): Promise<void> {
    await this.pool.end()
  }
}
