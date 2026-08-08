import { FileQuestion } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ProblemPreviewSimple } from "~/components/math/problem-preview-simple";
import { usePinnedProblems } from "~/store/pinned-problems-store";
import { useBoolean } from "usehooks-ts";
import { useEffect } from "react";

export function ChatPinnedProblemBtn({ chatId }: Readonly<{ chatId: string }>) {
  const { value, toggle, setTrue } = useBoolean(true);
  const pinnedId = usePinnedProblems((s) => s.pinned[chatId]);

  useEffect(() => {
    setTrue();
  }, [pinnedId]);

  if (!pinnedId) return null;
  return (
    <Popover open={value}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={() => toggle()}>
          <FileQuestion className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 sm:w-96 p-0"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <ProblemPreviewSimple
          problemId={pinnedId}
          chatId={chatId}
          pinnedDivHeight={null}
        />
      </PopoverContent>
    </Popover>
  );
}
