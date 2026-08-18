import { AttachmentTrigger } from "../ui/attachment";
import { Dialog, DialogTrigger } from "../ui/dialog";
import type { PropsWithChildren } from "react";

const AttachmentDialog = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <AttachmentTrigger />
      </DialogTrigger>
      {children}
    </Dialog>
  );
};

export default AttachmentDialog;
