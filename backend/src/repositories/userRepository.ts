import db from '../db/connection';

// ─── User Repository — All Raw SQL (BCNF Schema) ───────────────────────────

export class UserRepository {

  // SELECT single user by ID (with joined program + university names)
  async findById(id: string) {
    const rows: any[] = await db.query`
      SELECT u.*,
             p.name AS program,
             uni.name AS university,
             uni.campus AS campus
      FROM users u
      LEFT JOIN programs p ON p.id = u.programId
      LEFT JOIN universities uni ON uni.id = u.universityId
      WHERE u.id = ${id} AND u.isDeleted = 0
    `;
    if (!rows[0]) return null;
    // Fetch social links
    const links: any[] = await db.query`
      SELECT platform, url FROM user_social_links WHERE userId = ${id}
    `;
    const row = rows[0];
    row.socialLinks = links.length > 0 ? JSON.stringify(Object.fromEntries(links.map(l => [l.platform, l.url]))) : null;
    return row;
  }

  // SELECT single user by email (auth — includes banned/deleted so caller can check)
  async findByEmail(email: string) {
    const rows: any[] = await db.query`
      SELECT u.*,
             p.name AS program,
             uni.name AS university,
             uni.campus AS campus
      FROM users u
      LEFT JOIN programs p ON p.id = u.programId
      LEFT JOIN universities uni ON uni.id = u.universityId
      WHERE u.email = ${email}
    `;
    return rows[0] || null;
  }

  // INSERT new user
  async create(data: {
    email: string; passwordHash: string; firstName: string; lastName: string;
    verificationToken?: string | null; role?: string;
  }) {
    const id = crypto.randomUUID();
    const role = data.role || 'STUDENT';
    const now = new Date();
    await db.execute`
      INSERT INTO users
        (id, email, passwordHash, firstName, lastName, verificationToken,
         role, emailVerified, isBanned, reputationScore, totalExchanges,
         isDeleted, createdAt, updatedAt)
      VALUES
        (${id}, ${data.email}, ${data.passwordHash}, ${data.firstName}, ${data.lastName},
         ${data.verificationToken ?? null},
         ${role}, 0, 0, 0, 0, 0, ${now}, ${now})
    `;
    return this.findById(id);
  }

  // UPDATE user — builds SET clause dynamically
  async update(id: string, data: Record<string, any>) {
    const keys = Object.keys(data);
    if (keys.length === 0) return this.findById(id);

    // Handle social links separately — they go into user_social_links table
    if (data.socialLinks !== undefined) {
      const links = data.socialLinks;
      delete data.socialLinks;
      // Clear existing links and insert new ones
      await db.execute`DELETE FROM user_social_links WHERE userId = ${id}`;
      if (links && typeof links === 'object') {
        const parsed = typeof links === 'string' ? JSON.parse(links) : links;
        for (const [platform, url] of Object.entries(parsed)) {
          if (url) {
            await db.execute`
              INSERT INTO user_social_links (userId, platform, url)
              VALUES (${id}, ${platform}, ${url as string})
            `;
          }
        }
      }
    }

    // Handle program/university lookups — ensure lookup rows exist
    if (data.program !== undefined) {
      const progName = data.program;
      delete data.program;
      if (progName) {
        // Upsert program
        await db.execute`
          IF NOT EXISTS (SELECT 1 FROM programs WHERE name = ${progName})
          INSERT INTO programs (name) VALUES (${progName})
        `;
        const progRows: any[] = await db.query`SELECT id FROM programs WHERE name = ${progName}`;
        if (progRows[0]) data.programId = progRows[0].id;
      } else {
        data.programId = null;
      }
    }

    if (data.university !== undefined || data.campus !== undefined) {
      const uniName = data.university;
      const campusName = data.campus || '';
      delete data.university;
      delete data.campus;
      if (uniName) {
        await db.execute`
          IF NOT EXISTS (SELECT 1 FROM universities WHERE name = ${uniName} AND campus = ${campusName})
          INSERT INTO universities (name, campus) VALUES (${uniName}, ${campusName})
        `;
        const uniRows: any[] = await db.query`SELECT id FROM universities WHERE name = ${uniName} AND campus = ${campusName}`;
        if (uniRows[0]) data.universityId = uniRows[0].id;
      } else {
        data.universityId = null;
      }
    }

    const remaining = Object.keys(data);
    if (remaining.length === 0) return this.findById(id);

    data.updatedAt = new Date();
    const setParts: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(data)) {
      setParts.push(`[${key}] = @v${values.length}`);
      values.push(val);
    }
    const sql = `UPDATE users SET ${setParts.join(', ')} WHERE id = @v${values.length}`;
    values.push(id);

    await db.executeUnsafe(sql, ...values);
    return this.findById(id);
  }

  // SOFT DELETE
  async softDelete(id: string) {
    await db.execute`
      UPDATE users SET isDeleted = 1, updatedAt = GETDATE() WHERE id = ${id}
    `;
    return { id };
  }

  // SELECT all users with optional search filter + pagination (admin)
  async findAll(params: { skip?: number; take?: number; where?: any }) {
    const { skip = 0, take = 20, where } = params;
    const conditions: string[] = ['u.isDeleted = 0'];
    if (where?.OR && Array.isArray(where.OR)) {
      const orParts: string[] = [];
      for (const cond of where.OR) {
        if (cond.firstName?.contains) orParts.push(`u.firstName LIKE '%${cond.firstName.contains}%'`);
        if (cond.lastName?.contains)  orParts.push(`u.lastName LIKE '%${cond.lastName.contains}%'`);
        if (cond.email?.contains)     orParts.push(`u.email LIKE '%${cond.email.contains}%'`);
      }
      if (orParts.length > 0) conditions.push(`(${orParts.join(' OR ')})`);
    }
    const whereClause = conditions.join(' AND ');

    const users = await db.queryUnsafe(`
      SELECT u.id, u.email, u.firstName, u.lastName, u.profilePicture, u.bio, u.batch,
             p.name AS program, u.section,
             uni.name AS university, uni.campus AS campus,
             u.role, u.isBanned, u.reputationScore,
             u.totalExchanges, u.createdAt
      FROM users u
      LEFT JOIN programs p ON p.id = u.programId
      LEFT JOIN universities uni ON uni.id = u.universityId
      WHERE ${whereClause}
      ORDER BY u.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `);
    const countResult: any[] = await db.queryUnsafe(`
      SELECT COUNT(*) AS total FROM users u WHERE ${whereClause}
    `);
    return { users: users as any[], total: Number(countResult[0]?.total ?? 0) };
  }

  // SELECT top users by reputation (leaderboard)
  async getLeaderboard(limit: number) {
    return db.query`
      SELECT u.id, u.firstName, u.lastName, u.profilePicture,
             uni.name AS university,
             u.reputationScore, u.totalExchanges
      FROM users u
      LEFT JOIN universities uni ON uni.id = u.universityId
      WHERE u.isDeleted = 0 AND u.isBanned = 0 AND u.totalExchanges > 0
      ORDER BY u.reputationScore DESC
      OFFSET 0 ROWS FETCH NEXT ${limit} ROWS ONLY
    `;
  }

  // Recalculate reputation via stored procedure
  async updateReputation(userId: string) {
    try {
      await db.callProcedure('sp_RecalculateReputation', { userId });
    } catch {
      // Fallback to inline SQL if SP not available
      const ratingStats: any[] = await db.query`
        SELECT ISNULL(AVG(CAST(score AS FLOAT)), 0) AS avgRating,
               COUNT(score) AS ratingCount
        FROM ratings
        WHERE receiverId = ${userId} AND isDeleted = 0
      `;
      const avgRating = ratingStats[0]?.avgRating ?? 0;

      const exchangeStats: any[] = await db.query`
        SELECT COUNT(*) AS exchangeCount FROM transactions
        WHERE (requesterId = ${userId} OR offererId = ${userId}) AND status = 'SUCCESSFUL'
      `;
      const exchangeCount = Number(exchangeStats[0]?.exchangeCount ?? 0);

      const normalizedExchanges = Math.min(exchangeCount / 50, 1) * 5;
      const reputationScore = Math.round((avgRating * 0.6 + normalizedExchanges * 0.4) * 100) / 100;

      await db.execute`
        UPDATE users
        SET reputationScore = ${reputationScore}, totalExchanges = ${exchangeCount}, updatedAt = GETDATE()
        WHERE id = ${userId}
      `;
    }
    return this.findById(userId);
  }
}

export const userRepository = new UserRepository();
