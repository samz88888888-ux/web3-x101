export default [
  {
    path: '/blind-box',
    name: 'BlindBox',
    component: () => import('@/views/box/index.vue'),
    meta: {
      auth: true,
      title: '盲盒抽奖',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/upgrade-card',
    name: 'UpgradeCard',
    component: () => import('@/views/box/upgradeCard.vue'),
    meta: {
      auth: true,
      title: '我的升级卡',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/vip-card-transfer',
    name: 'VipCardTransfer',
    component: () => import('@/views/box/vipCardTransfer.vue'),
    meta: {
      auth: true,
      title: 'VIP卡转账',
      keepAlive: false,
      headerTheme: 'dark'
    }
  }
]
