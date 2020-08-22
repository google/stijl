// Copyright 2020 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const path = require('path');

const outDir = path.resolve(__dirname, 'extension');

module.exports = {
  mode: 'production',
  target: 'web',
  entry: {
    dashboard: './src/index.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },
  output: {
    filename: '[name].js',
    path: outDir,
  },
  optimization: {
    minimize: false,
  },
  devtool: 'inline-source-map',
};
