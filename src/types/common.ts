/**
 * @file 公共类型定义
 * @description 用于定义整个应用中可以复用的类型，避免循环依赖和类型不一致。
 */

/**
 * 平台支持的所有货币类型
 * - cash: 现金 (人民币)
 * - gameCoins: 游戏币
 * - computingPower: 算力
 * - aCoins: A币 (平台贡献奖励)
 * - oCoins: O币 (证券类型代币)
 */
export type Currency = 'cash' | 'gameCoins' | 'computingPower' | 'aCoins' | 'oCoins';