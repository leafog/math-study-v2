import { MessageResponse } from "../ai-elements/message";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "~/lib/utils";

export interface ProblemProps {
  content: string;
  description?: string | null;
  source?: string;
  className?: string;
}

const Problem = ({ content, description, source, className }: ProblemProps) => {
  return (
    <Card className={cn("my-3 min-w-0 relative m-1", className)}>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 rounded-l-xl" />
      <CardHeader className="pb-2 pl-5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            📐 Problem
          </CardTitle>
          {source && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {source}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pl-5 min-w-0">
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        <div className="text-base min-w-0">
          <MessageResponse>{content}</MessageResponse>
        </div>
      </CardContent>
    </Card>
  );
};

export default Problem;
