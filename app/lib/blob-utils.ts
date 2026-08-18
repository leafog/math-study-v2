export const blobUrlToBlob = async (blobUrl: string) => {
  const res = await fetch(blobUrl);
  return res.blob();
};
