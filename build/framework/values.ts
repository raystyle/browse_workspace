// framework/values.ts — pair SDK 值面基(REQ-041 P0):通道常量基 + CAPS 基 + 公共类型。
// 零依赖纪律沿 contracts.values(con-06:zod 全量打包致 probe 虚胖 810KB 的教训)——
// 本件只出常量与纯类型,各 pair 契约消费后扩展;probe/mech 体经 esbuild 内联,产物零 zod。

// ---------- 通道常量基(attr 名与事件面;slug 归 pair 自报) ----------
export const CHANNEL_BASE = {
  probeAttr: 'probe',
  eventsPath: '/events',
} as const;

// ---------- CAPS 基(毫秒;pair 无关的等待/兜底帽,唯一权威,build 注入产物) ----------
export const BASE_CAPS = {
  docElementGuard: 3000,
  settleAwait: 20000,
  reloadSettleAwait: 15000,
  pageComplete: 12000,
  transientRetryMs: 1000,
  // 两段式(REQ-041 P0):heavy 段等 settled 信号帽 / 观察窗全程帽 / mdream 单次竞速帽
  heavySettleAwait: 20000,
  heavyDeadline: 30000,
  mdRaceMs: 4000,
} as const;

// ---------- 公共类型:attr 通道的收齐信号形(纯类型零运行时) ----------
/** skeleton 终写进 probe attr 的收齐信号面;mech waitSettled 与 heavy 段都按此判 */
export interface SettleSignal {
  slug: string;
  settled: boolean;
  verdict: string;
}
