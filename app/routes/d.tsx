import { embed, cosineSim, similar } from "@ternlight/base";
import { useState } from "react";
import { Button } from "~/components/ui/button";

const a = cosineSim(embed("reset my password"), embed("I forgot my password")); // 0.91

const D = () => {
  const [t, setT] = useState("");
  return (
    <div>
      <Button
        onClick={(e) => {
          const r = similar("导 数", ["导数", "derivative"], {
            topK: 3,
          });
          setT(JSON.stringify(r));
        }}
      >
        click
      </Button>
      {t}
    </div>
  );
};

export default D;
