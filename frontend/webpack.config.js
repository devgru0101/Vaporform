const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/pages': path.resolve(__dirname, 'src/pages'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/store': path.resolve(__dirname, 'src/store'),
        '@/hooks': path.resolve(__dirname, 'src/hooks'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/assets': path.resolve(__dirname, 'assets'),
        '@shared': path.resolve(__dirname, '../shared/src'),
      },
      fallback: {
        "path": require.resolve("path-browserify"),
        "buffer": require.resolve("buffer"),
        "process": require.resolve("process/browser"),
        "stream": require.resolve("stream-browserify"),
        "util": require.resolve("util"),
        "fs": false,
        "crypto": require.resolve("crypto-browserify"),
      }
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@babel/preset-env',
                  '@babel/preset-react',
                  '@babel/preset-typescript',
                ],
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.worker\.(js|ts)$/,
          use: {
            loader: 'worker-loader',
            options: {
              inline: 'fallback',
            },
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.ico',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public',
            to: '.',
            globOptions: {
              ignore: ['**/index.html'],
            },
          },
          {
            from: 'node_modules/monaco-editor/min/vs',
            to: 'vs',
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          monaco: {
            test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
            name: 'monaco',
            chunks: 'all',
          },
        },
      },
    },
  };
};