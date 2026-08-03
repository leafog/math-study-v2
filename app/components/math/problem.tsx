import { useLiveQuery, eq } from "@tanstack/react-db";
import { MessageResponse } from "../ai-elements/message";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import useKgTopics from "~/hooks/use-kg-topics";
import type { KgTopic } from "~/db/db-zod-schema";
import { answerRecordColl } from "~/db/tdb-collections";

export interface ProblemProps {
  id?: string;
  content: string;
  description?: string | null;
  source?: string;
  tags?: KgTopic[];
  className?: string;
}

function useAnswerStatus(problemId?: string): boolean | undefined {
  const { data: answers } = useLiveQuery(
    (q) =>
      q
        .from({ answerRecordColl })
        .where(({ answerRecordColl: col }) =>
          eq(col.problem_id, problemId ?? ""),
        ),
    [problemId],
  );
  if (!answers?.length) return undefined;
  return answers.at(-1)?.correct;
}

const Problem = ({
  id,
  content,
  description,
  source,
  tags = [],
  className,
}: ProblemProps) => {
  const correct = useAnswerStatus(id);

  const barColor =
    correct === undefined
      ? "bg-muted-foreground/20"
      : correct
        ? "bg-primary/60"
        : "bg-destructive/60";

  return (
    <Card className={cn("my-3 min-w-0 relative m-1", className)}>
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          barColor,
        )}
      />
      <CardHeader className="pb-2 pl-5">
        <CardTitle className="text-sm font-medium text-muted-foreground"></CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button>click</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3 pl-5 min-w-0">
        <div className="text-base min-w-0">
          <MessageResponse>{content}</MessageResponse>
        </div>
      </CardContent>
      {tags.length > 0 && (
        <CardFooter className="flex flex-wrap gap-1 pt-0 pb-3 pl-5">
          {tags.map((topic) => (
            <Badge key={topic.id} variant="secondary" className="text-xs">
              {topic.i18n?.zh ?? topic.name}
            </Badge>
          ))}
        </CardFooter>
      )}
    </Card>
  );
};

export default Problem;
