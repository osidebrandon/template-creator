export const cloneJson = <TValue>(value: TValue): TValue => {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError("Snapshot values must be JSON-serializable.");
  }

  return JSON.parse(serialized) as TValue;
};
