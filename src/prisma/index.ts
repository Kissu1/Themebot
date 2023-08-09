import { Prisma, PrismaClient } from "@prisma/client";
import { logger } from "#root/logger.js";

const parseParameters = (parameters: string): unknown[] => {
  try {
    return JSON.parse(parameters) as unknown[];
  } catch {
    return [];
  }
};

export const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
});

export type PrismaClientX = typeof prisma;

prisma.$on("query", (event: Prisma.QueryEvent) => {
  const parameters = parseParameters(
    event.params.replaceAll(
      /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.?\d* UTC/g,
      (date) => `"${date}"`,
    ),
  );
  const query = event.query.replaceAll(
    /(\?|\$\d+)/g,
    (match, parameter_, offset, string: string) => {
      const parameter = JSON.stringify(parameters.shift());
      const previousChar = string.charAt(offset - 1);

      return (previousChar === "," ? " " : "") + parameter;
    },
  );

  logger.debug({
    msg: "database query",
    query,
    duration: event.duration,
  });
});

prisma.$on("error", (event: Prisma.LogEvent) => {
  logger.error({
    msg: "database error",
    target: event.target,
    message: event.message,
  });
});

prisma.$on("info", (event: Prisma.LogEvent) => {
  logger.info({
    msg: "database info",
    target: event.target,
    message: event.message,
  });
});

prisma.$on("warn", (event: Prisma.LogEvent) => {
  logger.warn({
    msg: "database warning",
    target: event.target,
    message: event.message,
  });
});
