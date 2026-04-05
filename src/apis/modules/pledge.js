export default {
  pledgeInfo: { method: 'get', url: '/game-api/pledge/info' }, // 获取质押信息
  pledgeGetOrder: { method: 'post', url: '/game-api/pledge/getOrder' }, // 生成质押链上支付订单
  pledgeList: { method: 'get', url: '/game-api/pledge/list' }, // 质押记录
  pledgeRedeem: { method: 'post', url: '/game-api/pledge/redeem' } // 赎回质押
}

