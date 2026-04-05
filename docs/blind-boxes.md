现在需要新增一个盲盒抽奖板块 首页的最后一个菜单我改成盲盒抽奖了 帮我新增一个盲盒抽奖的页面 
含前端页面结构、状态管理、API交互
抽盒功能（防止重复点击，并发控制）
抽奖结果弹窗动画
要求:
1:符合当前首页的显示风格展示效果,可以使用我分享给你的exchange/exchange-log.vue 用同一张背景图 然后同样的主体风格 配色可以参考
2:盲盒抽奖过程不需要太花哨 根据我分享给你的exchange/exchange-log.vue当前的显示风格 可以加一个盲盒抽奖的动画效果 有一点小惊喜感

页面排版大概框架:
页面顶部开始展示盲盒的价格/信息之类的数据以及当前账号X101余额 因为抽奖需要消耗当前账户X101余额 所以抽奖结果返回需要响应式更新用户X101余额显示
然后跟着一个盲盒的展示 盲盒可以稍微加一点点上下的动作展示 类似脉冲那种上下
下面有一个立即抽奖的按钮 ==>点击立即抽奖需要有一个盲盒开奖的过程 不需要花里胡哨 让用户有一种惊喜感/抽奖可以抽出来3倍算力/升级卡/X101余额
再下面有一个我的升级卡按钮 点击跳转到一个新页面 这个页面也需要你帮我完成构建 等我们先完成盲盒构建完善第二部再来处理这个
最下面展示记录类 需要加一个tab切换
默认展示抽奖记录 点击可以切换盲盒算力订单展示 都是需要分页

现在是接口请求URL:
1:盲盒配置信息请求接口:/api/v1/box/config GET
返回参数:export interface ApifoxModel {
    code: number;
    data: Data;
    local: string;
    message: string;
    [property: string]: any;
}

export interface Data {
    /**
     * 盲盒抽奖开关 0-关 1-开
     */
    box_enable: string;
    /**
     * 需要支付x101
     */
    needX101: string;
    /**
     * 需要支付多少u的x101
     */
    price: string;
    /**
     * x101余额
     */
    x101_balance: string; //抽奖完成响应式更新账户X101余额
    /**
     * x101当前价格
     */
    x101_price: number;
    [property: string]: any;
}
立即抽奖:/api/v1/box/operate POST

抽奖记录:/api/v1/box/list GET 
export interface ApifoxModel {
    page?: string;
    page_size?: string;
    [property: string]: any;
}
盲盒算力订单:/api/v1/box/boxOrderList GET
export interface ApifoxModel {
    page?: string;
    page_size?: string;
    [property: string]: any;
}
因为盲盒算力订单和抽奖记录我在文档里面暂时看不到返回参数 所以先帮我完成请求 我来根据接口返回字段来辨别

盲盒算力订单返回参数:{
    "code": 200,
    "local": "CN",
    "message": "",
    "data": {
        "list": [
            {
                "base_amount": "100.000000",  //基础算力
                "base_power": "100.000000",
                "computing_day": 61,  //复利天数
                "total_power": "207.019500",  //累计算力
                "created_at": "2026-02-05 02:04:11" //获得时间
            },
            {
                "base_amount": "100.000000",
                "base_power": "100.000000",
                "computing_day": 61,
                "total_power": "207.019500",
                "created_at": "2026-02-05 02:02:41"
            },
            {
                "base_amount": "100.000000",
                "base_power": "100.000000",
                "computing_day": 61,
                "total_power": "207.019500",
                "created_at": "2026-02-05 02:00:30"
            },
            {
                "base_amount": "100.000000",
                "base_power": "100.000000",
                "computing_day": 61,
                "total_power": "207.019500",
                "created_at": "2026-02-05 01:59:51"
            }
        ],
        "total": 4
    }
}

抽奖记录返回数据:
{
    "code": 200,
    "local": "CN",
    "message": "",
    "data": {
        "list": [
            {
                "box_type": "box_vip_result", //对应枚举
                "result_value": 25, //数量Tops/ADX/VIP升级卡
                "sub_x101": "3.856739", //扣除X101数量
                "created_at": "2026-02-05 02:04:36" //时间
            },
            {
                "box_type": "box_vip_result",
                "result_value": 207,
                "adx_price": "3.852500000000000000",
                "x101_price": "25.928637620582000000",
                "sub_x101": "3.856739",
                "created_at": "2026-02-05 02:04:11"
            },
            {
                "box_type": "box_vip_result",
                "result_value": 207,
                "adx_price": "3.852500000000000000",
                "x101_price": "25.928637620582000000",
                "sub_x101": "3.856739",
                "created_at": "2026-02-05 02:02:41"
            },
            {
                "box_type": "box_vip_result",
                "result_value": 207,
                "adx_price": "3.852500000000000000",
                "x101_price": "25.928637620582000000",
                "sub_x101": "3.856739",
                "created_at": "2026-02-05 02:00:30"
            },
            {
                "box_type": "box_vip_result",
                "result_value": 207,
                "adx_price": "3.852500000000000000",
                "x101_price": "25.928637620582000000",
                "sub_x101": "3.856739",
                "created_at": "2026-02-05 01:59:51"
            },
            {
                "box_type": "box_vip_result",
                "result_value": 1,
                "adx_price": "3.852500000000000000",
                "x101_price": "25.928637620582000000",
                "sub_x101": "3.856739",
                "created_at": "2026-02-05 01:55:05"
            },
            {
                "box_type": "box_vip_result",
                "result_value": 1,
                "adx_price": "3.852500000000000000",
                "x101_price": "25.928637620582000000",
                "sub_x101": "3.856739",
                "created_at": "2026-02-05 01:46:00"
            },
            {
                "box_type": "box_vip_result",
                "result_value": 1,
                "adx_price": "3.852500000000000000",
                "x101_price": "25.928637620582000000",
                "sub_x101": "3.856739",
                "created_at": "2026-02-05 01:45:24"
            }
        ],
        "total": 8
    }
} 和抽奖展示结果一样 枚举
//抽中ADX
const string BOX_ADX_RESULT = 'box_adx_result';
//抽中算力
const string BOX_POWER_RESULT = 'box_power_result';
//抽中VIP
const string BOX_VIP_RESULT = 'box_vip_result';