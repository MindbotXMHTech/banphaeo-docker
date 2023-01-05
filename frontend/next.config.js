/** @type {import('next').NextConfig} */
// https://stackoverflow.com/questions/59802586/how-do-i-run-cron-scheduled-task-in-nextjs-9
// const cron = require('node-cron');

// cron.schedule('*/3 * * * * *', function () {
//   console.log('Say scheduled hello')
// });

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
