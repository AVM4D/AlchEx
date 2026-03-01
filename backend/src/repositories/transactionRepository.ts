import db from '../db/connection';

// ─── Transaction Repository — All Raw SQL ──────────────────────────────────

export class TransactionRepository {

  // SELECT single transaction by ID with post, offer, requester, offerer, ratings
  async findById(id: string) {
    const rows: any[] = await db.query`
      SELECT
        t.*,
        p.id AS [post.id], p.title AS [post.title], p.description AS [post.description],
        o.id AS [offer.id], o.proposalDescription AS [offer.proposalDescription],
        o.counterExchange AS [offer.counterExchange],
        req.id AS [requester.id], req.firstName AS [requester.firstName],
        req.lastName AS [requester.lastName], req.profilePicture AS [requester.profilePicture],
        req.reputationScore AS [requester.reputationScore],
        off2.id AS [offerer.id], off2.firstName AS [offerer.firstName],
        off2.lastName AS [offerer.lastName], off2.profilePicture AS [offerer.profilePicture],
        off2.reputationScore AS [offerer.reputationScore]
      FROM transactions t
      JOIN posts p ON p.id = t.postId
      JOIN offers o ON o.id = t.offerId
      JOIN users req ON req.id = t.requesterId
      JOIN users off2 ON off2.id = t.offererId
      WHERE t.id = ${id} AND t.isDeleted = 0
    `;
    if (rows.length === 0) return null;
    const r = rows[0];

    // Ratings for this transaction
    const ratings: any[] = await db.query`
      SELECT * FROM ratings WHERE transactionId = ${id} AND isDeleted = 0
    `;

    return {
      id: r.id, postId: r.postId, offerId: r.offerId, requesterId: r.requesterId,
      offererId: r.offererId, status: r.status, requesterDone: r.requesterDone,
      offererDone: r.offererDone, requesterCancel: r.requesterCancel, offererCancel: r.offererCancel,
      completedAt: r.completedAt, cancelledAt: r.cancelledAt, expiresAt: r.expiresAt,
      isDeleted: r.isDeleted, createdAt: r.createdAt, updatedAt: r.updatedAt,
      post: { id: r['post.id'], title: r['post.title'], description: r['post.description'] },
      offer: { id: r['offer.id'], proposalDescription: r['offer.proposalDescription'], counterExchange: r['offer.counterExchange'] },
      requester: {
        id: r['requester.id'], firstName: r['requester.firstName'], lastName: r['requester.lastName'],
        profilePicture: r['requester.profilePicture'], reputationScore: r['requester.reputationScore'],
      },
      offerer: {
        id: r['offerer.id'], firstName: r['offerer.firstName'], lastName: r['offerer.lastName'],
        profilePicture: r['offerer.profilePicture'], reputationScore: r['offerer.reputationScore'],
      },
      ratings,
    };
  }

  // INSERT new transaction
  async create(data: {
    postId: string; offerId: string; requesterId: string; offererId: string; expiresAt: Date;
  }) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.execute`
      INSERT INTO transactions
        (id, postId, offerId, requesterId, offererId, status, requesterDone, offererDone,
         requesterCancel, offererCancel, expiresAt, isDeleted, createdAt, updatedAt)
      VALUES
        (${id}, ${data.postId}, ${data.offerId}, ${data.requesterId}, ${data.offererId},
         'IN_PROGRESS', 0, 0, 0, 0, ${data.expiresAt}, 0, ${now}, ${now})
    `;
    return this.findById(id);
  }

  // UPDATE transaction — dynamic SET
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
    const sql = `UPDATE transactions SET ${setParts.join(', ')} WHERE id = @v${values.length}`;
    values.push(id);

    await db.executeUnsafe(sql, ...values);
    return this.findById(id);
  }

  // SELECT transactions by user (requester or offerer) with pagination
  async findByUser(userId: string, skip: number = 0, take: number = 20) {
    const transactions = await db.query`
      SELECT
        t.id, t.postId, t.offerId, t.requesterId, t.offererId,
        t.status, t.requesterDone, t.offererDone, t.requesterCancel, t.offererCancel,
        t.completedAt, t.cancelledAt, t.expiresAt, t.isDeleted, t.createdAt, t.updatedAt,
        p.id AS [post.id], p.title AS [post.title],
        req.id AS [requester.id], req.firstName AS [requester.firstName],
        req.lastName AS [requester.lastName], req.profilePicture AS [requester.profilePicture],
        off2.id AS [offerer.id], off2.firstName AS [offerer.firstName],
        off2.lastName AS [offerer.lastName], off2.profilePicture AS [offerer.profilePicture]
      FROM transactions t
      JOIN posts p ON p.id = t.postId
      JOIN users req ON req.id = t.requesterId
      JOIN users off2 ON off2.id = t.offererId
      WHERE (t.requesterId = ${userId} OR t.offererId = ${userId}) AND t.isDeleted = 0
      ORDER BY t.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;
    const countResult: any[] = await db.query`
      SELECT COUNT(*) AS total FROM transactions
      WHERE (requesterId = ${userId} OR offererId = ${userId}) AND isDeleted = 0
    `;
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (transactions as any[]).map((row: any) => ({
      id: row.id, postId: row.postId, offerId: row.offerId, requesterId: row.requesterId,
      offererId: row.offererId, status: row.status, requesterDone: row.requesterDone,
      offererDone: row.offererDone, requesterCancel: row.requesterCancel, offererCancel: row.offererCancel,
      completedAt: row.completedAt, cancelledAt: row.cancelledAt, expiresAt: row.expiresAt,
      isDeleted: row.isDeleted, createdAt: row.createdAt, updatedAt: row.updatedAt,
      post: { id: row['post.id'], title: row['post.title'] },
      requester: { id: row['requester.id'], firstName: row['requester.firstName'], lastName: row['requester.lastName'], profilePicture: row['requester.profilePicture'] },
      offerer: { id: row['offerer.id'], firstName: row['offerer.firstName'], lastName: row['offerer.lastName'], profilePicture: row['offerer.profilePicture'] },
    }));
    return { transactions: formatted, total };
  }

  // SOFT DELETE
  async softDelete(id: string) {
    await db.execute`
      UPDATE transactions SET isDeleted = 1, updatedAt = GETDATE() WHERE id = ${id}
    `;
    return { id };
  }

  // SELECT all transactions (admin) with optional status filter + pagination
  async findAll(skip: number = 0, take: number = 20, where?: any) {
    const statusFilter = where?.status ? `AND t.status = '${where.status}'` : '';

    const transactions = await db.queryUnsafe(`
      SELECT
        t.id, t.postId, t.offerId, t.requesterId, t.offererId,
        t.status, t.requesterDone, t.offererDone, t.requesterCancel, t.offererCancel,
        t.completedAt, t.cancelledAt, t.expiresAt, t.isDeleted, t.createdAt, t.updatedAt,
        p.id AS [post.id], p.title AS [post.title],
        req.id AS [requester.id], req.firstName AS [requester.firstName],
        req.lastName AS [requester.lastName], req.profilePicture AS [requester.profilePicture],
        off2.id AS [offerer.id], off2.firstName AS [offerer.firstName],
        off2.lastName AS [offerer.lastName], off2.profilePicture AS [offerer.profilePicture]
      FROM transactions t
      JOIN posts p ON p.id = t.postId
      JOIN users req ON req.id = t.requesterId
      JOIN users off2 ON off2.id = t.offererId
      WHERE t.isDeleted = 0 ${statusFilter}
      ORDER BY t.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `);
    const countResult: any[] = await db.queryUnsafe(`
      SELECT COUNT(*) AS total FROM transactions t WHERE t.isDeleted = 0 ${statusFilter}
    `);
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (transactions as any[]).map((row: any) => ({
      id: row.id, postId: row.postId, offerId: row.offerId, requesterId: row.requesterId,
      offererId: row.offererId, status: row.status, requesterDone: row.requesterDone,
      offererDone: row.offererDone, requesterCancel: row.requesterCancel, offererCancel: row.offererCancel,
      completedAt: row.completedAt, cancelledAt: row.cancelledAt, expiresAt: row.expiresAt,
      isDeleted: row.isDeleted, createdAt: row.createdAt, updatedAt: row.updatedAt,
      post: { id: row['post.id'], title: row['post.title'] },
      requester: { id: row['requester.id'], firstName: row['requester.firstName'], lastName: row['requester.lastName'], profilePicture: row['requester.profilePicture'] },
      offerer: { id: row['offerer.id'], firstName: row['offerer.firstName'], lastName: row['offerer.lastName'], profilePicture: row['offerer.profilePicture'] },
    }));
    return { transactions: formatted, total };
  }

  // UPDATE — expire stale in-progress transactions
  async expireTransactions() {
    const result = await db.execute`
      UPDATE transactions SET status = 'EXPIRED', updatedAt = GETDATE()
      WHERE status = 'IN_PROGRESS' AND expiresAt <= GETDATE() AND isDeleted = 0
    `;
    return { count: result };
  }
}

export const transactionRepository = new TransactionRepository();
