const path = require('path');

module.exports = {
    mode: "development",
    entry: {
        main: [path.resolve(__dirname, "./src/main.ts"), path.resolve(__dirname, "./src/ui.ts")],
        style: path.resolve(__dirname, "./src/style.ts")
    },
    output: {
        path: path.resolve(__dirname, "./public/dist"),
        filename: "[name].js",
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.(scss)$/,
                use: [{loader: 'style-loader'}, {loader: 'css-loader'}, {loader: 'sass-loader'}]
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[path]/[name].[ext]",
                        },
                    },
                ],
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    }
};

