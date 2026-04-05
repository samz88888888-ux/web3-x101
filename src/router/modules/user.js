export default [
  {
    path: '/invite',
    name: 'Invite',
    component: () => import('@/views/user/index.vue'),
    meta: {
      auth: true, // 需要登录
      title: '邀请',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/mine',
    name: 'Mine',
    component: () => import('@/views/wallet/mine.vue'),
    meta: {
      auth: true,
      title: '用户中心',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/walletLog',
    name: 'WalletLog',
    component: () => import('@/views/wallet/walletLog.vue'),
    meta: {
      auth: true,
      title: '用户中心详情',
      keepAlive: false,
      headerTheme: 'dark'
    }
  }
]
