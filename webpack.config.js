import path from "path";
import { fileURLToPath } from "url";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import DtsBundleWebpack from "dts-bundle-webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: ["**/*"]
        }),
        new DtsBundleWebpack({
            name: "infinityflow",
            main: "dist/**/*.d.ts",
            out: "index.d.ts",
            removeSource: true,
        })
    ]
};

const commonjsConfig = {
    ...baseConfig,
    name: "commonjs",
    target: "node",
    mode: "production",
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "commonjs2" // CommonJS
    }
};

const esmConfig = {
    ...baseConfig,
    name: "esm",
    target: "node",
    mode: "production",
    output: {
        filename: "index.mjs",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "module" // ES Module
    },
    experiments: {
        outputModule: true // Enable ES Module output
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: []
        })
    ]
};

export default [commonjsConfig, esmConfig];
