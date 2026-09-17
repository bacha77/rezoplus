import cron from 'node-cron';
import { runPollingLogic } from './src/lib/poller';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('Starting FMCSA background worker...');

// Run every minute for demonstration purposes (in prod: '0 * * * *' for every hour)
cron.schedule('* * * * *', async () => {
  try {
    await runPollingLogic();
  } catch (e) {
    console.error('Worker polling error:', e);
  }
});
