/**
 * @file 公共类型定义
 * @description 用于定义整个应用中可以复用的类型，避免循环依赖和类型不一致。
 */

/**
 * 平台支持的所有货币类型
 * - cash: 现金 (人民币)
 * - gameCoins: AllinONE 游戏币
 * - newDayGameCoins: New Day 游戏币
 * - computingPower: 算力
 * - aCoins: A币 (平台贡献奖励)
 * - oCoins: O币 (证券类型代币)
 */
export type Currency = 'cash' | 'gameCoins' | 'newDayGameCoins' | 'computingPower' | 'aCoins' | 'oCoins';

/**
 * 游戏币类型（用于下拉显示）
 */
export interface GameCoinType {
  key: 'gameCoins' | 'newDayGameCoins';
  name: string;
  platform: string;
  icon: string;
  balance: number;
}