const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'none',
  entry: './app.js',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'productin'),
    filename: 'bundle.js'
  },
  externals: [nodeExternals()]
};
