export default {
  powerConfig: { method: 'get', url: '/api/v1/power/config' }, // 获取节点信息
  powerGetOrder: { method: 'post', url: '/api/v1/power/getOrder' }, // 生成链上支付订单信息
  powerX101Push: { method: 'post', url: '/api/v1/power/x101push' }, // X101 系统余额支付
  powerOrderList: { method: 'get', url: '/api/v1/power/orderList' }, // 获取节点列表
  lpMiningInfo: { method: 'get', url: '/api/v1/lp/config' }, // 获取LP挖矿信息
  lpMiningGetOrder: { method: 'post', url: '/api/v1/lp/getOrder' }, // 获取LP链上支付订单信息
  lpMiningOrderList: { method: 'get', url: '/api/v1/lp/orderList' }, // 获取LP挖矿订单列表
  lpMiningRedeem: { method: 'post', url: '/api/v1/lp/redeem' }, // 获取LP挖矿赎回
  // 联合挖矿
  jointMiningInfo: { method: 'get', url: '/api/v1/union/config' }, // 获取联合挖矿信息
  jointMiningGetOrder: { method: 'post', url: '/api/v1/union/getOrder' }, // 获取联合挖矿链上支付订单信息
  jointMiningOrderList: { method: 'get', url: '/api/v1/union/orderList' } // 获取联合挖矿订单列表
}
