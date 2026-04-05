export default {
  exchangeInfo: { method: 'get', url: '/api/v1/swap/index' }, // 获取兑换配置信息
  exchangeOperate: { method: 'post', url: '/game-api/exchange/operate' }, // 执行兑换
  exchangeList: { method: 'get', url: '/api/v1/swap/orderList' }, // 兑换记录
  rechargeList: { method: 'get', url: '/game-api/recharge/list' }, // 充值记录
  setEntrustAddress: { method: 'post', url: '/api/v1/swap/entrust' }, // 设置委托地址
  getExchangeOrder: { method: 'post', url: '/api/v1/swap/getOrder' }, // 充值兑换订单

}
