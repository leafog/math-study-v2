export type BBox = readonly [x0: number, y0: number, x1: number, y1: number];

type Unit<T> = readonly [bbox: BBox, value: T];

type Gap = readonly [left: number, right: number, startRow: number];

export type Cut = readonly [
  left: number,
  right: number,
  startRow: number,
  endRow: number,
];

export interface GapTreeNode<T> {
  x_left: number;
  x_right: number;
  r_top: number;
  r_bottom: number;
  units: Unit<T>[];
  children: GapTreeNode<T>[];
}

export class GapTree<T> {
  private readonly get_bbox: (item: T) => BBox;

  /**
   * 调试用：sort() 后可以查看 GapTree 中间结果。
   */
  public current_rows: Unit<T>[][] = [];
  public current_cuts: Cut[] = [];
  public current_nodes: GapTreeNode<T>[] = [];

  /**
   * @param get_bbox
   * 返回文本块左上角、右下角坐标：
   *
   * [x0, y0, x1, y1]
   */
  constructor(get_bbox: (item: T) => BBox) {
    this.get_bbox = get_bbox;
  }

  // ======================= 调用接口 =====================

  /**
   * 对文本块列表，按人类阅读顺序进行排序。
   */
  sort(text_blocks: T[]): T[] {
    // 封装块单元，并求页面左右边缘
    const [units, page_l, page_r] = this._get_units(text_blocks, this.get_bbox);

    // 求行和竖切线
    const [cuts, rows] = this._get_cuts_rows(units, page_l, page_r);

    // 求布局树
    const root = this._get_layout_tree(cuts, rows);

    // 求树节点序列
    const nodes = this._preorder_traversal(root);

    // 求排序后的原始文本块序列
    const new_text_blocks = this._get_text_blocks(nodes);

    // 缓存中间变量，以便调试
    this.current_rows = rows;
    this.current_cuts = cuts;
    this.current_nodes = nodes;

    return new_text_blocks;
  }

  /**
   * 获取以区块为单位的文本块二层列表。
   *
   * 需要在 sort() 后调用。
   *
   * [
   *   [block1, block2],
   *   [block3, block4],
   * ]
   */
  get_nodes_text_blocks(): T[][] {
    const result: T[][] = [];

    for (const node of this.current_nodes) {
      const tbs: T[] = [];

      if (node.units.length) {
        for (const unit of node.units) {
          tbs.push(unit[1]);
        }

        result.push(tbs);
      }
    }

    return result;
  }

  // ======================= 封装块单元列表 =====================

  /**
   * 将原始文本块封装成：
   *
   * [
   *   [
   *     [x0, y0, x1, y1],
   *     originalBlock
   *   ],
   *   ...
   * ]
   *
   * 同时计算页面左右边界。
   */
  private _get_units(
    text_blocks: T[],
    get_bbox: (item: T) => BBox,
  ): [Unit<T>[], number, number] {
    const units: Unit<T>[] = [];

    let page_l = Number.POSITIVE_INFINITY;
    let page_r = -1;

    for (const tb of text_blocks) {
      const [x0, y0, x2, y2] = get_bbox(tb);

      const unit: Unit<T> = [[x0, y0, x2, y2], tb];

      units.push(unit);

      if (x0 < page_l) {
        page_l = x0;
      }

      if (x2 > page_r) {
        page_r = x2;
      }
    }

    // Python:
    //
    // units.sort(key=lambda a: a[0][1])
    //
    // JS sort 是原地排序。
    units.sort((a, b) => a[0][1] - b[0][1]);

    return [units, page_l, page_r];
  }

  // ======================= 求行和竖切线 =====================

  /**
   * 扫描所有文本块，获取：
   *
   * 1. rows
   * 2. vertical cuts
   */
  private _get_cuts_rows(
    units: Unit<T>[],
    page_l: number,
    page_r: number,
  ): [Cut[], Unit<T>[][]] {
    /**
     * 使用 gaps2 更新 gaps1。
     *
     * Python 原版：
     *
     * update_gaps(gaps1, gaps2)
     */
    const update_gaps = (gaps1: Gap[], gaps2: Gap[]): [Gap[], Gap[]] => {
      const flags1 = gaps1.map(() => true);
      const flags2 = gaps2.map(() => true);

      const new_gaps1: Gap[] = [];

      for (let i1 = 0; i1 < gaps1.length; i1++) {
        const g1 = gaps1[i1];

        const l1 = g1[0];
        const r1 = g1[1];

        for (let i2 = 0; i2 < gaps2.length; i2++) {
          const g2 = gaps2[i2];

          const l2 = g2[0];
          const r2 = g2[1];

          // 计算交集
          const inter_l = Math.max(l1, l2);
          const inter_r = Math.min(r1, r2);

          // 如果交集有效
          if (inter_l <= inter_r) {
            new_gaps1.push([inter_l, inter_r, g1[2]]);

            flags1[i1] = false;
            flags2[i2] = false;
          }
        }
      }

      // gap2 新加入
      for (let i2 = 0; i2 < flags2.length; i2++) {
        if (flags2[i2]) {
          new_gaps1.push(gaps2[i2]);
        }
      }

      // gaps1 中彻底消失的项
      const del_gaps1: Gap[] = [];

      for (let i1 = 0; i1 < flags1.length; i1++) {
        if (flags1[i1]) {
          del_gaps1.push(gaps1[i1]);
        }
      }

      return [new_gaps1, del_gaps1];
    };

    // ========================================

    // 保证页面左右边缘不与文本块重叠
    page_l -= 1;
    page_r += 1;

    // 所有行
    const rows: Unit<T>[][] = [];

    // 已生成完毕的竖切线
    const completed_cuts: Cut[] = [];

    // 当前正在考察的间隙
    const gaps: Gap[] = [];

    let active_gaps: Gap[] = gaps;

    let row_index = 0;
    let unit_index = 0;

    // 从上到下遍历所有文本行
    const l_units = units.length;

    while (unit_index < l_units) {
      // ========== 查找当前行 ==========

      const unit = units[unit_index];

      const u_bottom = unit[0][3];

      const row: Unit<T>[] = [unit];

      // 查找当前行剩余块
      for (let i = unit_index + 1; i < units.length; i++) {
        const next_u = units[i];

        const next_top = next_u[0][1];

        if (next_top > u_bottom) {
          break;
        }

        row.push(next_u);

        // Python 原版这里会修改 unit_index
        unit_index = i;
      }

      // ========== 查找当前行的间隙 ==========

      row.sort((a, b) => {
        const ax = a[0][0];
        const bx = b[0][0];

        if (ax !== bx) {
          return ax - bx;
        }

        return a[0][2] - b[0][2];
      });

      const row_gaps: Gap[] = [];

      let search_start = page_l;

      for (const u of row) {
        const l = u[0][0];
        const r = u[0][2];

        // 块起始点大于搜索起始点
        if (l > search_start) {
          row_gaps.push([search_start, l, row_index]);
        }

        // 更新搜索起始点
        if (r > search_start) {
          search_start = r;
        }
      }

      // 页面右边缘加入最后一个间隙
      row_gaps.push([search_start, page_r, row_index]);

      // ========== 更新考察中的间隙组 ==========

      const [updated_gaps, del_gaps] = update_gaps(active_gaps, row_gaps);

      active_gaps = updated_gaps;

      // gaps 中被移除的项
      // 加入已经完成的竖切线
      const row_max = row_index - 1;

      for (const dg1 of del_gaps) {
        completed_cuts.push([dg1[0], dg1[1], dg1[2], row_max]);
      }

      // ========== End ==========

      rows.push(row);

      unit_index += 1;
      row_index += 1;
    }

    // 遍历结束，收集剩余 gaps
    const row_max = rows.length - 1;

    for (const g of active_gaps) {
      completed_cuts.push([g[0], g[1], g[2], row_max]);
    }

    // 从左到右排序
    completed_cuts.sort((a, b) => a[0] - b[0]);

    return [completed_cuts, rows];
  }

  // ======================= 求布局树 =====================

  /**
   * 一个布局树节点：
   *
   * {
   *   x_left,
   *   x_right,
   *   r_top,
   *   r_bottom,
   *   units,
   *   children
   * }
   */
  private _get_layout_tree(cuts: Cut[], rows: Unit<T>[][]): GapTreeNode<T> {
    /**
     * Python 原版如果 cuts 为空会直接报错：
     *
     * cuts[0]
     *
     * 因此这里也保持这个行为。
     */
    if (cuts.length === 0) {
      throw new Error("GapTree: cuts is empty");
    }

    // 生成每一行对应的间隙
    const rows_gaps: Array<Array<readonly [number, number]>> = Array.from(
      { length: rows.length },
      () => [],
    );

    for (let g_i = 0; g_i < cuts.length; g_i++) {
      const cut = cuts[g_i];

      for (let r_i = cut[2]; r_i <= cut[3]; r_i++) {
        rows_gaps[r_i].push([cut[0], cut[1]]);
      }
    }

    // 根节点
    const root: GapTreeNode<T> = {
      x_left: cuts[0][0] - 1,
      x_right: cuts[cuts.length - 1][1] + 1,
      r_top: -1,
      r_bottom: -1,
      units: [],
      children: [],
    };

    // 已经完成的节点
    const completed_nodes: GapTreeNode<T>[] = [root];

    // 当前正在考虑的节点
    let now_nodes: GapTreeNode<T>[] = [];

    // ========== 结束一个节点，加入节点树 ==========

    const complete = (node: GapTreeNode<T>) => {
      const node_r = node.x_right - 2;

      let max_nodes: GapTreeNode<T>[] = [];

      let max_r = -2;

      // 在完成列表中寻找父节点
      for (const com_node of completed_nodes) {
        // 父节点的垂直投影必须包含当前右界
        if (node_r < com_node.x_left || node_r > com_node.x_right + 0.0001) {
          continue;
        }

        // 父节点底部必须在当前节点顶部之上
        if (com_node.r_bottom >= node.r_top) {
          continue;
        }

        // 遇到更低的符合条件节点
        if (com_node.r_bottom > max_r) {
          max_r = com_node.r_bottom;
          max_nodes = [com_node];
          continue;
        }

        // 遇到同样低的符合条件节点
        if (com_node.r_bottom === max_r) {
          max_nodes.push(com_node);
          continue;
        }
      }

      /**
       * Python 原版：
       *
       * max_node = max(
       *     max_nodes,
       *     key=lambda n: n["x_right"]
       * )
       */
      if (max_nodes.length === 0) {
        throw new Error("GapTree: unable to find parent node");
      }

      let max_node = max_nodes[0];

      for (let i = 1; i < max_nodes.length; i++) {
        if (max_nodes[i].x_right > max_node.x_right) {
          max_node = max_nodes[i];
        }
      }

      max_node.children.push(node);

      completed_nodes.push(node);
    };

    // ========== 遍历每一行，更新节点树 ==========

    for (let r_i = 0; r_i < rows.length; r_i++) {
      const row = rows[r_i];

      const row_gaps = rows_gaps[r_i];

      let u_i = 0;
      let g_i = 0;

      // ========== 检查正在考虑的节点是否可以结束 ==========

      const new_nodes: GapTreeNode<T>[] = [];

      for (const node of now_nodes) {
        let l_flag = false;
        let r_flag = false;

        let completed_flag = false;

        const x_left = node.x_left;
        const x_right = node.x_right;

        for (const gap of row_gaps) {
          // 左边缘被间隙右侧延续
          if (gap[1] === x_left) {
            l_flag = true;
          }

          // 右边缘被间隙左侧延续
          if (gap[0] === x_right) {
            r_flag = true;
          }

          // 任意间隙在本节点内部
          // 打断本节点
          if (
            (x_left < gap[0] && gap[0] < x_right) ||
            (x_left < gap[1] && gap[1] < x_right)
          ) {
            completed_flag = true;
            break;
          }
        }

        // 左右任意一个边缘无法延续
        if (!l_flag || !r_flag) {
          completed_flag = true;
        }

        if (completed_flag) {
          complete(node);
        } else {
          node.r_bottom = r_i;
          new_nodes.push(node);
        }
      }

      now_nodes = new_nodes;

      // ========== 从左到右遍历，将文本块加入节点 ==========

      while (u_i < row.length) {
        const unit = row[u_i];

        /**
         * 当前块位于：
         *
         * gap[g_i] 与 gap[g_i + 1]
         *
         * 之间
         */
        const x_l = row_gaps[g_i][1];
        const x_r = row_gaps[g_i + 1][0];

        // 检查区间是否正确
        if (unit[0][0] + 0.0001 > x_r) {
          // 到下一个区间
          g_i += 1;
          continue;
        }

        // ========== 检查是否可以加入已有节点 ==========

        let flag = false;

        for (const node of now_nodes) {
          if (node.x_left === x_l && node.x_right === x_r) {
            node.units.push(unit);

            flag = true;
            break;
          }
        }

        if (flag) {
          u_i += 1;
          continue;
        }

        // ========== 创建新的节点 ==========

        now_nodes.push({
          x_left: x_l,
          x_right: x_r,
          r_top: r_i,
          r_bottom: r_i,
          units: [unit],
          children: [],
        });

        u_i += 1;
      }
    }

    // 将剩余节点加入节点树
    for (const node of now_nodes) {
      complete(node);
    }

    // ========== 整理所有节点 ==========

    for (const node of completed_nodes) {
      // 子节点从左到右
      node.children.sort((a, b) => a.x_left - b.x_left);

      // 块从上到下
      node.units.sort((a, b) => a[0][1] - b[0][1]);
    }

    return root;
  }

  // ======================= 前序遍历 =====================

  /**
   * 前序遍历布局树。
   */
  private _preorder_traversal(root: GapTreeNode<T> | null): GapTreeNode<T>[] {
    if (!root) {
      return [];
    }

    const stack: GapTreeNode<T>[] = [root];

    const result: GapTreeNode<T>[] = [];

    while (stack.length) {
      const node = stack.pop()!;

      result.push(node);

      /**
       * Python:
       *
       * stack += reversed(node["children"])
       *
       * JS 使用 reverse() 会修改原数组，
       * 所以这里使用 [...children].reverse()
       */
      stack.push(...[...node.children].reverse());
    }

    return result;
  }

  // ======================= 提取文本块 =====================

  /**
   * 从节点序列中提取原始文本块。
   */
  private _get_text_blocks(nodes: GapTreeNode<T>[]): T[] {
    const result: T[] = [];

    for (const node of nodes) {
      for (const unit of node.units) {
        result.push(unit[1]);
      }
    }

    return result;
  }
}
