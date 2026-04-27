import cron from 'node-cron';
import db from '../db/connection';

export function initializeCronJobs() {
  // Expire posts every 15 minutes (via stored procedure)
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await db.callProcedure('sp_ExpirePosts', {}, {
        expiredCount: { type: require('mssql').Int },
      });
      if (result.output.expiredCount > 0) {
        console.log(`[Cron] Expired ${result.output.expiredCount} posts`);
      }
    } catch (error) {
      console.error('[Cron] Error expiring posts:', error);
    }
  });

  // Expire stale offers every 15 minutes (via stored procedure)
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await db.callProcedure('sp_ExpireOffers', {}, {
        expiredCount: { type: require('mssql').Int },
      });
      if (result.output.expiredCount > 0) {
        console.log(`[Cron] Expired ${result.output.expiredCount} offers`);
      }
    } catch (error) {
      console.error('[Cron] Error expiring offers:', error);
    }
  });

  // Expire transactions every 30 minutes (via stored procedure — also expires related posts)
  cron.schedule('*/30 * * * *', async () => {
    try {
      const result = await db.callProcedure('sp_ExpireTransactions', {}, {
        expiredCount: { type: require('mssql').Int },
      });
      if (result.output.expiredCount > 0) {
        console.log(`[Cron] Expired ${result.output.expiredCount} transactions`);
      }
    } catch (error) {
      console.error('[Cron] Error expiring transactions:', error);
    }
  });

  // Leaderboard snapshot - daily at midnight (via stored procedure)
  cron.schedule('0 0 * * *', async () => {
    try {
      await db.callProcedure('sp_DailyLeaderboardSnapshot');
      console.log('[Cron] Daily leaderboard snapshot created');
    } catch (error) {
      console.error('[Cron] Error creating leaderboard snapshot:', error);
    }
  });

  console.log('[Cron] All cron jobs initialized');
}
