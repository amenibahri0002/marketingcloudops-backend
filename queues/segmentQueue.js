const Queue = require('bull');
const { recalculerSegments } = require('../routes/segments');

const segmentQueue = new Queue('segmentQueue', {
  redis: { host: '127.0.0.1', port: 6379 }, // ton Redis
});

segmentQueue.process(async (job) => {
  const { clientId, contactId } = job.data;
  console.log(`Recalcul segments pour clientId=${clientId}, contactId=${contactId}`);
  await recalculerSegments(clientId, contactId);
});

module.exports = segmentQueue;