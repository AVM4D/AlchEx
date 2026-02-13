import cron from 'node-cron';
import { postRepository } from '../repositories/postRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { offerRepository } from '../repositories/offerRepository';
import prisma from '../prisma/client';

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

        // Also update related posts
        await prisma.post.updateMany({
          where: {
            transaction: { status: 'EXPIRED' },
            status: 'IN_PROGRESS',
          },
          data: { status: 'EXPIRED' },
        });
      }
    } catch (error) {
      console.error('[Cron] Error expiring transactions:', error);
    }
  });

  // Leaderboard snapshot - daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const topUsers = await prisma.user.findMany({
        where: { isDeleted: false, isBanned: false, totalExchanges: { gt: 0 } },
        orderBy: { reputationScore: 'desc' },
        take: 100,
        select: {
          id: true,
          reputationScore: true,
          totalExchanges: true,
        },
      });

      const ratings = await prisma.rating.groupBy({
        by: ['receiverId'],
        _avg: { score: true },
      });
      const ratingMap = new Map(ratings.map((r) => [r.receiverId, r._avg.score || 0]));

      const snapshots = topUsers.map((user, index) => ({
        userId: user.id,
        rank: index + 1,
        reputationScore: user.reputationScore,
        totalExchanges: user.totalExchanges,
        averageRating: ratingMap.get(user.id) || 0,
        period: 'DAILY',
        snapshotDate: new Date(),
      }));

      if (snapshots.length > 0) {
        await prisma.leaderboardSnapshot.createMany({ data: snapshots });
        console.log(`[Cron] Created ${snapshots.length} leaderboard snapshots`);
      }
    } catch (error) {
      console.error('[Cron] Error creating leaderboard snapshot:', error);
    }
  });

  console.log('[Cron] All cron jobs initialized');
}
