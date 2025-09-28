import { useState } from 'react';

interface GameRulesProps {
  gameType: 'match3' | 'puzzle' | 'strategy';
  playerLevel: number;
}

export default function GameRules({ gameType, playerLevel }: GameRulesProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getGameRules = () => {
    switch (gameType) {
      case 'match3':
        return {
          title: '消消乐游戏规则',
          rules: [
            '🎯 目标：在60秒内获得尽可能高的分数',
            '🔄 操作：拖拽相邻的宝石进行交换',
            '💎 消除：3个或更多相同宝石连成一线即可消除',
            '⚡ 连击：连续消除可获得额外分数加成',
            '🏆 算力：根据得分获得相应的算力奖励'
          ],
          items: [
            { name: '普通宝石', icon: '💎', description: '基础消除，每个10分' },
            { name: '特殊宝石', icon: '⭐', description: '4个连消产生，消除整行/列' },
            { name: '彩虹宝石', icon: '🌈', description: '5个连消产生，消除所有同色宝石' },
            { name: '炸弹宝石', icon: '💥', description: 'L/T形消除产生，爆炸消除周围' }
          ],
          difficulty: getDifficultyInfo(playerLevel)
        };
      default:
        return {
          title: '游戏规则',
          rules: ['暂无规则说明'],
          items: [],
          difficulty: { level: 1, description: '简单' }
        };
    }
  };

  const getDifficultyInfo = (level: number) => {
    if (level <= 5) {
      return {
        level: 1,
        description: '新手难度',
        features: ['较多的简单匹配机会', '较长的思考时间', '基础分数倍率']
      };
    } else if (level <= 15) {
      return {
        level: 2,
        description: '进阶难度',
        features: ['增加特殊宝石出现率', '更复杂的布局', '1.2x分数倍率']
      };
    } else if (level <= 30) {
      return {
        level: 3,
        description: '专家难度',
        features: ['更少的匹配机会', '更多障碍物', '1.5x分数倍率']
      };
    } else {
      return {
        level: 4,
        description: '大师难度',
        features: ['极具挑战性的布局', '限制移动次数', '2.0x分数倍率']
      };
    }
  };

  const rules = getGameRules();

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-question-circle"></i>
          <span className="font-medium">游戏规则与道具说明</span>
        </div>
        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} transition-transform`}></i>
      </button>

      {isOpen && (
        <div className="mt-4 bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* 基本规则 */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-book text-blue-500"></i>
                基本规则
              </h4>
              <ul className="space-y-2">
                {rules.rules.map((rule, index) => (
                  <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 道具说明 */}
            {rules.items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-magic-wand-sparkles text-purple-500"></i>
                  道具说明
                </h4>
                <div className="space-y-3">
                  {rules.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 难度信息 */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-orange-500"></i>
                当前难度：{rules.difficulty.description}
              </h4>
              <ul className="space-y-2">
                {'features' in rules.difficulty && rules.difficulty.features.map((feature: string, index: number) => (
                  <li key={index} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
                    <i className="fa-solid fa-check text-green-500 text-xs mt-0.5"></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}