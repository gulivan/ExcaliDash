const unavailable = async (): Promise<never> => {
  throw new Error("Password operations are unavailable in LocalDraw desktop mode");
};

export const hash = unavailable;
export const compare = unavailable;
export default { hash, compare };
