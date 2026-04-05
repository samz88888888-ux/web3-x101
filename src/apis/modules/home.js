export default {
  loginMessage: { method: 'get', url: '/api/v1/auth/loginMessage' }, //获取签名字符串
  isRegister: { method: 'post', url: '/api/v1/auth/isRegister' }, //是否注册
  login: { method: 'post', url: '/api/v1/auth/login' }, //登录
  userInfo: { method: 'get', url: '/api/v1/user/info' }, //用户信息
  config: { method: 'get', url: '/api/v1/node/config' }, //节点配置
  nodeBuy: { method: 'get', url: '/api/v1/node/buy' }, //节点购买
  nodeBuyList: { method: 'get', url: '/api/v1/node/buyList' }, //节点购买记录
  teamList: { method: 'get', url: '/api/v1/user/zhiList' }, //团队列表
  bannerList: { method: 'get', url: '/api/v1/common/bannerList' }, //获取banner列表
  noticeList: { method: 'get', url: '/api/v1/common/marquee' }, //获取公告列表
  getKlineList: { method: 'get', url: '/api/v1/common/priceHistory' }, //获取K线列表
  getHomeInfo: { method: 'get', url: '/api/v1/common/mainInfo' } //获取首页信息
}
