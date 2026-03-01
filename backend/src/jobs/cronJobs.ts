import crypto from 'crypto';
import cron from 'node-cron';
import { postRepository } from '../repositories/postRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { offerRepository } from '../repositories/offerRepository';
import db from '../db/connection';

export function initializeCronJobs() {
  // Expire posts every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await postRepository.expirePosts();
      if (result.count > 0) {
        console.log(`[Cron] Expired ${result.count} posts`);
      }
    } catch (error) {
      console.error('[Cron] Error expiring posts:', error);
    }
  });

  // Expire stale offers every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await offerRepository.expireOffers();
      if (result.count > 0) {
        console.log(`[Cron] Expired ${result.count} offers`);
      }
    } catch (error) {
      console.error('[Cron] Error expiring offers:', error);
    }
  });

  // Expire transactions every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      const result = await transactionRepository.expireTransactions();
      if (result.count > 0) {
        console.log(`[Cron] Expired ${result.count} transactions`);

        // Also update related posts whose transaction expired
        await db.execute`
          UPDATE posts SET status = 'EXPIRED', updatedAt = GETDATE()
          WHERE status = 'IN_PROGRESS'
            AND id IN (
              SELECT p.id FROM posts p
              INNER JOIN transactions t ON t.postId = p.id
              WHERE t.status = 'EXPIRED'
            )
        `;
      }
    } catch (error) {
      console.error('[Cron] Error expiring transactions:', error);
    }
  });

  // Leaderboard snapshot - daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      // Fetch top 100 users by reputation
      const topUsers = await db.query<Array<{ id: string; reputationScore: number; totalExchanges: number }>>`
        SELECT TOP 100 id, reputationScore, totalExchanges
        FROM users
        WHERE isDeleted = 0 AND isBanned = 0 AND totalExchanges > 0
        ORDER BY reputationScore DESC
      `;

      // Get average ratings per user
      const ratings = await db.query<Array<{ receiverId: string; avgScore: number }>>`
        SELECT receiverId, AVG(CAST(score AS FLOAT)) AS avgScore
        FROM ratings
        WHERE isDeleted = 0
        GROUP BY receiverId
      `;
      const ratingMap = new Map(ratings.map((r) => [r.receiverId, r.avgScore || 0]));

      // Insert leaderboard snapshots one by one
      let insertedCount = 0;
      const now = new Date();
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const snapshotId = crypto.randomUUID();
        const avgRating = ratingMap.get(user.id) || 0;
        await db.execute`
          INSERT INTO leaderboard_snapshots (id, userId, rank, reputationScore, totalExchanges, averageRating, period, snapshotDate, createdAt)
          VALUES (${snapshotId}, ${user.id}, ${i + 1}, ${user.reputationScore}, ${user.totalExchanges}, ${avgRating}, 'DAILY', ${now}, GETDATE())
        `;
        insertedCount++;
      }
      if (insertedCount > 0) {
        console.log(`[Cron] Created ${insertedCount} leaderboard snapshots`);
      }
    } catch (error) {
      console.error('[Cron] Error creating leaderboard snapshot:', error);
    }
  });

  console.log('[Cron] All cron jobs initialized');
}
