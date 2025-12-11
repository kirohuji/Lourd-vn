// 全局样式
import { Game } from "@drincs/pixi-vn";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Canvas, Text, View } from "@tarojs/components";
import { Suspense, useEffect, useRef, useState } from "react";
import "./app.less";
// console.log(Game);
// 常量定义
const CANVAS_UI_LAYER_NAME = "ui";

// 创建 QueryClient 实例
const queryClient = new QueryClient();

// 简单的加载组件
function SimpleLoadingScreen() {
  return (
    <View
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>加载中...</Text>
    </View>
  );
}

function App(props: { children: React.ReactNode }) {
  const [gameInitialized, setGameInitialized] = useState(false);
  const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
  // 初始化 Game 和 pixi-vn
  useEffect(() => {
    const initGame = async () => {
      try {
        const container = pixiCanvasRef.current;
        // console.log(Container);
        console.log(Game);
        // console.log(canvas);
        if (container) {
          // Game.init(container, {
          //   height: 844,
          //   width: 390,
          //   backgroundColor: "#303030",
          // }).then(() => {
          //   canvas.addLayer(CANVAS_UI_LAYER_NAME, new Container());
          //   setGameInitialized(true);
          //   console.log("Game initialized", gameInitialized);
          // });
        } else {
          // 小程序环境，可能需要延迟初始化或使用其他方式
          console.log("容器未找到，将在页面级别初始化 Game");
          setGameInitialized(true);
        }
      } catch (error) {
        console.error("Game initialization failed:", error);
        setGameInitialized(true); // 即使失败也继续，避免阻塞应用
      }
    };

    initGame();
  }, []);

  console.log(document.createElement("audio").canPlayType);
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<SimpleLoadingScreen />}>
        {props.children}1<Canvas ref={pixiCanvasRef}></Canvas>
      </Suspense>
    </QueryClientProvider>
  );
}

export default App;
