/**
 * 投票防作弊系统
 *
 * 在投票流程中检测异常行为，不自动拒绝，而是打标记 + 审计日志。
 * 核心规则：
 *   1. 同设备/IP 限制 —— 浏览器指纹，短时间内多账户投票标记为可疑
 *   2. 最低活跃天数 —— 注册 < 3 天的账户投票权重降权警告
 *   3. 异常投票模式 —— 集中投票、清一色、权重分布极端偏离
 *
 * 集成点：
 *   - gameProposalService.submitProposalVote() 在投票前调用 precheck()
 *   - gameProposalService.finalizeProposal() 结算后调用 postSettlementAudit()
 */

// ==================== 类型定义 ====================

/** 审计日志等级 */
export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  SUSPICIOUS = 'suspicious',
  CRITICAL = 'critical',
}

/** 作弊风险标志 */
export enum FraudFlag {
  SAME_DEVICE_MULTI_ACCOUNT = 'same_device_multi_account',
  NEW_ACCOUNT = 'new_account',
  VOTE_SPAM = 'vote_spam',
  COORDINATED_VOTING = 'coordinated_voting',
  UNANIMOUS_PATTERN = 'unanimous_pattern',
  WEIGHT_ANOMALY = 'weight_anomaly',
}

/** 单条审计日志 */
export interface FraudAuditLog {
  id: string;
  timestamp: number;
  level: AuditLevel;
  flag: FraudFlag;
  proposalId: string;
  voterId?: string;
  voterName?: string;
  detail: string;
  evidence: Record<string, any>;
}

/** 预检结果 */
export interface FraudPrecheckResult {
  passed: boolean;
  flags: FraudFlag[];
  warnings: string[];
  modifiedWeight: number | null; // 如果降权，返回降权后的值
}

/** 设备指纹信息 */
interface DeviceFingerprint {
  fingerprint: string;
  accounts: { userId: string; lastVoteAt: number }[];
  firstSeenAt: number;
}

// ==================== 常量 ====================

const STORAGE_KEY_AUDIT = 'allinone_fraud_audit_logs';
const STORAGE_KEY_DEVICE = 'allinone_device_fingerprint';
const MIN_ACCOUNT_AGE_DAYS = 3;
const MAX_VOTES_PER_HOUR = 20;
const MAX_SAME_DEVICE_ACCOUNTS = 2;
const COORDINATED_VOTE_WINDOW_MS = 5 * 60 * 1000; // 5分钟内集中投票阈值
const COORDINATED_VOTE_RATIO = 0.4; // 40%以上总票数在窗口内 → 可疑

// ==================== 存储工具 ====================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function loadAuditLogs(): FraudAuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAuditLogs(logs: FraudAuditLog[]): void {
  localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs));
}

function getDeviceFingerprint(): string {
  const existing = localStorage.getItem(STORAGE_KEY_DEVICE);
  if (existing) {
    try {
      const data: DeviceFingerprint = JSON.parse(existing);
      return data.fingerprint;
    } catch {
      // ignore
    }
  }

  const fp = `fp-${generateUUID()}`;
  const deviceInfo: DeviceFingerprint = {
    fingerprint: fp,
    accounts: [],
    firstSeenAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY_DEVICE, JSON.stringify(deviceInfo));
  return fp;
}

function getDeviceInfo(): DeviceFingerprint {
  const fp = getDeviceFingerprint();
  const existing = localStorage.getItem(STORAGE_KEY_DEVICE);
  if (existing) {
    try {
      return JSON.parse(existing) as DeviceFingerprint;
    } catch {
      // ignore
    }
  }
  return { fingerprint: fp, accounts: [], firstSeenAt: Date.now() };
}

function updateDeviceAccount(userId: string): void {
  const info = getDeviceInfo();
  const existingIdx = info.accounts.findIndex(a => a.userId === userId);
  if (existingIdx >= 0) {
    info.accounts[existingIdx].lastVoteAt = Date.now();
  } else {
    info.accounts.push({ userId, lastVoteAt: Date.now() });
  }
  localStorage.setItem(STORAGE_KEY_DEVICE, JSON.stringify(info));
}

// ==================== 审计日志 ====================

function writeAudit(
  level: AuditLevel,
  flag: FraudFlag,
  proposalId: string,
  detail: string,
  evidence: Record<string, any>,
  voterId?: string,
  voterName?: string,
): void {
  const logs = loadAuditLogs();
  logs.push({
    id: `fraud-${generateUUID().slice(0, 8)}`,
    timestamp: Date.now(),
    level,
    flag,
    proposalId,
    voterId,
    voterName,
    detail,
    evidence,
  });
  // 只保留最近500条
  if (logs.length > 500) {
    saveAuditLogs(logs.slice(-500));
  } else {
    saveAuditLogs(logs);
  }
  console.log(`[FraudDetector] ${level.toUpperCase()} | ${flag} | ${detail}`);
}

// ==================== 核心检测逻辑 ====================

export class VoteFraudDetector {
  // ============ 规则1: 同设备多账户检测 ============

  /**
   * 检查同一设备是否短时间出现过多账户投票
   */
  checkSameDeviceMultiAccount(voterId: string, proposalId: string): FraudPrecheckResult {
    const device = getDeviceInfo();
    const flags: FraudFlag[] = [];
    const warnings: string[] = [];

    // 更新当前账户记录
    updateDeviceAccount(voterId);

    if (device.accounts.length > MAX_SAME_DEVICE_ACCOUNTS) {
      flags.push(FraudFlag.SAME_DEVICE_MULTI_ACCOUNT);
      warnings.push(`同一设备检测到 ${device.accounts.length} 个账户投票（阈值: ${MAX_SAME_DEVICE_ACCOUNTS}）`);

      writeAudit(
        AuditLevel.SUSPICIOUS,
        FraudFlag.SAME_DEVICE_MULTI_ACCOUNT,
        proposalId,
        `设备 ${device.fingerprint} 上有 ${device.accounts.length} 个不同账户参与投票`,
        { accounts: device.accounts },
        voterId,
      );
    }

    return {
      passed: flags.length === 0,
      flags,
      warnings,
      modifiedWeight: flags.length > 0 ? 0.1 : null, // 多账户场景下降权至10%
    };
  }

  // ============ 规则2: 账户年龄检查 ============

  /**
   * 检查账户是否过于新
   * @returns 如果 < 3天，权重降为0（仅警告不阻止）
   */
  checkAccountAge(
    voterId: string,
    voterName: string,
    proposalId: string,
  ): FraudPrecheckResult {
    const flags: FraudFlag[] = [];
    const warnings: string[] = [];

    // 从 localStorage 读取账户创建时间
    const accountCreatedKey = `allinone_account_created_${voterId}`;
    let accountAge = Infinity;
    const createdStr = localStorage.getItem(accountCreatedKey);
    if (!createdStr) {
      // 首次见到的账户，记录创建时间
      localStorage.setItem(accountCreatedKey, Date.now().toString());
      accountAge = 0;
    } else {
      accountAge = (Date.now() - parseInt(createdStr, 10)) / (1000 * 60 * 60 * 24); // 天
    }

    if (accountAge < MIN_ACCOUNT_AGE_DAYS) {
      flags.push(FraudFlag.NEW_ACCOUNT);
      warnings.push(
        `账户"${voterName}"创建仅 ${Math.round(accountAge * 24)} 小时，不足 ${MIN_ACCOUNT_AGE_DAYS} 天。投票权重降为0。`,
      );

      writeAudit(
        AuditLevel.WARNING,
        FraudFlag.NEW_ACCOUNT,
        proposalId,
        `新账户 ${voterId} (${voterName}) 注册仅 ${accountAge.toFixed(1)} 天`,
        { accountAgeDays: accountAge },
        voterId,
        voterName,
      );
    }

    return {
      passed: flags.length === 0,
      flags,
      warnings,
      modifiedWeight: flags.includes(FraudFlag.NEW_ACCOUNT) ? 0 : null,
    };
  }

  // ============ 规则3: 刷票检测 ============

  /**
   * 检查短时间内投票频率
   */
  checkVoteSpam(voterId: string, voterName: string, proposalId: string): FraudPrecheckResult {
    const flags: FraudFlag[] = [];
    const warnings: string[] = [];

    // 统计过去1小时内该用户的投票次数
    const logs = loadAuditLogs();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentVotes = logs.filter(
      l => l.voterId === voterId && l.timestamp > oneHourAgo && l.flag === FraudFlag.VOTE_SPAM,
    );

    // 更准确的方式：从投票凭证系统查询
    const voteCountKey = `allinone_vote_count_${voterId}`;
    let voteCount = 0;
    try {
      const countData = localStorage.getItem(voteCountKey);
      if (countData) {
        const parsed = JSON.parse(countData);
        if (parsed.hour === Math.floor(Date.now() / 3600000)) {
          voteCount = parsed.count;
        }
      }
    } catch {
      // ignore
    }

    voteCount++;
    localStorage.setItem(voteCountKey, JSON.stringify({
      hour: Math.floor(Date.now() / 3600000),
      count: voteCount,
    }));

    if (voteCount > MAX_VOTES_PER_HOUR) {
      flags.push(FraudFlag.VOTE_SPAM);
      warnings.push(`${voterName} 1小时内投票 ${voteCount} 次，超过阈值 ${MAX_VOTES_PER_HOUR}`);

      writeAudit(
        AuditLevel.SUSPICIOUS,
        FraudFlag.VOTE_SPAM,
        proposalId,
        `高频投票: ${voterId} (${voterName}) 1小时内投票 ${voteCount} 次`,
        { hourlyCount: voteCount },
        voterId,
        voterName,
      );
    }

    return {
      passed: flags.length === 0,
      flags,
      warnings,
      modifiedWeight: flags.includes(FraudFlag.VOTE_SPAM) ? 0.05 : null,
    };
  }

  // ============ 规则4: 协同投票检测（结算时使用） ============

  /**
   * 检测是否有协同/集中投票——大量票在很短时间内投出
   */
  checkCoordinatedVoting(
    proposalId: string,
    voteTimestamps: { voterId: string; timestamp: number }[],
  ): FraudPrecheckResult {
    const flags: FraudFlag[] = [];
    const warnings: string[] = [];

    if (voteTimestamps.length < 5) {
      return { passed: true, flags: [], warnings: [], modifiedWeight: null };
    }

    // 按时间排序
    const sorted = [...voteTimestamps].sort((a, b) => a.timestamp - b.timestamp);

    // 滑动窗口，找最大密度
    let maxInWindow = 0;
    let left = 0;
    for (let right = 0; right < sorted.length; right++) {
      while (sorted[right].timestamp - sorted[left].timestamp > COORDINATED_VOTE_WINDOW_MS) {
        left++;
      }
      maxInWindow = Math.max(maxInWindow, right - left + 1);
    }

    const ratio = maxInWindow / sorted.length;
    if (ratio > COORDINATED_VOTE_RATIO) {
      flags.push(FraudFlag.COORDINATED_VOTING);
      warnings.push(
        `${maxInWindow}/${sorted.length} (${Math.round(ratio * 100)}%) 张票在 ${COORDINATED_VOTE_WINDOW_MS / 60000} 分钟内集中投出`,
      );

      writeAudit(
        AuditLevel.SUSPICIOUS,
        FraudFlag.COORDINATED_VOTING,
        proposalId,
        `集中投票: ${maxInWindow}/${sorted.length} 张票在窗口内投出`,
        { maxInWindow, total: sorted.length, ratio, windowMs: COORDINATED_VOTE_WINDOW_MS },
      );
    }

    return {
      passed: flags.length === 0,
      flags,
      warnings,
      modifiedWeight: null,
    };
  }

  // ============ 规则5: 清一色投票检测（结算时使用） ============

  /**
   * 检测是否存在清一色赞同/反对，可能暗示串通或刷票
   */
  checkUnanimousPattern(
    proposalId: string,
    decisions: { decision: 'approve' | 'reject' | 'abstain'; voterId: string }[],
  ): FraudPrecheckResult {
    const flags: FraudFlag[] = [];
    const warnings: string[] = [];

    if (decisions.length < 5) {
      return { passed: true, flags: [], warnings: [], modifiedWeight: null };
    }

    const approveCount = decisions.filter(d => d.decision === 'approve').length;
    const rejectCount = decisions.filter(d => d.decision === 'reject').length;
    const total = decisions.length;
    const nonAbstain = approveCount + rejectCount;

    // 非弃权票中 >90% 是同一方向 → 标记
    if (nonAbstain > 0) {
      const approveRatio = approveCount / nonAbstain;
      const rejectRatio = rejectCount / nonAbstain;
      if (approveRatio > 0.9 || rejectRatio > 0.9) {
        const direction = approveRatio > 0.9 ? '赞成' : '反对';
        flags.push(FraudFlag.UNANIMOUS_PATTERN);
        warnings.push(`非弃权票中 ${direction} 占比 >90%，可能存在协调投票`);

        writeAudit(
          AuditLevel.WARNING,
          FraudFlag.UNANIMOUS_PATTERN,
          proposalId,
          `清一色投票: ${direction}占 ${Math.round(Math.max(approveRatio, rejectRatio) * 100)}%`,
          { approveCount, rejectCount, abstainCount: decisions.length - nonAbstain },
        );
      }
    }

    return {
      passed: flags.length === 0,
      flags,
      warnings,
      modifiedWeight: null,
    };
  }

  // ============ 规则6: 权重异常检测（结算时使用） ============

  /**
   * 检测投票权重分布是否极端偏离
   */
  checkWeightAnomaly(
    proposalId: string,
    weights: { voterId: string; weight: number }[],
  ): FraudPrecheckResult {
    const flags: FraudFlag[] = [];
    const warnings: string[] = [];

    if (weights.length < 3) {
      return { passed: true, flags: [], warnings: [], modifiedWeight: null };
    }

    const values = weights.map(w => w.weight);
    const total = values.reduce((a, b) => a + b, 0);
    const avg = total / values.length;
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values.filter(v => v > 0));

    // 单一投票者权重超过总权重50% → 权重集中风险
    const maxRatio = maxVal / total;
    if (maxRatio > 0.5 && values.length > 5) {
      flags.push(FraudFlag.WEIGHT_ANOMALY);
      const topVoter = weights.find(w => w.weight === maxVal);
      warnings.push(`投票权重集中: ${topVoter?.voterId || '未知'} 权重占比 ${Math.round(maxRatio * 100)}%`);

      writeAudit(
        AuditLevel.WARNING,
        FraudFlag.WEIGHT_ANOMALY,
        proposalId,
        `权重异常: 最高权重占比 ${Math.round(maxRatio * 100)}%`,
        { maxWeight: maxVal, totalWeight: total, voterCount: values.length },
      );
    }

    return {
      passed: flags.length === 0,
      flags,
      warnings,
      modifiedWeight: null,
    };
  }

  // ============ 综合预检（投票前调用） ============

  /**
   * 对单次投票进行综合预检
   * 返回值中 modifiedWeight 为 null 表示不修改权重，> 0 表示降权后的值
   */
  precheckVote(
    voterId: string,
    voterName: string,
    proposalId: string,
    currentWeight: number,
  ): FraudPrecheckResult {
    const allFlags: FraudFlag[] = [];
    const allWarnings: string[] = [];
    let finalWeight: number | null = null;

    // 规则1: 同设备多账户
    const deviceResult = this.checkSameDeviceMultiAccount(voterId, proposalId);
    allFlags.push(...deviceResult.flags);
    allWarnings.push(...deviceResult.warnings);
    if (deviceResult.modifiedWeight !== null) {
      finalWeight = (finalWeight ?? currentWeight) * deviceResult.modifiedWeight;
    }

    // 规则2: 账户年龄
    const ageResult = this.checkAccountAge(voterId, voterName, proposalId);
    allFlags.push(...ageResult.flags);
    allWarnings.push(...ageResult.warnings);
    if (ageResult.modifiedWeight === 0) {
      finalWeight = 0; // 新账户直接权重清零
    }

    // 规则3: 刷票频率
    const spamResult = this.checkVoteSpam(voterId, voterName, proposalId);
    allFlags.push(...spamResult.flags);
    allWarnings.push(...spamResult.warnings);
    if (spamResult.modifiedWeight !== null && finalWeight === null) {
      finalWeight = currentWeight * spamResult.modifiedWeight;
    }

    return {
      passed: allFlags.length === 0,
      flags: allFlags,
      warnings: allWarnings,
      modifiedWeight: finalWeight,
    };
  }

  // ============ 结算后审计（投票结束后调用） ============

  /**
   * 投票结束后对所有投票数据进行审计
   */
  postSettlementAudit(
    proposalId: string,
    voteTimestamps: { voterId: string; timestamp: number }[],
    decisions: { voterId: string; decision: 'approve' | 'reject' | 'abstain' }[],
    weights: { voterId: string; weight: number }[],
  ): FraudAuditLog[] {
    // 规则4: 协同投票
    this.checkCoordinatedVoting(proposalId, voteTimestamps);

    // 规则5: 清一色模式
    const nonAbstainDecisions = decisions.filter(d => d.decision !== 'abstain').map(d => ({
      decision: d.decision as 'approve' | 'reject',
      voterId: d.voterId,
    }));
    this.checkUnanimousPattern(proposalId, nonAbstainDecisions);

    // 规则6: 权重异常
    this.checkWeightAnomaly(proposalId, weights);

    // 返回该提案的所有审计日志
    return loadAuditLogs().filter(l => l.proposalId === proposalId);
  }

  // ============ 查询方法 ============

  /**
   * 获取所有审计日志
   */
  getAllAuditLogs(): FraudAuditLog[] {
    return loadAuditLogs();
  }

  /**
   * 获取某提案的审计日志
   */
  getProposalAuditLogs(proposalId: string): FraudAuditLog[] {
    return loadAuditLogs().filter(l => l.proposalId === proposalId);
  }

  /**
   * 获取高风险的审计日志
   */
  getHighRiskLogs(): FraudAuditLog[] {
    return loadAuditLogs().filter(
      l => l.level === AuditLevel.SUSPICIOUS || l.level === AuditLevel.CRITICAL,
    );
  }

  /**
   * 清除旧审计日志（保留最近N天）
   */
  cleanupOldLogs(keepDays: number = 30): void {
    const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    const logs = loadAuditLogs().filter(l => l.timestamp > cutoff);
    saveAuditLogs(logs);
  }
}

// ==================== 单例导出 ====================

export const voteFraudDetector = new VoteFraudDetector();
export default voteFraudDetector;
