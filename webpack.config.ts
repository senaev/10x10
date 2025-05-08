import path from 'path';

import * as webpack from 'webpack';

export default () => ({
    mode: 'development',
    entry: './src/10x10/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                // exclude: /node_modules/,
                // include: [
                //     path.resolve(__dirname, 'src'),
                //     path.resolve(__dirname, 'node_modules/senaev-utils'),
                // ],
                use: {
                    loader: 'ts-loader',
                    options: {
                        allowTsInNodeModules: true,
                    },
                },
            },
            {
                test: /\.css$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'postcss-loader',
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/i,
                type: 'asset/inline',
            },
        ],
    },
    resolve: {
        extensions: [
            '.tsx',
            '.ts',
            '.js',
            '.css',
        ],
    },
} satisfies webpack.Configuration);
