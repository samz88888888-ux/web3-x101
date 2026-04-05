VIP升级卡信息
1:/api/v1/box/vipCardInfo GET
export interface ApifoxModel {
    code: number;
    data: Data;
    local: string;
    message: string;
    [property: string]: any;
}

export interface Data {
    /**
     * 是否可以升级
     */
    canUpgrade: boolean;
    /**
     * 已用卡
     */
    expiredCardCount: number;
    /**
     * 升级所需卡量
     */
    needVipCardNum: number;
    /**
     * 下个等级ID
     */
    nextLevelId: number;
    /**
     * 下个等级名称
     */
    nextLevelName: string;
    /**
     * 当前等级ID
     */
    nowLevelId: number;
    /**
     * 当前等级名称
     */
    nowLevelName: string;
    /**
     * 可用卡
     */
    userCardCount: number;
    [property: string]: any;
}

使用VIP卡升级:/api/v1/box/vipCardUpgrade POST

VIP卡升级日志:/api/v1/box/vipCardLog GET
export interface ApifoxModel {
    /**
     * 登录token
     */
    Authorization?: string;
    /**
     * 语言版本
     */
    LANG?: string;
    [property: string]: any;
}