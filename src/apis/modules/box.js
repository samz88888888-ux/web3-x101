export default {
  // 获取盲盒配置信息
  getBoxConfig: { method: 'get', url: '/api/v1/box/config' },
  // 立即抽奖
  boxOperate: { method: 'post', url: '/api/v1/box/operate' },
  // 抽奖记录
  getBoxList: { method: 'get', url: '/api/v1/box/list' },
  // 盲盒算力订单
  getBoxOrderList: { method: 'get', url: '/api/v1/box/boxOrderList' },
  // VIP升级卡信息
  getVipCardInfo: { method: 'get', url: '/api/v1/box/vipCardInfo' },
  // 使用VIP卡升级
  vipCardUpgrade: { method: 'post', url: '/api/v1/box/vipCardUpgrade' },
  // VIP卡升级日志
  getVipCardLog: { method: 'get', url: '/api/v1/box/vipCardLog' },
  // VIP卡转账
  vipCardTransfer: { method: 'post', url: '/api/v1/box/vipCardTransfer' },
  // VIP卡转账记录
  getVipCardTransferLog: { method: 'get', url: '/api/v1/box/vipCardTransferLog' }
}
