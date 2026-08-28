export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message);
}

export function unauthorized(message = "Unauthorized"): HttpError {
  return new HttpError(401, message);
}
