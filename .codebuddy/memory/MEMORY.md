# 项目记忆 - AllinONE Gaming Platform

## 项目概述
AllinONE Gaming Platform — 游戏管理平台，包含凭证系统、投票治理、市场交易、钱包管理等功能。

## 技术栈
- React + TypeScript
- localStorage 数据持久化
- sonner toast 通知库
- 无后端，纯前端 SPA

## 投票凭证系统架构
- `voteVoucherService` - 投票凭证核心服务（混合型：即时发放 + 计算型结算）
- `VoteFraudDetector` - 防作弊系统（6条规则）
- `VoteNotifications` - 全局 Toast 通知（挂载于 App.tsx）
- `VoteNotificationPanel` - 个人中心投票面板（挂载于 GamePersonalCenter）
- 事件驱动：`vote-cycle-started`, `vote-cast`, `vote-cycle-settled`

## 文件结构
- `src/voucher-system/` - 凭证系统核心模块
- `src/voucher-system/services/` - 服务层 (VoucherService, VoteVoucherService, VoteFraudDetector)
- `src/voucher-system/types/` - 类型定义 (vote.ts, algorithm.ts, platform.ts, pool.ts)
- `src/components/voucher-system/` - UI 组件
- `src/services/gameProposalService.ts` - 游戏提案投票服务
- `src/pages/GamePersonalCenter.tsx` - 个人中心页面（大型页面，~2300行）
- `src/data/simulatedPlayers.ts` - 55位模拟玩家数据

## 已知限制
- 凭证系统目前仅有增加语义，无用户侧消费功能（P3 未实施）
- 投票系统使用模拟玩家数据，非真实用户
- personal center 文件较大（2300+行），后续可考虑拆分
