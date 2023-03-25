const webpack = require('webpack');
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    sw: path.resolve(__dirname, "..", "src", "sw.ts"),
    "scripts/content_script": path.resolve(__dirname, "..", "src/scripts/", "content_script.ts")
  },
  output: {
    path: path.join(__dirname, "../dist"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
        process: "process/browser"
    },
    fallback: {
      console: require.resolve("console-browserify"),
      assert: require.resolve("assert/")
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
        process: 'process/browser',
    }),
    new CopyPlugin({
      patterns: [{ from: ".", to: ".", context: "public" }],
    }),
  ],
};
