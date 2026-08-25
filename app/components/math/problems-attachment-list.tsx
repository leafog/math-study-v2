import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "~/components/ui/attachment";
import { DialogContent, DialogTitle } from "~/components/ui/dialog";
import { XIcon } from "lucide-react";
import type { Problem } from "~/db/db-zod-schema";
import MathResInline from "./math-res-inline";
import MathResBlock from "./math-res-block";
import StatusIcon from "./status-icon";
import AttachmentDialog from "../chat/attachment-dialog";

/**
 * Render problems as a list of attachments. Used in the prompt input (with a
 * remove action) and in chat messages (read-only, no `handleRemove`).
 */
export const ProblemsAttachmentList = ({
  problems = [],
  handleRemove,
}: {
  problems: Problem[];
  handleRemove?: (id: string) => void;
}) => {
  return (
    <AttachmentGroup className="w-full">
      {problems.map((it) => (
        <Attachment
          key={it.id}
          orientation="vertical"
          className="focus-within:ring-0"
        >
          <AttachmentMedia variant="image">
            <MathResBlock>{it.content}</MathResBlock>
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle className="flex gap-1.5 items-center">
              <StatusIcon status={it.status} />
              <MathResInline>{it.description}</MathResInline>
            </AttachmentTitle>
          </AttachmentContent>
          {handleRemove && (
            <AttachmentActions>
              <AttachmentAction
                type="button"
                onClick={() => handleRemove(it.id)}
              >
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          )}

          <AttachmentDialog>
            <DialogContent>
              <DialogTitle className="flex gap-1.5 items-center">
                <StatusIcon status={it.status} />
                <MathResInline>{it.description}</MathResInline>
              </DialogTitle>
              <div className="-mx-4 no-scrollbar max-h-[70vh] overflow-y-auto px-4">
                <MathResBlock>{it.content}</MathResBlock>
              </div>
            </DialogContent>
          </AttachmentDialog>
        </Attachment>
      ))}
    </AttachmentGroup>
  );
};
