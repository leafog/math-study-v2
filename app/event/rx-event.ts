import { BehaviorSubject, Subject, type Observable } from "rxjs";

// ==================== 通用事件总线工厂（不依赖业务，供 events.ts 创建 bus） ====================

type AnyStream = BehaviorSubject<any | null> | Subject<any>;

/** bus 的对外类型：emit 发布，on 订阅（回调式 或 Observable 式） */
export type RxBus<Events extends Record<string, unknown>> = {
  /** 发布：bus.emit(name, payload)。默认 Behavior 缓存最近一次；opt.replay=false 仅广播当下 */
  emit<K extends keyof Events>(
    name: K,
    payload: Events[K],
    opts?: { replay?: boolean },
  ): void;
  /** 订阅：bus.on(name, handler) → 返回退订函数 */
  on<K extends keyof Events>(
    name: K,
    handler: (payload: Events[K]) => void,
  ): () => void;
  /** 订阅：bus.on(name) → 返回 Observable 供 .pipe() 组合 */
  on<K extends keyof Events>(name: K): Observable<Events[K] | null>;
};

/**
 * 创建事件总线，用法对齐 mitt：bus.emit(name, payload) / bus.on(name, handler)。
 * 与 mitt 的差异：声明在 replayEvents 里的事件用 BehaviorSubject——缓存最近一次值，
 * 订阅者一进来立即重放，实现"先发布、后挂载"也能消费到（面板/消息未就绪时先发不丢）。
 * 其余事件用普通 Subject（仅广播当下），保持 mitt 语义。首次 emit 可用 opts.replay 覆盖。
 */
export const rxjs = <Events extends Record<string, unknown>>(
  replayEvents: ReadonlySet<keyof Events> = new Set(),
): RxBus<Events> => {
  const streams = new Map<keyof Events, AnyStream>();

  const streamOf = (
    name: keyof Events,
    opts?: { replay?: boolean },
  ): AnyStream => {
    let s = streams.get(name);
    if (!s) {
      const replay = opts?.replay ?? replayEvents.has(name);
      s = replay
        ? new BehaviorSubject<Events[keyof Events] | null>(null)
        : new Subject<Events[keyof Events]>();
      streams.set(name, s);
    }
    return s;
  };

  return {
    emit<K extends keyof Events>(
      name: K,
      payload: Events[K],
      opts?: { replay?: boolean },
    ) {
      streamOf(name, opts).next(payload);
    },
    on<K extends keyof Events>(
      name: K,
      handler?: (payload: Events[K]) => void,
    ) {
      const obs = streamOf(name).asObservable() as Observable<Events[K] | null>;
      if (!handler) return obs;
      const sub = obs.subscribe((p) => {
        // Behavior 初始/清除时为 null，跳过
        if (p === null) return;
        handler(p);
      });
      return () => sub.unsubscribe();
    },
  } as RxBus<Events>;
};
