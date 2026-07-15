export default class BetterSqlite3Unavailable {
  constructor() {
    throw new Error("Legacy SQLite tools are unavailable in LocalDraw desktop mode");
  }
}
