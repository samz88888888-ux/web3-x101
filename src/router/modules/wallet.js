export default [
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
      title: '资金记录',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/exchange',
    name: 'Exchange',
    component: () => import('@/views/wallet/exchange.vue'),
    meta: {
      auth: true,
      title: '兑换',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/exchange-log',
    name: 'ExchangeLog',
    component: () => import('@/views/wallet/exchangeLog.vue'),
    meta: {
      auth: true,
      title: '兑换记录',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/withdrawal',
    name: 'Withdrawal',
    component: () => import('@/views/wallet/withdrawal.vue'),
    meta: {
      auth: true,
      title: '提现',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/transfer',
    name: 'Transfer',
    component: () => import('@/views/wallet/transfer.vue'),
    meta: {
      auth: true,
      title: '转账',
      keepAlive: false,
      headerTheme: 'dark'
    }
  },
  {
    path: '/direct-income-log',
    name: 'DirectIncomeLog',
    component: () => import('@/views/wallet/directIncomeLog.vue'),
    meta: {
      auth: true,
      title: '直推收益记录',
      keepAlive: false,
      headerTheme: 'dark'
    }
  }
]
