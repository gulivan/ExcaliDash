export class Issuer {
  static async discover(): Promise<never> {
    throw new Error("OIDC is unavailable in LocalDraw desktop mode");
  }
}
