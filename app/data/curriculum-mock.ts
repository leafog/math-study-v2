export type CurriculumNode = {
  id: string;
  name: string;
  subject: string;
  description?: string;
  difficulty?: 1 | 2 | 3;
};

export type CurriculumEdge = {
  source: string;
  target: string;
  type: "prerequisite" | "unlocks";
};

export const subjects = [
  "算术",
  "代数",
  "几何",
  "三角学",
  "微积分",
  "统计",
  "逻辑",
] as const;

export type Subject = (typeof subjects)[number];

export const curriculumNodes: CurriculumNode[] = [
  // ── 算术 ──
  { id: "counting", name: "计数", subject: "算术", difficulty: 1 },
  { id: "add_sub", name: "加减法", subject: "算术", difficulty: 1 },
  { id: "mul_div", name: "乘除法", subject: "算术", difficulty: 1 },
  { id: "fraction", name: "分数", subject: "算术", difficulty: 2 },
  { id: "decimal", name: "小数", subject: "算术", difficulty: 2 },
  { id: "percent", name: "百分比", subject: "算术", difficulty: 2 },
  { id: "ratio", name: "比例", subject: "算术", difficulty: 2 },
  { id: "power", name: "幂运算", subject: "算术", difficulty: 2 },
  { id: "root", name: "开方", subject: "算术", difficulty: 2 },
  { id: "neg_num", name: "负数", subject: "算术", difficulty: 2 },

  // ── 代数 ──
  { id: "var_expr", name: "变量与表达式", subject: "代数", difficulty: 1 },
  { id: "linear_eq", name: "一元一次方程", subject: "代数", difficulty: 1 },
  { id: "simul_eq", name: "方程组", subject: "代数", difficulty: 2 },
  { id: "quad_eq", name: "一元二次方程", subject: "代数", difficulty: 2 },
  { id: "poly", name: "多项式", subject: "代数", difficulty: 2 },
  { id: "factor", name: "因式分解", subject: "代数", difficulty: 2 },
  { id: "inequality", name: "不等式", subject: "代数", difficulty: 2 },
  { id: "func_basic", name: "函数基础", subject: "代数", difficulty: 2 },
  { id: "linear_func", name: "线性函数", subject: "代数", difficulty: 2 },
  { id: "quad_func", name: "二次函数", subject: "代数", difficulty: 3 },
  { id: "matrix", name: "矩阵", subject: "代数", difficulty: 3 },
  { id: "vector", name: "向量", subject: "代数", difficulty: 3 },
  { id: "complex", name: "复数", subject: "代数", difficulty: 3 },

  // ── 几何 ──
  { id: "point_line", name: "点与线", subject: "几何", difficulty: 1 },
  { id: "angle", name: "角", subject: "几何", difficulty: 1 },
  { id: "triangle", name: "三角形", subject: "几何", difficulty: 1 },
  { id: "quadrilateral", name: "四边形", subject: "几何", difficulty: 1 },
  { id: "circle", name: "圆", subject: "几何", difficulty: 2 },
  { id: "pythagorean", name: "勾股定理", subject: "几何", difficulty: 2 },
  { id: "congruent", name: "全等与相似", subject: "几何", difficulty: 2 },
  { id: "area", name: "面积与体积", subject: "几何", difficulty: 2 },
  { id: "coord_geo", name: "解析几何", subject: "几何", difficulty: 3 },
  { id: "transform", name: "几何变换", subject: "几何", difficulty: 3 },

  // ── 三角学 ──
  { id: "trig_ratio", name: "三角比", subject: "三角学", difficulty: 2 },
  { id: "unit_circle", name: "单位圆", subject: "三角学", difficulty: 2 },
  { id: "sin_cos", name: "正弦与余弦", subject: "三角学", difficulty: 2 },
  { id: "tan_cot", name: "正切与余切", subject: "三角学", difficulty: 2 },
  { id: "trig_id", name: "三角恒等式", subject: "三角学", difficulty: 3 },
  { id: "trig_eq", name: "三角方程", subject: "三角学", difficulty: 3 },

  // ── 微积分 ──
  { id: "limit", name: "极限", subject: "微积分", difficulty: 2 },
  { id: "derivative", name: "导数", subject: "微积分", difficulty: 2 },
  { id: "diff_rules", name: "求导法则", subject: "微积分", difficulty: 3 },
  { id: "chain_rule", name: "链式法则", subject: "微积分", difficulty: 3 },
  { id: "integral", name: "积分", subject: "微积分", difficulty: 3 },
  {
    id: "fundamental",
    name: "微积分基本定理",
    subject: "微积分",
    difficulty: 3,
  },
  { id: "series", name: "级数", subject: "微积分", difficulty: 3 },

  // ── 统计与概率 ──
  { id: "data_basic", name: "数据收集", subject: "统计", difficulty: 1 },
  { id: "mean_med", name: "均值与中位数", subject: "统计", difficulty: 1 },
  { id: "variance", name: "方差与标准差", subject: "统计", difficulty: 2 },
  { id: "dist", name: "概率分布", subject: "统计", difficulty: 2 },
  { id: "normal_dist", name: "正态分布", subject: "统计", difficulty: 3 },
  { id: "correlation", name: "相关性", subject: "统计", difficulty: 2 },
  { id: "probability", name: "概率基础", subject: "统计", difficulty: 1 },
  { id: "cond_prob", name: "条件概率", subject: "统计", difficulty: 2 },
  { id: "bayes", name: "贝叶斯定理", subject: "统计", difficulty: 3 },

  // ── 逻辑与集合 ──
  { id: "set", name: "集合", subject: "逻辑", difficulty: 1 },
  { id: "logic", name: "逻辑推理", subject: "逻辑", difficulty: 1 },
  { id: "truth_table", name: "真值表", subject: "逻辑", difficulty: 2 },
  { id: "proof", name: "证明方法", subject: "逻辑", difficulty: 2 },
];

export const curriculumEdges: CurriculumEdge[] = [
  // 算术 → 算术
  { source: "counting", target: "add_sub", type: "unlocks" },
  { source: "add_sub", target: "mul_div", type: "unlocks" },
  { source: "mul_div", target: "fraction", type: "unlocks" },
  { source: "mul_div", target: "decimal", type: "unlocks" },
  { source: "fraction", target: "percent", type: "unlocks" },
  { source: "decimal", target: "percent", type: "unlocks" },
  { source: "fraction", target: "ratio", type: "unlocks" },
  { source: "mul_div", target: "power", type: "unlocks" },
  { source: "power", target: "root", type: "unlocks" },
  { source: "add_sub", target: "neg_num", type: "unlocks" },

  // 算术 → 代数
  { source: "add_sub", target: "var_expr", type: "prerequisite" },
  { source: "neg_num", target: "var_expr", type: "prerequisite" },
  { source: "mul_div", target: "linear_eq", type: "prerequisite" },
  { source: "var_expr", target: "linear_eq", type: "unlocks" },
  { source: "linear_eq", target: "simul_eq", type: "unlocks" },
  { source: "linear_eq", target: "quad_eq", type: "unlocks" },
  { source: "power", target: "quad_eq", type: "prerequisite" },
  { source: "root", target: "quad_eq", type: "prerequisite" },
  { source: "var_expr", target: "poly", type: "unlocks" },
  { source: "poly", target: "factor", type: "unlocks" },
  { source: "linear_eq", target: "inequality", type: "unlocks" },
  { source: "var_expr", target: "func_basic", type: "unlocks" },
  { source: "func_basic", target: "linear_func", type: "unlocks" },
  { source: "quad_eq", target: "quad_func", type: "unlocks" },
  { source: "poly", target: "matrix", type: "unlocks" },
  { source: "matrix", target: "vector", type: "unlocks" },
  { source: "quad_eq", target: "complex", type: "unlocks" },
  { source: "root", target: "complex", type: "prerequisite" },

  // 几何 → 几何
  { source: "point_line", target: "angle", type: "unlocks" },
  { source: "angle", target: "triangle", type: "unlocks" },
  { source: "angle", target: "quadrilateral", type: "unlocks" },
  { source: "triangle", target: "congruent", type: "unlocks" },
  { source: "triangle", target: "pythagorean", type: "unlocks" },
  { source: "triangle", target: "circle", type: "unlocks" },
  { source: "triangle", target: "area", type: "unlocks" },
  { source: "quadrilateral", target: "area", type: "unlocks" },
  { source: "circle", target: "area", type: "unlocks" },
  { source: "congruent", target: "coord_geo", type: "unlocks" },
  { source: "coord_geo", target: "transform", type: "unlocks" },

  // 三角学
  { source: "triangle", target: "trig_ratio", type: "prerequisite" },
  { source: "angle", target: "trig_ratio", type: "prerequisite" },
  { source: "circle", target: "unit_circle", type: "prerequisite" },
  { source: "trig_ratio", target: "sin_cos", type: "unlocks" },
  { source: "unit_circle", target: "sin_cos", type: "unlocks" },
  { source: "sin_cos", target: "tan_cot", type: "unlocks" },
  { source: "sin_cos", target: "trig_id", type: "unlocks" },
  { source: "tan_cot", target: "trig_id", type: "unlocks" },
  { source: "trig_id", target: "trig_eq", type: "unlocks" },
  { source: "sin_cos", target: "trig_eq", type: "unlocks" },

  // 微积分
  { source: "func_basic", target: "limit", type: "prerequisite" },
  { source: "limit", target: "derivative", type: "unlocks" },
  { source: "derivative", target: "diff_rules", type: "unlocks" },
  { source: "diff_rules", target: "chain_rule", type: "unlocks" },
  { source: "limit", target: "integral", type: "unlocks" },
  { source: "derivative", target: "fundamental", type: "unlocks" },
  { source: "integral", target: "fundamental", type: "unlocks" },
  { source: "fundamental", target: "series", type: "unlocks" },

  // 统计
  { source: "counting", target: "data_basic", type: "prerequisite" },
  { source: "data_basic", target: "mean_med", type: "unlocks" },
  { source: "mean_med", target: "variance", type: "unlocks" },
  { source: "variance", target: "dist", type: "unlocks" },
  { source: "dist", target: "normal_dist", type: "unlocks" },
  { source: "mean_med", target: "correlation", type: "unlocks" },
  { source: "fraction", target: "probability", type: "prerequisite" },
  { source: "probability", target: "cond_prob", type: "unlocks" },
  { source: "cond_prob", target: "bayes", type: "unlocks" },

  // 逻辑
  { source: "counting", target: "set", type: "prerequisite" },
  { source: "set", target: "logic", type: "unlocks" },
  { source: "logic", target: "truth_table", type: "unlocks" },
  { source: "truth_table", target: "proof", type: "unlocks" },

  // 跨领域
  { source: "coord_geo", target: "linear_func", type: "prerequisite" },
  { source: "vector", target: "trig_ratio", type: "prerequisite" },
  { source: "sin_cos", target: "derivative", type: "prerequisite" },
  { source: "sin_cos", target: "integral", type: "prerequisite" },
  { source: "probability", target: "variance", type: "prerequisite" },
  { source: "set", target: "probability", type: "prerequisite" },
  { source: "matrix", target: "transform", type: "prerequisite" },
  { source: "vector", target: "coord_geo", type: "prerequisite" },
];

export function getSubjectColor(subject: string): string {
  const colorMap: Record<string, string> = {
    算术: "#4f46e5",
    代数: "#0891b2",
    几何: "#059669",
    三角学: "#d97706",
    微积分: "#dc2626",
    统计: "#7c3aed",
    逻辑: "#db2777",
  };
  return colorMap[subject] ?? "#6b7280";
}
