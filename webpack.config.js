import path from "path";
import { fileURLToPath } from "url";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Base configuration for both formats
const baseConfig = {
    entry: "./src/index.ts",
    resolve: {
        extensions: [".ts", ".js"],
        plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules|\.test\.ts$|\.test\.d\.ts$/
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
    }
};

// CommonJS build
const commonjsConfig = {
    ...baseConfig,
    name: "commonjs",
    target: "node",
    mode: "production",
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "commonjs2",
        clean: true
    },
    plugins: [
        new CleanWebpackPlugin()
    ]
};

// ESM build
const esmConfig = {
    ...baseConfig,
    name: "esm",
    target: "node",
    mode: "production",
    output: {
        filename: "index.mjs",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "module"
    },
    experiments: {
        outputModule: true
    }
};

export default [commonjsConfig, esmConfig];
