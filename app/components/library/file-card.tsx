import { Card } from "../ui/card";
import type { Attachment } from "../../db/db-zod-schema";

const FileCard = ({ attachment }: { attachment: Attachment }) => {
  return <Card size="sm" className="mx-auto w-full max-w-sm h-64"></Card>;
};

export default FileCard;
