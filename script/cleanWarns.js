const schedule = require('node-schedule');
const db = require('../database/db');

// Function to be scheduled
async function task() {
  try {
    console.log('Clean warning...');
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    // Your task goes here
    const clean = await db('warns')
      .where('created_date', '<=', oneYearAgo)
      .del();

    console.log(clean);
  } catch (error) {
    console.error(error);
  }
}

// Function to start the scheduler
function cleanWarns() {
  // Define your schedule rule, e.g., run every minute
  const rule = '* * * * *'; // Runs every minute

  // Schedule the task
  const job = schedule.scheduleJob(rule, task);

  console.log('Scheduler started.');
}

// Export the cleanWarns function
module.exports = {
  cleanWarns,
};
