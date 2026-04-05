export default [
  {
    path: '/power',
    name: 'Power',
    component: () => import('@/views/power/index.vue'),
    meta: {
      auth: true, // 需要登录
      title: '算力认购',
      keepAlive: true,
      headerTheme: 'dark'
    }
  },
  {
    path: '/power-log',
    name: 'PowerLog',
    component: () => import('@/views/power/powerLog.vue'),
    meta: {
      auth: true, // 需要登录
      title: '算力认购记录',
      keepAlive: true,
      headerTheme: 'dark'
    }
  },
  {
    path: '/lp-mining',
    name: 'LpMining',
    component: () => import('@/views/mining/lpMining.vue'),
    meta: {
      auth: true, // 需要登录
      title: 'LP算力',
      keepAlive: true,
      headerTheme: 'dark'
    }
  },
  {
    path: '/power-mining',
    name: 'PowerMining',
    component: () => import('@/views/mining/powerMining.vue'),
    meta: {
      auth: true, // 需要登录
      title: '算力挖矿',
      keepAlive: true,
      headerTheme: 'dark'
    }
  },
  {
    path: '/joint-mining',
    name: 'JointMining',
    component: () => import('@/views/mining/jointMining.vue'),
    meta: {
      auth: true, // 需要登录
      title: '联合挖矿',
      keepAlive: true,
      headerTheme: 'dark'
    }
  }
]
