import type { Buffer } from "node:buffer";

export interface UploadedFile {
  fileName: string;
  fieldName: string;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  encoding: string;
  path?: string;
}

export interface Request {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
  params: Record<string, string | undefined>;
  body?: unknown;
  files?: Record<string, UploadedFile>;
}

export interface Response {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Fire-and-forget side-effect hook called after the response is sent. */
export type Action<State = unknown> = (request: Request, state: State) => Promise<void>;

/** Core controller signature — framework-agnostic, pure function. */
export type Controller<State = unknown, Deps = unknown> = (
  request: Request,
  state: State,
  deps: Deps
) => Promise<Response | void>;
