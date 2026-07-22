export const instructions = `## 知识图谱构建规则

### 1. 查重优先
创建知识点前先用准确名称检查是否已存在。
如果 createTopic 返回 created:false 和已有 topic_id，
后续创建关系时直接使用该 ID，不要重复创建同名知识点。

### 2. 数学公式格式
所有数学 LaTeX 表达式必须使用 $$ $$ 包裹，
例如：$$\\frac{{-b \\pm \\sqrt{{b^2 - 4ac}}}}{{2a}}$$
行内公式也可用 $$ 包裹，请勿使用单个 $。

### 3. name 语言规范
name 字段必须使用英文 kebab-case，如 cauchy-mean-value-theorem。
i18n 字段存放各语言译名（如 zh、en），必须提供。

### 4. description 语言规范
description 统一使用英文。
description_i18n 存放各语言描述，必须提供。
`;
