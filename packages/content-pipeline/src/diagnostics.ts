export class ContentError extends Error {
  constructor(
    public readonly file: string,
    public readonly field: string,
    message: string,
  ) {
    super(`${file}${field ? ` ${field}` : ""}: ${message}`);
    this.name = "ContentError";
  }
}

export function fail(file: string, field: string, message: string): never {
  throw new ContentError(file, field, message);
}
