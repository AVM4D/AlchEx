import db from '../db/connection';

// ─── Report Repository — All Raw SQL ───────────────────────────────────────

export class ReportRepository {

  // INSERT new report
  async create(data: {
    transaction: { connect: { id: string } }; reporter: { connect: { id: string } };
    targetUser: { connect: { id: string } }; reason: string; description: string; evidence?: string;
  }) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.execute`
      INSERT INTO reports
        (id, transactionId, reporterId, targetUserId, reason, description, evidence,
         status, isDeleted, createdAt, updatedAt)
      VALUES
        (${id}, ${data.transaction.connect.id}, ${data.reporter.connect.id},
         ${data.targetUser.connect.id}, ${data.reason}, ${data.description},
         ${data.evidence ?? null}, 'PENDING', 0, ${now}, ${now})
    `;
    return this.findById(id);
  }

  // SELECT single report by ID with reporter, target, transaction info
  async findById(id: string) {
    const rows: any[] = await db.query`
      SELECT
        r.*,
        rep.id AS [reporter.id], rep.firstName AS [reporter.firstName],
        rep.lastName AS [reporter.lastName], rep.email AS [reporter.email],
        tgt.id AS [targetUser.id], tgt.firstName AS [targetUser.firstName],
        tgt.lastName AS [targetUser.lastName], tgt.email AS [targetUser.email],
        t.id AS [transaction.id], t.status AS [transaction.status],
        p.title AS [transaction.post.title]
      FROM reports r
      JOIN users rep ON rep.id = r.reporterId
      JOIN users tgt ON tgt.id = r.targetUserId
      JOIN transactions t ON t.id = r.transactionId
      JOIN posts p ON p.id = t.postId
      WHERE r.id = ${id} AND r.isDeleted = 0
    `;
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id, transactionId: row.transactionId, reporterId: row.reporterId,
      targetUserId: row.targetUserId, reason: row.reason, description: row.description,
      evidence: row.evidence, status: row.status, adminNotes: row.adminNotes,
      resolvedAt: row.resolvedAt, isDeleted: row.isDeleted, createdAt: row.createdAt, updatedAt: row.updatedAt,
      reporter: { id: row['reporter.id'], firstName: row['reporter.firstName'], lastName: row['reporter.lastName'], email: row['reporter.email'] },
      targetUser: { id: row['targetUser.id'], firstName: row['targetUser.firstName'], lastName: row['targetUser.lastName'], email: row['targetUser.email'] },
      transaction: {
        id: row['transaction.id'], status: row['transaction.status'],
        post: { title: row['transaction.post.title'] },
      },
    };
  }

  // SELECT all reports with optional status filter + pagination
  async findAll(params: { skip?: number; take?: number; where?: any }) {
    const { skip = 0, take = 20, where } = params;
    const statusFilter = where?.status ? `AND r.status = '${where.status}'` : '';

    const reports: any[] = await db.queryUnsafe(`
      SELECT
        r.id, r.transactionId, r.reporterId, r.targetUserId, r.reason, r.description,
        r.status, r.adminNotes, r.resolvedAt, r.createdAt, r.updatedAt,
        rep.id AS [reporter.id], rep.firstName AS [reporter.firstName], rep.lastName AS [reporter.lastName],
        tgt.id AS [targetUser.id], tgt.firstName AS [targetUser.firstName], tgt.lastName AS [targetUser.lastName],
        t.id AS [transaction.id], t.status AS [transaction.status]
      FROM reports r
      JOIN users rep ON rep.id = r.reporterId
      JOIN users tgt ON tgt.id = r.targetUserId
      JOIN transactions t ON t.id = r.transactionId
      WHERE r.isDeleted = 0 ${statusFilter}
      ORDER BY r.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `);
    const countResult: any[] = await db.queryUnsafe(`
      SELECT COUNT(*) AS total FROM reports r WHERE r.isDeleted = 0 ${statusFilter}
    `);
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = reports.map((row: any) => ({
      id: row.id, transactionId: row.transactionId, reporterId: row.reporterId,
      targetUserId: row.targetUserId, reason: row.reason, description: row.description,
      status: row.status, adminNotes: row.adminNotes, resolvedAt: row.resolvedAt,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
      reporter: { id: row['reporter.id'], firstName: row['reporter.firstName'], lastName: row['reporter.lastName'] },
      targetUser: { id: row['targetUser.id'], firstName: row['targetUser.firstName'], lastName: row['targetUser.lastName'] },
      transaction: { id: row['transaction.id'], status: row['transaction.status'] },
    }));
    return { reports: formatted, total };
  }

  // UPDATE report — dynamic SET
  async update(id: string, data: Record<string, any>) {
    const keys = Object.keys(data);
    if (keys.length === 0) return this.findById(id);
    data.updatedAt = new Date();

    const setParts: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(data)) {
      setParts.push(`[${key}] = @v${values.length}`);
      values.push(val);
    }
    const sql = `UPDATE reports SET ${setParts.join(', ')} WHERE id = @v${values.length}`;
    values.push(id);

    await db.executeUnsafe(sql, ...values);
    return this.findById(id);
  }

  // SOFT DELETE
  async softDelete(id: string) {
    await db.execute`
      UPDATE reports SET isDeleted = 1, updatedAt = GETDATE() WHERE id = ${id}
    `;
    return { id };
  }
}

export const reportRepository = new ReportRepository();
