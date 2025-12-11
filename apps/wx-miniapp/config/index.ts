import inject from "@rollup/plugin-inject";
import { defineConfig, type UserConfigExport } from "@tarojs/cli";
import path from "path";
import type { Plugin } from "vite";
import vitePluginImp from "vite-plugin-imp";
import devConfig from "./dev";
import prodConfig from "./prod";

// 简化版：直接在入口点注入
const audioPolyfillPlugin = (): Plugin => {
  return {
    name: "audio-polyfill-inject",
    enforce: "pre",
    transform(code, id) {
      // 只处理入口文件
      if (!id.includes("app.tsx") && !id.includes("app.ts")) {
        return null;
      }

      // 如果已经包含 polyfill，跳过
      if (code.includes("audioPolyfill")) {
        return null;
      }

      // 在第一个非注释行之前插入
      const importStatement = 'import "../config/audioPolyfill";\n';

      // 找到第一个 import 或第一个非空非注释行
      const match = code.match(/^(.*?)(import\s|$)/m);
      if (match) {
        return importStatement + code;
      }

      return importStatement + code;
    },
  };
};
// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<"vite">(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<"vite"> = {
    projectName: "wx-miniapp",
    date: "2025-12-11",
    designWidth: 375,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: "src",
    outputRoot: "dist",
    plugins: ["@tarojs/plugin-html"],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: "react",
    compiler: {
      vitePlugins: [
        vitePluginImp({
          libList: [
            {
              libName: "@nutui/nutui-react-taro",
              style: (name) => {
                return `@nutui/nutui-react-taro/dist/esm/${name}/style/css`;
              },
              replaceOldImport: false,
              camel2DashComponentName: false,
            },
          ],
        }),
        // 自动注入 queueMicrotask polyfill，类似 webpack ProvidePlugin
        // 需要自己手动打一个pollyfill，不知道为什么小程序会没有queueMicrotask
        inject({
          queueMicrotask: [path.resolve(__dirname, "pollyfill.ts"), "default"],
        }),
        // 自动注入音频 polyfill
        // 需要自己手动打一个polyfill，不知道为什么小程序会没有 canPlayType
        // audioPolyfillPlugin(),
      ],
      type: "vite",
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {
            selectorBlackList: ["nut-"],
          },
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: "module", // 转换模式，取值为 global/module
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
    },
    h5: {
      publicPath: "/",
      staticDirectory: "static",

      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: "css/[name].[hash].css",
        chunkFilename: "css/[name].[chunkhash].css",
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: "module", // 转换模式，取值为 global/module
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
    },
    rn: {
      appName: "taroDemo",
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        },
      },
    },
  };
  if (process.env.NODE_ENV === "development") {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig);
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig);
});
