/**
 * New Day 集成初始化组件
 * 只在用户登录 AllinONE 后才初始化 New Day 集成
 */

import { useEffect, useState, useContext } from 'react';
import { newDayWalletIntegrationService } from '@/services/newDayWalletIntegration';
import { newDayInventorySyncService } from '@/services/newDayInventorySync';
import { crossPlatformAuthService } from '@/services/crossPlatformAuthService';
import { AuthContext } from '@/contexts/authContext';

interface NewDayIntegrationInitProps {
  autoSyncInterval?: number; // 自动同步间隔（毫秒）
}

export default function NewDayIntegrationInit({
  autoSyncInterval = 30000 // 默认 30 秒
}: NewDayIntegrationInitProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isAuthenticated, currentUser } = useContext(AuthContext);

  useEffect(() => {
    let stopInventorySync: (() => void) | null = null;

    const initialize = async () => {
      try {
        // 1. 检查登录状态 - 未登录不初始化任何同步
        const isUserLoggedIn = isAuthenticated && currentUser;

        if (!isUserLoggedIn) {
          console.log('ℹ️ AllinONE 用户未登录，跳过 New Day 集成初始化');
          // 确保同步已停止
          newDayWalletIntegrationService.stopAutoSync();
          return;
        }

        console.log('🚀 AllinONE 用户已登录:', currentUser.username);

        // 2. 尝试自动登录 New Day（仅对已登录用户）
        try {
          const token = await crossPlatformAuthService.generateNewDayToken({
            userId: currentUser.id,
            username: currentUser.username,
            email: currentUser.email || `${currentUser.username}@test.com`,
            platform: 'allinone'
          });

          if (token) {
            console.log('✅ New Day 自动登录成功');
          } else {
            console.warn('⚠️ New Day token 获取失败');
          }
        } catch (error) {
          console.warn('⚠️ New Day 自动登录失败:', error);
        }

        // 3. 初始化钱包同步
        await newDayWalletIntegrationService.initialize();

        // 4. 启动钱包自动同步（实时同步 New Day 余额）
        newDayWalletIntegrationService.startAutoSync(autoSyncInterval);
        console.log('🔄 New Day 钱包自动同步已启动');

        // 5. 初始化库存同步
        await newDayInventorySyncService.initialize();

        // 6. 启动库存自动同步
        stopInventorySync = await newDayInventorySyncService.autoSync(autoSyncInterval);

        setIsInitialized(true);
        console.log('✅ New Day 集成初始化完成');
      } catch (error) {
        console.error('❌ New Day 集成初始化失败:', error);
      }
    };

    // 根据登录状态启动或停止同步
    if (isAuthenticated && currentUser) {
      // 用户已登录，执行初始化
      initialize();
    } else {
      // 用户未登录，确保所有同步已停止
      console.log('ℹ️ 用户未登录，停止所有 New Day 同步');
      newDayWalletIntegrationService.stopAutoSync();
      if (stopInventorySync) {
        stopInventorySync();
        stopInventorySync = null;
      }
      setIsInitialized(false); // 重置初始化状态，以便下次登录时重新初始化
    }

    // 清理函数
    return () => {
      if (stopInventorySync) {
        stopInventorySync();
      }
      // 停止钱包自动同步
      newDayWalletIntegrationService.stopAutoSync();
    };
  }, [autoSyncInterval, isAuthenticated, currentUser]);

  // 这个组件不渲染任何内容
  return null;
}
