class UnsupportedS3Command {
  constructor(_input?: unknown) {}
}

export class S3Client {
  constructor(_config?: unknown) {}
  async send(): Promise<never> {
    throw new Error("S3 is unavailable in LocalDraw desktop mode");
  }
}

export const PutObjectCommand = UnsupportedS3Command;
export const GetObjectCommand = UnsupportedS3Command;
export const DeleteObjectCommand = UnsupportedS3Command;
export const ListObjectsV2Command = UnsupportedS3Command;
export const CopyObjectCommand = UnsupportedS3Command;
