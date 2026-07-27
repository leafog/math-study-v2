import { math } from "@streamdown/math";
import { Streamdown } from "streamdown";

const A = () => {
  const a = String.raw`The quadratic formula is $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$ for solving equations.`;
  return (
    <div className="typeset typeset-chat max-w-[42em] mx-auto p-8">
      <h2>Typeset + KaTeX 测试</h2>
      <p>下面是一个行内公式 $x^2 + y^2 = z^2$ 和一个块级公式：</p>
      <Streamdown plugins={{ math }}>{a}</Streamdown>
      <p>这是公式后面的段落，用来观察行间距。</p>
    </div>
  );
};

export default A;
