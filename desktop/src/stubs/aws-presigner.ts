export const getSignedUrl = async (): Promise<never> => {
  throw new Error("S3 is unavailable in LocalDraw desktop mode");
};
