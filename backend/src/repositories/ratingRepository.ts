import db from '../db/connection';

// ─── Rating Repository — All Raw SQL ───────────────────────────────────────

export class RatingRepository {

  // INSERT new rating
  async create(data: {
    transaction: { connect: { id: string } }; giver: { connect: { id: string } };
    receiver: { connect: { id: string } }; score: number; review?: string;
  }) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.execute`
      INSERT INTO ratings (id, transactionId, giverId, receiverId, score, review, isDeleted, createdAt)
      VALUES (${id}, ${data.transaction.connect.id}, ${data.giver.connect.id},
              ${data.receiver.connect.id}, ${data.score}, ${data.review ?? null}, 0, ${now})
    `;
    return this.findById(id);
  }

  // SELECT single rating by ID with giver, receiver, transaction info
  async findById(id: string) {
    const rows: any[] = await db.query`
      SELECT
        r.id, r.transactionId, r.giverId, r.receiverId, r.score, r.review,
        r.isDeleted, r.createdAt,
        g.id AS [giver.id], g.firstName AS [giver.firstName], g.lastName AS [giver.lastName],
        g.profilePicture AS [giver.profilePicture],
        rc.id AS [receiver.id], rc.firstName AS [receiver.firstName], rc.lastName AS [receiver.lastName],
        rc.profilePicture AS [receiver.profilePicture],
        t.id AS [transaction.id], t.status AS [transaction.status]
      FROM ratings r
      JOIN users g ON g.id = r.giverId
      JOIN users rc ON rc.id = r.receiverId
      JOIN transactions t ON t.id = r.transactionId
      WHERE r.id = ${id} AND r.isDeleted = 0
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id, transactionId: r.transactionId, giverId: r.giverId,
      receiverId: r.receiverId, score: r.score, review: r.review,
      isDeleted: r.isDeleted, createdAt: r.createdAt,
      giver: { id: r['giver.id'], firstName: r['giver.firstName'], lastName: r['giver.lastName'], profilePicture: r['giver.profilePicture'] },
      receiver: { id: r['receiver.id'], firstName: r['receiver.firstName'], lastName: r['receiver.lastName'], profilePicture: r['receiver.profilePicture'] },
      transaction: { id: r['transaction.id'], status: r['transaction.status'] },
    };
  }

  // UPDATE rating — dynamic SET
  async update(id: string, data: Record<string, any>) {
    const keys = Object.keys(data);
    if (keys.length === 0) return this.findById(id);

    const setParts: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(data)) {
      setParts.push(`[${key}] = @v${values.length}`);
      values.push(val);
    }
    const sql = `UPDATE ratings SET ${setParts.join(', ')} WHERE id = @v${values.length}`;
    values.push(id);

    await db.executeUnsafe(sql, ...values);
    return this.findById(id);
  }

  // SOFT DELETE
  async softDelete(id: string) {
    await db.execute`
      UPDATE ratings SET isDeleted = 1 WHERE id = ${id}
    `;
    return { id };
  }

  // SELECT rating by composite unique key (transactionId + giverId)
  async findByTransactionAndGiver(transactionId: string, giverId: string) {
    const rows: any[] = await db.query`
      SELECT * FROM ratings WHERE transactionId = ${transactionId} AND giverId = ${giverId}
    `;
    return rows[0] || null;
  }

  // SELECT ratings received by a user with pagination
  async findByReceiver(receiverId: string, skip: number = 0, take: number = 20) {
    const ratings = await db.query`
      SELECT
        r.id, r.transactionId, r.giverId, r.receiverId, r.score, r.review,
        r.isDeleted, r.createdAt,
        g.id AS [giver.id], g.firstName AS [giver.firstName],
        g.lastName AS [giver.lastName], g.profilePicture AS [giver.profilePicture]
      FROM ratings r
      JOIN users g ON g.id = r.giverId
      WHERE r.receiverId = ${receiverId} AND r.isDeleted = 0
      ORDER BY r.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;
    const countResult: any[] = await db.query`
      SELECT COUNT(*) AS total FROM ratings WHERE receiverId = ${receiverId} AND isDeleted = 0
    `;
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (ratings as any[]).map((row: any) => ({
      id: row.id, transactionId: row.transactionId, giverId: row.giverId,
      receiverId: row.receiverId, score: row.score, review: row.review,
      isDeleted: row.isDeleted, createdAt: row.createdAt,
      giver: {
        id: row['giver.id'], firstName: row['giver.firstName'],
        lastName: row['giver.lastName'], profilePicture: row['giver.profilePicture'],
      },
    }));
    return { ratings: formatted, total };
  }

  // SELECT aggregate stats: AVG, COUNT, distribution by score
  async getStats(receiverId: string) {
    const aggregate: any[] = await db.query`
      SELECT ISNULL(AVG(CAST(score AS FLOAT)), 0) AS averageRating,
             COUNT(score) AS totalRatings
      FROM ratings WHERE receiverId = ${receiverId} AND isDeleted = 0
    `;
    const distribution: any[] = await db.query`
      SELECT score, COUNT(score) AS count
      FROM ratings WHERE receiverId = ${receiverId} AND isDeleted = 0
      GROUP BY score ORDER BY score DESC
    `;
    return {
      averageRating: aggregate[0]?.averageRating ?? 0,
      totalRatings: Number(aggregate[0]?.totalRatings ?? 0),
      distribution: distribution.map((d: any) => ({ score: d.score, count: Number(d.count) })),
    };
  }
}

export const ratingRepository = new RatingRepository();
