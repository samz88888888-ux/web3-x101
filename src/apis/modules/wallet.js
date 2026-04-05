export default {
  withdrawConfig: { method: 'get', url: '/api/v1/withdraw/withdrawConfig' }, // 提现配置
  doWithdraw: { method: 'post', url: '/api/v1/withdraw/apply' }, // 提现
  withdrawList: { method: 'get', url: '/api/v1/withdraw/list' }, // 提现记录
  getIncomeLog: { method: 'get', url: '/api/v1/user/incomeList' }, // 收益记录
  getDirectIncomeLog: { method: 'get', url: '/api/v1/user/zhiIncome' }, // 直推收益记录
}
