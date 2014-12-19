var ExtractTextPlugin = require("extract-text-webpack-plugin");
module.exports = {
  cache: true,
  entry: './app',
  devtool: 'source-map',
  output: {
    filename: 'browser-bundle.js'
  },
  externals: {
  	jquery: "$"
  },
  module: {
    loaders: [
      {test: /\.css$/, loader: "style-loader!css-loader" },
      {test: /\.js$/, loader: 'jsx-loader'}
    ]
  },
};
