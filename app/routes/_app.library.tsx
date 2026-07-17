import { eq, useLiveQuery } from "@tanstack/react-db";
import { attachmentColl } from "~/db/tdb-collections";

const Library = () => {
  const a = useLiveQuery((q) => q.from({ attachmentColl }));
  return (
    <div>
      {a.data?.length}
      {a.data?.map((it) => (
        <div key={it.id}>{JSON.stringify(it)}</div>
      ))}
    </div>
  );
};

export default Library;
