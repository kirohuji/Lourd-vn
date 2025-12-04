export default {
  pages: [
    'pages/index/index',
    'pages/login/index',
    'pages/admin/resources/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'NQTR Game',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#666',
    selectedColor: '#1890ff',
    backgroundColor: '#fff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      }
    ]
  },
  subPackages: [
    {
      root: 'pages/admin',
      pages: [
        'resources/index',
        'users/index'
      ]
    }
  ],
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序位置接口的效果展示'
    }
  }
}

