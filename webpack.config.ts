import path from "path";
import * as webpack from "webpack";

export default () => {
  return {
    mode: "development",
    entry: "./src/index.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "main.js",
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: "asset/inline",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".css"],
    },
  } satisfies webpack.Configuration;
};
