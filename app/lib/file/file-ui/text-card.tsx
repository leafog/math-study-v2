import { useEffect, useState } from "react";
import type { FileCardProps } from "./file-card";
import FileCard from "./file-card";
import { fileStore } from "~/db/indexdb-file-storage";
import { NotepadText } from "lucide-react";

const TextCard = ({ row, ...props }: FileCardProps) => {
  return (
    <FileCard
      row={row}
      showTitle
      showScrim={false}
      className="transition-colors hover:bg-muted"
      {...props}
    >
      <div className="size-full mx-auto flex items-center justify-center -mt-4">
        <NotepadText className="size-10" />
      </div>
    </FileCard>
  );
};

export default TextCard;
