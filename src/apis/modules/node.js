export default {
  nodeInfo: { method: 'get', url: '/game-api/node/info' }, // 获取节点信息
  nodeGetOrder: { method: 'post', url: '/game-api/node/getOrder' }, // 生成链上支付订单信息
  nodeList: { method: 'get', url: '/game-api/node/list' } // 节点购买记录
}

