import db from '../db/connection';

// ─── Offer Repository — All Raw SQL ────────────────────────────────────────

export class OfferRepository {

  // SELECT single offer by ID with user + post info
  async findById(id: string) {
    const rows: any[] = await db.query`
      SELECT
        o.id, o.postId, o.userId, o.proposalDescription, o.counterExchange,
        o.status, o.expiresAt, o.isDeleted, o.createdAt, o.updatedAt,
        u.id AS [user.id], u.firstName AS [user.firstName], u.lastName AS [user.lastName],
        u.profilePicture AS [user.profilePicture], u.reputationScore AS [user.reputationScore],
        p.id AS [post.id], p.title AS [post.title], p.userId AS [post.userId],
        p.status AS [post.status], p.notifyOnOffers AS [post.notifyOnOffers], p.expiresAt AS [post.expiresAt]
      FROM offers o
      JOIN users u ON u.id = o.userId
      JOIN posts p ON p.id = o.postId
      WHERE o.id = ${id} AND o.isDeleted = 0
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id, postId: r.postId, userId: r.userId,
      proposalDescription: r.proposalDescription, counterExchange: r.counterExchange,
      status: r.status, expiresAt: r.expiresAt, isDeleted: r.isDeleted,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
      user: {
        id: r['user.id'], firstName: r['user.firstName'], lastName: r['user.lastName'],
        profilePicture: r['user.profilePicture'], reputationScore: r['user.reputationScore'],
      },
      post: {
        id: r['post.id'], title: r['post.title'], userId: r['post.userId'],
        status: r['post.status'], notifyOnOffers: r['post.notifyOnOffers'], expiresAt: r['post.expiresAt'],
      },
    };
  }

  // INSERT new offer
  async create(data: {
    post: { connect: { id: string } }; user: { connect: { id: string } };
    proposalDescription: string; counterExchange?: string; expiresAt?: Date;
  }) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.execute`
      INSERT INTO offers
        (id, postId, userId, proposalDescription, counterExchange, status, expiresAt, isDeleted, createdAt, updatedAt)
      VALUES
        (${id}, ${data.post.connect.id}, ${data.user.connect.id}, ${data.proposalDescription},
         ${data.counterExchange ?? null}, 'PENDING', ${data.expiresAt ?? null}, 0, ${now}, ${now})
    `;
    return this.findById(id);
  }

  // UPDATE offer — dynamic SET
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
    const sql = `UPDATE offers SET ${setParts.join(', ')} WHERE id = @v${values.length}`;
    values.push(id);

    await db.executeUnsafe(sql, ...values);
    return this.findById(id);
  }

  // SOFT DELETE
  async softDelete(id: string) {
    await db.execute`
      UPDATE offers SET isDeleted = 1, updatedAt = GETDATE() WHERE id = ${id}
    `;
    return { id };
  }

  // SELECT offer by composite unique key (postId + userId)
  async findByPostAndUser(postId: string, userId: string) {
    const rows: any[] = await db.query`
      SELECT * FROM offers WHERE postId = ${postId} AND userId = ${userId}
    `;
    return rows[0] || null;
  }

  // SELECT all offers on a post (with user info)
  async findByPost(postId: string) {
    const rows: any[] = await db.query`
      SELECT
        o.id, o.postId, o.userId, o.proposalDescription, o.counterExchange,
        o.status, o.expiresAt, o.isDeleted, o.createdAt, o.updatedAt,
        u.id AS [user.id], u.firstName AS [user.firstName], u.lastName AS [user.lastName],
        u.profilePicture AS [user.profilePicture], u.reputationScore AS [user.reputationScore],
        t.id AS [transaction.id]
      FROM offers o
      JOIN users u ON u.id = o.userId
      LEFT JOIN transactions t ON t.offerId = o.id AND t.isDeleted = 0
      WHERE o.postId = ${postId} AND o.isDeleted = 0
      ORDER BY o.createdAt DESC
    `;
    return rows.map((r: any) => ({
      id: r.id, postId: r.postId, userId: r.userId,
      proposalDescription: r.proposalDescription, counterExchange: r.counterExchange,
      status: r.status, expiresAt: r.expiresAt, createdAt: r.createdAt, updatedAt: r.updatedAt,
      user: {
        id: r['user.id'], firstName: r['user.firstName'], lastName: r['user.lastName'],
        profilePicture: r['user.profilePicture'], reputationScore: r['user.reputationScore'],
      },
      transaction: r['transaction.id'] ? { id: r['transaction.id'] } : null,
    }));
  }

  // SELECT offers by user with pagination
  async findByUser(userId: string, skip: number = 0, take: number = 20) {
    const offers = await db.query`
      SELECT
        o.id, o.postId, o.userId, o.proposalDescription, o.counterExchange,
        o.status, o.expiresAt, o.isDeleted, o.createdAt, o.updatedAt,
        p.id AS [post.id], p.title AS [post.title], p.status AS [post.status], p.userId AS [post.userId],
        t.id AS [transaction.id]
      FROM offers o
      JOIN posts p ON p.id = o.postId
      LEFT JOIN transactions t ON t.offerId = o.id AND t.isDeleted = 0
      WHERE o.userId = ${userId} AND o.isDeleted = 0
      ORDER BY o.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;
    const countResult: any[] = await db.query`
      SELECT COUNT(*) AS total FROM offers WHERE userId = ${userId} AND isDeleted = 0
    `;
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (offers as any[]).map((row: any) => ({
      id: row.id, postId: row.postId, userId: row.userId,
      proposalDescription: row.proposalDescription, counterExchange: row.counterExchange,
      status: row.status, expiresAt: row.expiresAt, isDeleted: row.isDeleted,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
      post: { id: row['post.id'], title: row['post.title'], status: row['post.status'], userId: row['post.userId'] },
      transaction: row['transaction.id'] ? { id: row['transaction.id'] } : null,
    }));
    return { offers: formatted, total };
  }

  // UPDATE — reject all other pending offers on this post
  async rejectOtherOffers(postId: string, acceptedOfferId: string) {
    const result = await db.execute`
      UPDATE offers SET status = 'REJECTED', updatedAt = GETDATE()
      WHERE postId = ${postId} AND id != ${acceptedOfferId} AND status = 'PENDING'
    `;
    return { count: result };
  }

  // UPDATE — expire stale pending offers
  async expireOffers() {
    const result = await db.execute`
      UPDATE offers SET status = 'EXPIRED', updatedAt = GETDATE()
      WHERE status = 'PENDING' AND expiresAt <= GETDATE() AND isDeleted = 0
    `;
    return { count: result };
  }
}

export const offerRepository = new OfferRepository();
