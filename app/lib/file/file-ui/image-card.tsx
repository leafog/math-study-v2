import { useEffect, useState } from "react";
import type { FileCardProps } from "./file-card";
import FileCard from "./file-card";
import { fileStore } from "~/db/indexdb-file-storage";

const ImageCard = ({ row, ...props }: FileCardProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (row.local_uri) {
      fileStore.getUrl(row.local_uri).then(setImageUrl);
    }
  }, [row.local_uri]);

  return (
    <FileCard
      row={row}
      style={{
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
      }}
      {...props}
    ></FileCard>
  );
};

export default ImageCard;
