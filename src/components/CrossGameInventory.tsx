/**
 * 跨游戏道具展示组件
 * 在个人中心显示来自不同游戏的道具（包括 New Day），支持上架到市场
 */

import React, { useState, useEffect } from 'react';
import { marketplaceService } from '@/services/marketplaceService';
import { allinone_marketplaceService } from '@/services/allinone_marketplaceService';
import { newDayInventorySyncService } from '@/services/newDayInventorySync';
import { newDayService } from '@/services/newDayService';
import { newDayApiService } from '@/services/newDayApiService';
import { inventoryApiService } from '@/services/inventoryApiService';

interface CrossGameItem {
  id: string;
  name: string;
  description: string;
  gameSource: string;
  gameName: string;
  category: string;
  rarity: string;
  icon?: string;
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    speed?: number;
  };
  uses?: number;
  maxUses?: number;
  createdAt: Date;
  syncStatus?: 'not_synced' | 'syncing' | 'synced' | 'failed';
  syncedAt?: Date;
  originalItemId?: string; // 原始道具ID，用于同步到New Day时识别
}

interface CrossGameInventoryProps {
  userId?: string;
}

// 货币类型定义
type CurrencyType = 'computingPower' | 'newDayGameCoins' | 'gameCoins' | 'cash' | 'oCoins';

interface CurrencyOption {
  value: CurrencyType;
  label: string;
  icon: string;
  gameSource: 'all' | 'allinone' | 'newday';
}

export default function CrossGameInventory({ userId = 'current-user-id' }: CrossGameInventoryProps) {
  const [items, setItems] = useState<CrossGameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGame, setFilterGame] = useState<'all' | 'allinone' | 'newday'>('all');
  const [listingItem, setListingItem] = useState<CrossGameItem | null>(null);
  const [listingPrice, setListingPrice] = useState<number>(100);
  const [currencyType, setCurrencyType] = useState<CurrencyType>('computingPower');
  const [targetMarket, setTargetMarket] = useState<'newday' | 'allinone'>('allinone');
  const [isListing, setIsListing] = useState(false); // 防止重复提交

  // 使用 ref 来跟踪是否已经加载过数据，避免重复加载
  const hasLoaded = React.useRef(false);
  const lastLoadTime = React.useRef(0);
  const listedItemIds = React.useRef<Set<string>>(new Set()); // 记录已上架的道具ID

  // 货币类型选项
  const getCurrencyOptions = (gameSource: 'newday' | 'allinone'): CurrencyOption[] => {
    if (gameSource === 'newday') {
      return [
        { value: 'newDayGameCoins', label: 'New Day 游戏币', icon: '🐉', gameSource: 'newday' },
        { value: 'computingPower', label: '算力', icon: '⚡', gameSource: 'all' },
      ];
    } else {
      return [
        { value: 'gameCoins', label: '游戏币', icon: '🎮', gameSource: 'allinone' },
        { value: 'computingPower', label: '算力', icon: '⚡', gameSource: 'all' },
        { value: 'cash', label: '现金', icon: '💵', gameSource: 'allinone' },
        { value: 'oCoins', label: 'O币', icon: '⭕', gameSource: 'allinone' },
      ];
    }
  };

  // 从 sessionStorage 恢复已上架道具列表
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('crossGameInventory_listedItems');
      if (stored) {
        const ids = JSON.parse(stored);
        listedItemIds.current = new Set(ids);
        console.log('📦 从 sessionStorage 恢复已上架道具:', ids);
      }
    } catch (e) {
      console.warn('⚠️ 读取 sessionStorage 失败:', e);
    }
  }, []);

  useEffect(() => {
    // 如果已经加载过数据且距离上次加载不到 5 秒，则跳过
    const now = Date.now();
    if (hasLoaded.current && now - lastLoadTime.current < 5000) {
      console.log('⏱️ 跳过重复加载，上次加载:', now - lastLoadTime.current, 'ms 前');
      return;
    }

    loadInventory();
    hasLoaded.current = true;
    lastLoadTime.current = now;

    // 监听库存更新事件
    const handleInventoryUpdate = () => {
      console.log('📦 收到库存更新事件，重新加载...');
      hasLoaded.current = false; // 允许强制刷新
      loadInventory();
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
  }, [userId]);

  // 清理过期的已上架道具记录（超过10分钟）
  useEffect(() => {
    const cleanup = () => {
      try {
        const stored = sessionStorage.getItem('crossGameInventory_listedItems_timestamp');
        if (stored) {
          const timestamp = parseInt(stored);
          if (Date.now() - timestamp > 10 * 60 * 1000) { // 10分钟
            console.log('🧹 清理过期的已上架道具记录');
            sessionStorage.removeItem('crossGameInventory_listedItems');
            sessionStorage.removeItem('crossGameInventory_listedItems_timestamp');
            listedItemIds.current.clear();
          }
        }
      } catch (e) {
        console.warn('⚠️ 清理 sessionStorage 失败:', e);
      }
    };

    cleanup();
    const interval = setInterval(cleanup, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);

      // 使用 New Day 库存同步服务获取合并库存
      const mergedInventory = await newDayInventorySyncService.getMergedInventory();

      // 转换 CrossGameInventoryItem 为 CrossGameItem
      const convertedItems: CrossGameItem[] = mergedInventory.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        gameSource: item.gameSource,
        gameName: item.gameName,
        category: item.category,
        rarity: item.rarity,
        icon: item.icon,
        stats: item.stats,
        uses: item.uses,
        maxUses: item.maxUses,
        createdAt: item.obtainedAt,
        syncStatus: item.syncStatus,
        syncedAt: item.syncedAt
      }));

      // 过滤掉已上架的道具
      const filteredItems = convertedItems.filter(item => {
        const isListed = listedItemIds.current.has(item.id);
        if (isListed) {
          console.log('🔍 跳过已上架道具:', item.id, item.name);
        }
        return !isListed;
      });

      console.log('📦 CrossGameInventory 加载库存:', {
        total: filteredItems.length,
        original: mergedInventory.length,
        filteredOut: mergedInventory.length - filteredItems.length,
        newDay: filteredItems.filter(i => i.gameSource === 'newday').length,
        allinone: filteredItems.filter(i => i.gameSource === 'allinone').length,
        listedIds: Array.from(listedItemIds.current),
        items: filteredItems.map(i => ({ id: i.id, name: i.name, source: i.gameSource }))
      });

      setItems(filteredItems);
    } catch (error) {
      console.error('加载跨游戏库存失败:', error);
      // 降级到本地数据
      const crossGameItems: CrossGameItem[] = [];

      const allinoneItems = await marketplaceService.getUserInventory(userId);
      allinoneItems.forEach(item => {
        crossGameItems.push({
          id: item.id,
          name: item.name,
          description: item.description,
          gameSource: item.gameSource || 'allinone',
          gameName: item.gameSource === 'newday' ? 'New Day' : 'AllinONE',
          category: item.category,
          rarity: item.rarity,
          icon: (item as any).icon,
          createdAt: item.listedAt
        });
      });

      const crossPlatformItems = await allinone_marketplaceService.getCrossPlatformInventory();
      crossPlatformItems.forEach(item => {
        crossGameItems.push({
          id: item.id,
          name: item.name,
          description: item.description,
          gameSource: item.gameSource || 'newday',
          gameName: item.gameSource === 'newday' ? 'New Day' : 'AllinONE',
          category: item.category,
          rarity: item.rarity,
          stats: (item as any).stats,
          createdAt: item.listedAt
        });
      });

      const uniqueItems = crossGameItems.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      setItems(uniqueItems);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string): string => {
    const rarityColors: Record<string, string> = {
      'legendary': 'text-orange-400 border-orange-400',
      'epic': 'text-purple-400 border-purple-400',
      'rare': 'text-blue-400 border-blue-400',
      'uncommon': 'text-green-400 border-green-400',
      'common': 'text-gray-400 border-gray-400',
      '神话': 'text-orange-400 border-orange-400',
      '传说': 'text-purple-400 border-purple-400',
      '史诗': 'text-blue-400 border-blue-400',
      '稀有': 'text-green-400 border-green-400',
      '普通': 'text-gray-400 border-gray-400'
    };
    return rarityColors[rarity] || 'text-gray-400 border-gray-400';
  };

  const getGameIcon = (gameSource: string): string => {
    return gameSource === 'newday' ? '🐉' : '🎮';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'weapon': '⚔️',
      'armor': '🛡️',
      'consumable': '🧪',
      'material': '💎',
      'rare': '⭐',
      'default': '📦'
    };
    return icons[category] || icons['default'];
  };

  const filteredItems = filterGame === 'all' 
    ? items 
    : items.filter(item => item.gameSource === filterGame);

  const handleListItem = async () => {
    if (!listingItem || !listingPrice || listingPrice <= 0) {
      alert('请输入有效的价格');
      return;
    }

    // 防止重复提交
    if (isListing) {
      console.log('⏳ 正在上架中，请勿重复点击');
      return;
    }

    setIsListing(true);

    try {
      let success = false;

      // 根据目标市场和货币类型构建价格对象
      const priceObj: any = {};
      priceObj[currencyType] = listingPrice;

      // 根据目标市场决定上架到哪里
      if (targetMarket === 'newday') {
        // 上架到 New Day 市场
        console.log('🔄 开始上架到 New Day 市场:', {
          name: listingItem.name,
          currency: currencyType,
          price: listingPrice
        });

        const result = await newDayService.listItemToNewDayMarket({
          name: listingItem.name,
          description: listingItem.description,
          itemType: listingItem.category,
          price: priceObj
        });

        if (result) {
          console.log('✅ New Day 市场上架成功:', result);
          success = true;
        } else {
          console.error('❌ New Day 市场上架返回空结果');
          alert('上架失败：服务器未返回有效数据');
          return;
        }
      } else {
        // 上架到 AllinONE 市场
        console.log('🔄 开始上架到 AllinONE 市场:', {
          name: listingItem.name,
          currency: currencyType,
          price: listingPrice
        });

        // 如果是 New Day 道具上架到 AllinONE，需要扣除 New Day 库存
        if (listingItem.gameSource === 'newday') {
          const { newDayApiService } = await import('@/services/newDayApiService');
          console.log('🔄 扣除 New Day 库存:', listingItem.id);
          const transferResult = await newDayApiService.transferItem({
            itemId: listingItem.id,
            targetPlatform: 'allinone',
            quantity: 1
          });

          if (!transferResult.success) {
            console.error('❌ 扣除 New Day 库存失败:', transferResult.message);
            alert('扣除 New Day 库存失败，请重试');
            return;
          }
          console.log('✅ New Day 库存扣除成功');
        }

        // 上架到 AllinONE 市场
        await allinone_marketplaceService.listItemToCrossPlatform({
          name: listingItem.name,
          description: listingItem.description,
          itemType: listingItem.category,
          imageUrl: listingItem.icon,
          price: priceObj,
        }, listingItem.id, listingItem.gameSource as 'allinone' | 'newday');

        success = true;
      }

      // 只有上架成功后才从库存中移除
      if (success) {
        // 记录已上架的道具 ID（使用 sessionStorage 持久化）
        listedItemIds.current.add(listingItem.id);
        try {
          sessionStorage.setItem('crossGameInventory_listedItems', JSON.stringify(Array.from(listedItemIds.current)));
          sessionStorage.setItem('crossGameInventory_listedItems_timestamp', Date.now().toString());
          console.log('💾 已保存已上架道具到 sessionStorage:', Array.from(listedItemIds.current));
        } catch (e) {
          console.warn('⚠️ 保存 sessionStorage 失败:', e);
        }

        // 从库存中移除（只更新前端状态，不立即刷新API数据）
        const updatedItems = items.filter(i => i.id !== listingItem.id);
        setItems(updatedItems);

        setListingItem(null);
        setListingPrice(100);
        setCurrencyType('computingPower');
        setTargetMarket('allinone');
        const currencyLabel = getCurrencyOptions(listingItem.gameSource === 'newday' ? 'newday' : 'allinone')
          .find(c => c.value === currencyType)?.label || currencyType;
        alert(`成功上架 "${listingItem.name}" 到${targetMarket === 'newday' ? 'New Day' : 'AllinONE'}市场\n价格: ${listingPrice} ${currencyLabel}`);

        // 触发库存更新事件
        window.dispatchEvent(new CustomEvent('inventoryUpdated', {
          detail: { updatedItem: listingItem }
        }));
      }
    } catch (error) {
      console.error('上架失败:', error);
      alert('上架失败，请稍后重试');
    } finally {
      setIsListing(false);
    }
  };

  /**
   * 同步道具到 New Day 游戏
   */
  const handleSyncToNewDay = async (item: CrossGameItem) => {
    if (!item.syncStatus || item.syncStatus === 'synced') {
      alert('此道具已同步到 New Day');
      return;
    }

    const confirmed = confirm(
      `⚠️ 确认将此道具同步到 New Day 游戏？\n\n` +
      `道具: ${item.name}\n` +
      `稀有度: ${item.rarity}\n\n` +
      `同步后：\n` +
      `• New Day 游戏中将显示此道具\n` +
      `• 道具可在 New Day 中使用\n` +
      `• 此操作不可撤销`
    );

    if (!confirmed) return;

    try {
      // 1. 更新状态为同步中
      console.log('🔄 正在更新同步状态为 syncing，itemId:', item.id);
      await inventoryApiService.updateSyncStatus(item.id, 'syncing');
      console.log('✅ 同步状态更新为 syncing 成功');
      setItems(items.map(i => 
        i.id === item.id ? { ...i, syncStatus: 'syncing' } : i
      ));

      // 2. 调用 New Day API 同步道具
      // 使用原始道具ID或当前ID作为唯一标识，确保New Day可以正确识别和去重
      const syncItemId = item.originalItemId || item.id;
      
      // 清理 emoji，避免数据库编码问题
      const sanitizeEmoji = (str: string | undefined): string | undefined => {
        if (!str) return undefined;
        // 移除 emoji 字符（Unicode emoji 范围）
        return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || undefined;
      };
      
      // 将 emoji 转换为文字描述
      const getIconName = (icon?: string): string => {
        const emojiMap: Record<string, string> = {
          '💎': 'gem',
          '💍': 'ring',
          '⚔️': 'sword',
          '🗡️': 'dagger',
          '🛡️': 'shield',
          '❤️': 'heart',
          '💚': 'green_heart',
          '💙': 'blue_heart',
          '🧪': 'potion',
          '🧫': 'culture',
          '🔮': 'crystal',
          '⚗️': 'alchemy',
          '📜': 'scroll',
          '📄': 'document',
          '🏺': 'amphora',
          '🔋': 'battery',
          '⚡': 'lightning',
          '🔥': 'fire',
          '❄️': 'ice',
          '🌿': 'herb',
          '🍀': 'clover',
          '🌸': 'flower',
          '⭐': 'star',
          '🌟': 'glowing_star',
          '✨': 'sparkles',
          '💰': 'money',
          '💵': 'dollar',
          '💴': 'yen',
          '💶': 'euro',
          '💷': 'pound',
          '💳': 'card',
          '🔑': 'key',
          '🗝️': 'old_key',
          '🎁': 'gift',
          '🎀': 'ribbon',
          '📦': 'package',
          '📫': 'mailbox',
          '📪': 'mailbox_closed',
          '📬': 'mailbox_with_mail',
          '📭': 'mailbox_with_no_mail',
          '📮': 'postbox',
          '🗳️': 'ballot_box',
          '✏️': 'pencil',
          '✒️': 'black_nib',
          '🖋️': 'fountain_pen',
          '🖊️': 'pen',
          '🖌️': 'paintbrush',
          '🖍️': 'crayon',
          '📝': 'memo',
          '💼': 'briefcase',
          '📁': 'file_folder',
          '📂': 'open_file_folder',
          '🗂️': 'card_index_dividers',
          '📅': 'date',
          '📆': 'calendar',
          '🗒️': 'spiral_notepad',
          '🗓️': 'spiral_calendar',
          '📇': 'card_index',
          '📈': 'chart_increasing',
          '📉': 'chart_decreasing',
          '📊': 'bar_chart',
          '📋': 'clipboard',
          '📌': 'pushpin',
          '📍': 'round_pushpin',
          '📎': 'paperclip',
          '🖇️': 'linked_paperclips',
          '📏': 'straight_ruler',
          '📐': 'triangular_ruler',
          '✂️': 'scissors',
          '🗃️': 'card_file_box',
          '🗄️': 'file_cabinet',
          '🗑️': 'wastebasket',
          '🔒': 'lock',
          '🔓': 'unlock',
          '🔏': 'lock_with_ink_pen',
          '🔐': 'closed_lock_with_key',
          '🔨': 'hammer',
          '⛏️': 'pick',
          '⚒️': 'hammer_and_pick',
          '🛠️': 'hammer_and_wrench',
          '🔫': 'water_pistol',
          '🏹': 'bow_and_arrow',
          '🔧': 'wrench',
          '🔩': 'nut_and_bolt',
          '⚙️': 'gear',
          '🗜️': 'clamp',
          '⚖️': 'balance_scale',
          '🔗': 'link',
          '⛓️': 'chains',
          '🧰': 'toolbox',
          '🧲': 'magnet',
          '🔬': 'microscope',
          '🔭': 'telescope',
          '📡': 'satellite_antenna',
          '💉': 'syringe',
          '💊': 'pill',
          '🩹': 'adhesive_bandage',
          '🩺': 'stethoscope',
          '🌡️': 'thermometer',
          '🧹': 'broom',
          '🧺': 'basket',
          '🧻': 'roll_of_paper',
          '🧼': 'soap',
          '🧽': 'sponge',
          '🧯': 'fire_extinguisher',
          '🛒': 'shopping_cart',
          '🚬': 'cigarette',
          '⚰️': 'coffin',
          '⚱️': 'funeral_urn',
          '🗿': 'moai',
          '🏧': 'atm',
          '🚮': 'put_litter_in_its_place',
          '🚰': 'potable_water',
          '♿': 'wheelchair',
          '🚹': 'mens',
          '🚺': 'womens',
          '🚻': 'restroom',
          '🚼': 'baby_symbol',
          '🚾': 'water_closet',
          '🛂': 'passport_control',
          '🛃': 'customs',
          '🛄': 'baggage_claim',
          '🛅': 'left_luggage',
          '⚠️': 'warning',
          '🚸': 'children_crossing',
          '⛔': 'no_entry',
          '🚫': 'prohibited',
          '🚳': 'no_bicycles',
          '🚭': 'no_smoking',
          '🚯': 'do_not_litter',
          '🚱': 'non_potable_water',
          '🚷': 'no_pedestrians',
          '📵': 'no_mobile_phones',
          '🔞': 'no_one_under_eighteen',
          '☢️': 'radioactive',
          '☣️': 'biohazard',
          '⬆️': 'up_arrow',
          '↗️': 'up_right_arrow',
          '➡️': 'right_arrow',
          '↘️': 'down_right_arrow',
          '⬇️': 'down_arrow',
          '↙️': 'down_left_arrow',
          '⬅️': 'left_arrow',
          '↖️': 'up_left_arrow',
          '↕️': 'up_down_arrow',
          '↔️': 'left_right_arrow',
          '↩️': 'right_arrow_curving_left',
          '↪️': 'left_arrow_curving_right'
        };
        return emojiMap[icon || ''] || 'default_icon';
      };
      
      // 根据分类获取默认图标
      const getDefaultIcon = (category: string): string => {
        const iconMap: Record<string, string> = {
          'weapon': 'sword',
          'armor': 'shield',
          'consumable': 'potion',
          'material': 'gem',
          'accessory': 'ring',
          'tool': 'wrench',
          'default': 'package'
        };
        return iconMap[category] || iconMap['default'];
      };
      
      console.log('📤 同步道具到 New Day:', {
        itemId: syncItemId,
        name: item.name,
        originalItemId: item.originalItemId,
        currentId: item.id
      });
      
      // 标准化道具类型和稀有度为 New Day 认可的值
      const normalizeType = (category: string): string => {
        const typeMap: Record<string, string> = {
          'weapon': 'weapon',
          'armor': 'armor',
          'shield': 'armor',
          'consumable': 'consumable',
          'potion': 'consumable',
          'material': 'material',
          'accessory': 'accessory',
          'tool': 'tool'
        };
        return typeMap[category?.toLowerCase()] || 'material';
      };
      
      const normalizeRarity = (rarity: string): string => {
        const rarityMap: Record<string, string> = {
          'common': 'common',
          'uncommon': 'uncommon',
          'rare': 'rare',
          'epic': 'epic',
          'legendary': 'legendary',
          'mythic': 'legendary',
          '普通': 'common',
          '稀有': 'rare',
          '史诗': 'epic',
          '传说': 'legendary',
          '神话': 'legendary'
        };
        return rarityMap[rarity?.toLowerCase()] || 'common';
      };
      
      const normalizedType = normalizeType(item.category);
      const normalizedRarity = normalizeRarity(item.rarity);
      
      console.log('[AllinONE 同步] 字段标准化:', {
        originalCategory: item.category,
        normalizedType,
        originalRarity: item.rarity,
        normalizedRarity
      });
      
      // 按照 New Day 库存 API 的格式构建请求数据
      // New Day 已统一字段：/inventory/add 和 /market/list 都使用 'itemType'
      const syncPayload = {
        itemId: syncItemId,
        name: sanitizeEmoji(item.name) || item.name,
        description: sanitizeEmoji(item.description) || item.description,
        itemType: normalizedType,  // New Day 统一使用 'itemType'
        rarity: normalizedRarity,
        quantity: 1,
        stats: item.stats,
        originalSource: 'allinone_official_store',
        allinoneItemId: item.id,
        icon: getIconName(item.icon) || getDefaultIcon(item.category)
      };
      
      console.log('[AllinONE 同步] 发送同步请求:', JSON.stringify(syncPayload, null, 2));
      
      const result = await newDayApiService.addItemToNewDay(syncPayload);

      // 检查是否成功，或者道具已存在（视为成功）
      const isSuccess = result.success || 
        (result.message && result.message.includes('ITEM_ALREADY_EXISTS')) ||
        result.errorCode === 'ITEM_ALREADY_EXISTS';

      if (isSuccess) {
        // 3. 更新状态为已同步
        await inventoryApiService.updateSyncStatus(
          item.id,
          'synced',
          new Date()
        );
        setItems(items.map(i => 
          i.id === item.id 
            ? { ...i, syncStatus: 'synced', syncedAt: new Date() } 
            : i
        ));
        
        if (result.message?.includes('ITEM_ALREADY_EXISTS') || result.errorCode === 'ITEM_ALREADY_EXISTS') {
          alert('✅ 同步成功！道具已存在于 New Day 游戏，状态已更新');
        } else {
          alert('✅ 同步成功！道具已添加到 New Day 游戏');
        }
      } else {
        // 根据错误码提供更详细的错误信息
        let errorMsg = result.message || '同步失败';
        if (result.errorCode) {
          console.error('[AllinONE 同步] 错误码:', result.errorCode, '详细信息:', result.errorDetail);
        }
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ 同步到 New Day 失败:', error);
      
      // 4. 更新状态为失败
      await inventoryApiService.updateSyncStatus(item.id, 'failed');
      setItems(items.map(i => 
        i.id === item.id ? { ...i, syncStatus: 'failed' } : i
      ));
      
      alert(`❌ 同步失败: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-300">加载跨游戏道具中...</span>
      </div>
    );
  }

  return (
    <div>
      {/* 道具统计 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          共 <span className="text-white font-bold">{items.length}</span> 个道具
          {items.length > 0 && (
            <span className="ml-2">
              (AllinONE: {items.filter(i => i.gameSource === 'allinone').length},
              New Day: {items.filter(i => i.gameSource === 'newday').length})
            </span>
          )}
        </div>
      </div>

      {/* 游戏筛选 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterGame('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterGame === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700'
            }`}
          >
            全部游戏
          </button>
          <button
            onClick={() => setFilterGame('allinone')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterGame === 'allinone'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700'
            }`}
          >
            🎮 AllinONE
          </button>
          <button
            onClick={() => setFilterGame('newday')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterGame === 'newday'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700'
            }`}
          >
            🐉 New Day
          </button>
        </div>
      </div>

      {/* 道具网格 */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors relative"
            >
              <div className="text-center">
                {/* 游戏标识 */}
                <div className="absolute top-2 right-2 text-lg">
                  {getGameIcon(item.gameSource)}
                </div>
                
                {/* 道具图标 */}
                <div className="text-4xl mb-2">
                  {item.icon ? (
                    <i className={`fa-solid ${item.icon}`}></i>
                  ) : (
                    getCategoryIcon(item.category)
                  )}
                </div>

                {/* 道具名称 */}
                <h4 className="font-bold text-purple-400 text-sm mb-1 truncate">{item.name}</h4>

                {/* 游戏名称 */}
                <div className="text-xs text-slate-400 mb-1">
                  {item.gameName}
                </div>

                {/* 稀有度 */}
                <span className={`text-xs px-2 py-0.5 rounded border ${getRarityColor(item.rarity)}`}>
                  {item.rarity}
                </span>

                {/* 道具描述 */}
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[2.5rem]">
                  {item.description}
                </p>

                {/* 属性显示 */}
                {item.stats && (item.stats.attack || item.stats.defense || item.stats.health) && (
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {item.stats.attack && (
                      <span className="text-xs text-red-400">⚔️{item.stats.attack}</span>
                    )}
                    {item.stats.defense && (
                      <span className="text-xs text-blue-400">🛡️{item.stats.defense}</span>
                    )}
                    {item.stats.health && (
                      <span className="text-xs text-green-400">❤️{item.stats.health}</span>
                    )}
                  </div>
                )}

                {/* 使用次数（消耗品） */}
                {item.uses !== undefined && item.maxUses !== undefined && (
                  <div className="mt-2">
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      使用次数: {item.uses}/{item.maxUses}
                    </span>
                  </div>
                )}

                {/* 同步状态徽章和按钮 - 仅 New Day 官方商店购买的道具显示 */}
                {item.gameSource === 'newday' && item.syncStatus && (
                  <>
                    {/* 已同步状态 */}
                    {item.syncStatus === 'synced' && (
                      <div className="mt-2">
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded" title="已同步到 New Day">
                          ✅ 已同步到 New Day
                        </span>
                      </div>
                    )}
                    
                    {/* 同步失败状态 */}
                    {item.syncStatus === 'failed' && (
                      <div className="mt-2">
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded" title="同步失败">
                          ❌ 同步失败
                        </span>
                      </div>
                    )}
                    
                    {/* 未同步状态 */}
                    {item.syncStatus === 'not_synced' && (
                      <button
                        onClick={() => handleSyncToNewDay(item)}
                        className="w-full mt-2 px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        title="将此道具同步到 New Day 游戏"
                      >
                        📤 同步到 New Day
                      </button>
                    )}
                    
                    {/* 同步中状态 */}
                    {item.syncStatus === 'syncing' && (
                      <button
                        disabled
                        className="w-full mt-2 px-2 py-1.5 text-xs bg-gray-600 text-white rounded opacity-50 cursor-not-allowed"
                      >
                        🔄 同步中...
                      </button>
                    )}
                    
                    {/* 失败重试 */}
                    {item.syncStatus === 'failed' && (
                      <button
                        onClick={() => handleSyncToNewDay(item)}
                        className="w-full mt-2 px-2 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
                        title="重试同步到 New Day"
                      >
                        🔄 重试同步
                      </button>
                    )}
                  </>
                )}

                {/* 上架按钮 */}
                {/* 上架按钮 - New Day 道具显示两个选择 */}
                {item.gameSource === 'newday' ? (
                  <div className="flex gap-1 mt-3">
                    <button
                      onClick={() => {
                        setListingItem(item);
                        setListingPrice(100);
                        setCurrencyType('newDayGameCoins');
                        setTargetMarket('newday');
                      }}
                      className="flex-1 px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      上架到New Day
                    </button>
                    <button
                      onClick={() => {
                        setListingItem(item);
                        setListingPrice(100);
                        setCurrencyType('gameCoins');
                        setTargetMarket('allinone');
                      }}
                      className="flex-1 px-2 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                    >
                      上架到AllinONE
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setListingItem(item);
                      setListingPrice(100);
                      setCurrencyType('gameCoins');
                      setTargetMarket('allinone');
                    }}
                    className="w-full mt-3 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                  >
                    上架到市场
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-slate-400">
            {filterGame === 'all' ? '暂无道具' : 
             filterGame === 'newday' ? '暂无 New Day 道具' : '暂无 AllinONE 道具'}
          </p>
        </div>
      )}

      {/* 上架弹窗 */}
      {listingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              {targetMarket === 'newday' ? '上架道具到 New Day 市场' : '上架道具到 AllinONE 市场'}
            </h3>
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getGameIcon(listingItem.gameSource)}</span>
                <div className="font-medium">{listingItem.name}</div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{listingItem.description}</div>
              <div className="text-xs text-slate-500 mt-2">来源: {listingItem.gameName}</div>
            </div>

            {/* 货币类型选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                货币类型
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getCurrencyOptions(listingItem.gameSource === 'newday' ? 'newday' : 'allinone').map((currency) => (
                  <button
                    key={currency.value}
                    type="button"
                    onClick={() => setCurrencyType(currency.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currencyType === currency.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <span className="mr-1">{currency.icon}</span>
                    {currency.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                价格数量
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(Number(e.target.value))}
                  min="1"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {getCurrencyOptions(listingItem.gameSource === 'newday' ? 'newday' : 'allinone')
                    .find(c => c.value === currencyType)?.label}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setListingItem(null);
                  setListingPrice(100);
                  setCurrencyType('computingPower');
                  setTargetMarket('allinone');
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleListItem}
                disabled={isListing}
                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  isListing
                    ? 'opacity-50 cursor-not-allowed '
                    : ''
                }${
                  targetMarket === 'newday'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isListing
                  ? '上架中...'
                  : targetMarket === 'newday'
                    ? '确认上架到 New Day'
                    : '确认上架到 AllinONE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
