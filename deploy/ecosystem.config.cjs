const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'ebs-apply',
      cwd: path.resolve(__dirname, '..'),
      script: 'server/src/index.js',
      node_args: '--disable-warning=ExperimentalWarning',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
