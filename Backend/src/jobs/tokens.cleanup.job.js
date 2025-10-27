// src/jobs/tokens.cleanup.job.js
const cron = require('node-cron');
const prisma = require('../../prisma/client'); 


async function deleteExpiredTokens() {
  console.log('Running a job to delete expired link tokens...');
  try {
    const { count } = await prisma.telegramLinkTicket.deleteMany({
      where: {
        expiresAt: {
          lt: new Date() 
        }
      }
    });

    console.log(`Successfully deleted ${count} expired tokens.`);
  } catch (error) {
    console.error('Error deleting expired tokens:', error);
  }
}


function scheduleTokenCleanup() {
  cron.schedule('0 0 * * *', deleteExpiredTokens);
  console.log('Scheduled token cleanup job to run every day at midnight.');
}

module.exports = { scheduleTokenCleanup };