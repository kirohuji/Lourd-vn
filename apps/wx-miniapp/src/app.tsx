import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text, View } from "@tarojs/components";
import { useDidHide, useDidShow } from "@tarojs/taro";
import { lazy, Suspense, useEffect } from "react";
// 全局样式
import "./app.less";

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

// 懒加载主内容（可根据需要调整）
const MainContent = lazy(() =>
  Promise.resolve({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  })
);

function App(props: { children: React.ReactNode }) {
  // Taro 生命周期钩子
  useEffect(() => {
    // 应用初始化逻辑
  }, []);

  // 对应 onShow
  useDidShow(() => {
    // 页面显示时的逻辑
  });

  // 对应 onHide
  useDidHide(() => {
    // 页面隐藏时的逻辑
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<SimpleLoadingScreen />}>
        <MainContent>{props.children}</MainContent>
      </Suspense>
    </QueryClientProvider>
  );
}

export default App;
