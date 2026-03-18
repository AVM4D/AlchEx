import db from '../db/connection';

// ─── Post Repository — All Raw SQL ─────────────────────────────────────────

const SEARCH_COLUMNS = ['p.title', 'p.description', 'p.whatINeed', 'p.whatIOffer'] as const;

function normalizeSqlTextExpr(column: string) {
  return `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column}, '-', ' '), '_', ' '), '/', ' '), '.', ' '), ',', ' '), ':', ' '), ';', ' '), '(', ' '), ')', ' '))`;
}

function normalizeSearchText(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeSqlLiteral(value: string) {
  return value.replace(/'/g, "''");
}

export class PostRepository {

  // SELECT single post by ID with user info + offers + offer count
  async findById(id: string) {
    // Main post + owner
    const rows: any[] = await db.query`
      SELECT
        p.*, 
        u.id AS [user.id], u.firstName AS [user.firstName], u.lastName AS [user.lastName],
        u.profilePicture AS [user.profilePicture], u.university AS [user.university],
        u.reputationScore AS [user.reputationScore]
      FROM posts p
      JOIN users u ON u.id = p.userId
      WHERE p.id = ${id} AND p.isDeleted = 0
    `;
    if (rows.length === 0) return null;
    const row = rows[0];

    // Offers on this post
    const offers: any[] = await db.query`
      SELECT
        o.id, o.postId, o.userId, o.proposalDescription, o.counterExchange,
        o.status, o.expiresAt, o.createdAt, o.updatedAt,
        u.id AS [user.id], u.firstName AS [user.firstName], u.lastName AS [user.lastName],
        u.profilePicture AS [user.profilePicture], u.reputationScore AS [user.reputationScore]
      FROM offers o
      JOIN users u ON u.id = o.userId
      WHERE o.postId = ${id} AND o.isDeleted = 0
      ORDER BY o.createdAt DESC
    `;

    // Offer count
    const countResult: any[] = await db.query`
      SELECT COUNT(*) AS cnt FROM offers WHERE postId = ${id} AND isDeleted = 0
    `;

    return {
      id: row.id, userId: row.userId, title: row.title, description: row.description,
      whatINeed: row.whatINeed, whatIOffer: row.whatIOffer, category: row.category,
      tags: row.tags, status: row.status, notifyOnOffers: row.notifyOnOffers,
      expiresAt: row.expiresAt, isDeleted: row.isDeleted, createdAt: row.createdAt, updatedAt: row.updatedAt,
      user: {
        id: row['user.id'], firstName: row['user.firstName'], lastName: row['user.lastName'],
        profilePicture: row['user.profilePicture'], university: row['user.university'],
        reputationScore: row['user.reputationScore'],
      },
      offers: offers.map((o: any) => ({
        id: o.id, postId: o.postId, userId: o.userId,
        proposalDescription: o.proposalDescription, counterExchange: o.counterExchange,
        status: o.status, expiresAt: o.expiresAt, createdAt: o.createdAt, updatedAt: o.updatedAt,
        user: {
          id: o['user.id'], firstName: o['user.firstName'], lastName: o['user.lastName'],
          profilePicture: o['user.profilePicture'], reputationScore: o['user.reputationScore'],
        },
      })),
      _count: { offers: Number(countResult[0]?.cnt ?? 0) },
    };
  }

  // INSERT new post
  async create(data: {
    user: { connect: { id: string } };
    title: string; description: string; whatINeed: string; whatIOffer: string;
    category: string; tags?: string | null; expiresAt: Date; notifyOnOffers?: boolean;
  }) {
    const id = crypto.randomUUID();
    const now = new Date();
    const notify = data.notifyOnOffers !== false ? 1 : 0;
    await db.execute`
      INSERT INTO posts
        (id, userId, title, description, whatINeed, whatIOffer, category, tags,
         status, notifyOnOffers, expiresAt, isDeleted, createdAt, updatedAt)
      VALUES
        (${id}, ${data.user.connect.id}, ${data.title}, ${data.description},
         ${data.whatINeed}, ${data.whatIOffer}, ${data.category}, ${data.tags ?? null},
         'ACTIVE', ${notify}, ${data.expiresAt}, 0, ${now}, ${now})
    `;
    return this.findById(id);
  }

  // UPDATE post — dynamic SET
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
    const sql = `UPDATE posts SET ${setParts.join(', ')} WHERE id = @v${values.length}`;
    values.push(id);

    await db.executeUnsafe(sql, ...values);
    return this.findById(id);
  }

  // SOFT DELETE
  async softDelete(id: string) {
    await db.execute`
      UPDATE posts SET isDeleted = 1, updatedAt = GETDATE() WHERE id = ${id}
    `;
    return { id };
  }

  // SELECT all posts — marketplace / my-posts with dynamic filters + pagination
  async findAll(params: {
    skip?: number; take?: number; where?: any; orderBy?: any;
  }) {
    const { skip = 0, take = 20, where, orderBy } = params;

    const conditions: string[] = ['p.isDeleted = 0'];
    if (where?.status) conditions.push(`p.status = '${where.status}'`);
    if (where?.category) conditions.push(`p.category = '${where.category}'`);
    if (where?.userId) conditions.push(`p.userId = '${where.userId}'`);
    if (where?.search && typeof where.search === 'string') {
      const normalizedSearch = normalizeSearchText(where.search);
      const tokens = normalizedSearch.split(' ').filter(Boolean);

      if (normalizedSearch) {
        const normalizedColumns = SEARCH_COLUMNS.map((col) => normalizeSqlTextExpr(col));
        const compactColumns = normalizedColumns.map((col) => `REPLACE(${col}, ' ', '')`);

        const phrasePattern = escapeSqlLiteral(normalizedSearch);
        const compactPattern = escapeSqlLiteral(normalizedSearch.replace(/\s+/g, ''));

        const phraseClause = normalizedColumns
          .map((col) => `${col} LIKE '%${phrasePattern}%'`)
          .join(' OR ');

        const compactClause = compactPattern
          ? compactColumns.map((col) => `${col} LIKE '%${compactPattern}%'`).join(' OR ')
          : '';

        const tokenClauses = tokens.map((token) => {
          const tokenPattern = escapeSqlLiteral(token);
          const rawMatches = SEARCH_COLUMNS
            .map((col) => `LOWER(ISNULL(${col}, '')) LIKE '%${tokenPattern}%'`)
            .join(' OR ');
          const normalizedMatches = normalizedColumns
            .map((col) => `${col} LIKE '%${tokenPattern}%'`)
            .join(' OR ');
          return `((${rawMatches}) OR (${normalizedMatches}))`;
        });

        const tokenAndClause = tokenClauses.length > 0 ? `(${tokenClauses.join(' AND ')})` : '';
        const branches = [`(${phraseClause})`];
        if (compactClause) branches.push(`(${compactClause})`);
        if (tokenAndClause) branches.push(tokenAndClause);

        conditions.push(`(${branches.join(' OR ')})`);
      }
    } else if (where?.OR && Array.isArray(where.OR)) {
      const orParts: string[] = [];
      for (const cond of where.OR) {
        if (cond.title?.contains)       orParts.push(`p.title LIKE '%${cond.title.contains}%'`);
        if (cond.description?.contains) orParts.push(`p.description LIKE '%${cond.description.contains}%'`);
        if (cond.whatINeed?.contains)    orParts.push(`p.whatINeed LIKE '%${cond.whatINeed.contains}%'`);
        if (cond.whatIOffer?.contains)   orParts.push(`p.whatIOffer LIKE '%${cond.whatIOffer.contains}%'`);
      }
      if (orParts.length > 0) conditions.push(`(${orParts.join(' OR ')})`);
    }
    const whereClause = conditions.join(' AND ');

    let orderClause = 'p.createdAt DESC';
    if (orderBy) {
      const key = Object.keys(orderBy)[0];
      const dir = (orderBy as any)[key];
      orderClause = `p.${key} ${dir === 'asc' ? 'ASC' : 'DESC'}`;
    }

    const posts = await db.queryUnsafe(`
      SELECT
        p.id, p.userId, p.title, p.description, p.whatINeed, p.whatIOffer,
        p.category, p.tags, p.status, p.notifyOnOffers, p.expiresAt,
        p.isDeleted, p.createdAt, p.updatedAt,
        u.id AS [user.id], u.firstName AS [user.firstName], u.lastName AS [user.lastName],
        u.profilePicture AS [user.profilePicture], u.university AS [user.university],
        u.reputationScore AS [user.reputationScore],
        ISNULL(oc.offerCount, 0) AS offerCount
      FROM posts p
      JOIN users u ON u.id = p.userId
      LEFT JOIN (
        SELECT postId, COUNT(*) AS offerCount FROM offers WHERE isDeleted = 0 GROUP BY postId
      ) oc ON oc.postId = p.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `);

    const countResult: any[] = await db.queryUnsafe(`
      SELECT COUNT(*) AS total FROM posts p WHERE ${whereClause}
    `);
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (posts as any[]).map((row: any) => ({
      id: row.id, userId: row.userId, title: row.title, description: row.description,
      whatINeed: row.whatINeed, whatIOffer: row.whatIOffer, category: row.category,
      tags: row.tags, status: row.status, notifyOnOffers: row.notifyOnOffers,
      expiresAt: row.expiresAt, isDeleted: row.isDeleted, createdAt: row.createdAt, updatedAt: row.updatedAt,
      user: {
        id: row['user.id'], firstName: row['user.firstName'], lastName: row['user.lastName'],
        profilePicture: row['user.profilePicture'], university: row['user.university'],
        reputationScore: row['user.reputationScore'],
      },
      _count: { offers: row.offerCount },
    }));

    return { posts: formatted, total };
  }

  // Shortcut: SELECT by user
  async findByUserId(userId: string, skip?: number, take?: number) {
    return this.findAll({ skip, take, where: { userId } });
  }

  // UPDATE expired active posts → status = 'EXPIRED'
  async expirePosts() {
    const result = await db.execute`
      UPDATE posts SET status = 'EXPIRED', updatedAt = GETDATE()
      WHERE status = 'ACTIVE' AND expiresAt <= GETDATE() AND isDeleted = 0
    `;
    return { count: result };
  }
}

export const postRepository = new PostRepository();
