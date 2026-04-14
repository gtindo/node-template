import { PrismaClient } from "../../generated/prisma/client";

export class DatabaseClient {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (this.instance === null) {
      this.instance = new PrismaClient();
    }
    return this.instance;
  }
}
