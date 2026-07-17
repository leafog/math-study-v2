import { useImmer } from "use-immer";
import { Button } from "~/components/ui/button";

const A = () => {
  const [t, setT] = useImmer(new Set<string>());
  return (
    <div>
      {Array.from(t).map((it) => (
        <div key={it}>
          {it}
          <Button
            onClick={(e) => {
              setT((draft) => {
                draft.delete(it);
                draft.add(it);
              });
            }}
          >
            click
          </Button>
        </div>
      ))}
      <Button
        onClick={() => {
          setT((it) => it.add(`${it.size}--`));
        }}
      >
        Add
      </Button>
      <Button
        onClick={() => {
          alert(JSON.stringify(t));
        }}
      >
        change
      </Button>
    </div>
  );
};

export default A;
