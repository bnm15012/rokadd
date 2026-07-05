import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function tenantPrisma(shopId: number) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        const tenantModels = [
          "Product",
          "Category",
          "Vendor",
          "Customer",
          "Sale",
          "Purchase",
          "Expense",
          "StockLog",
          "CreditSale",
          "DailySummary",
        ];

        if (model && tenantModels.includes(model)) {
          if (
            [
              "findMany",
              "findFirst",
              "findUnique",
              "count",
              "aggregate",
            ].includes(operation)
          ) {
            args.where = { ...args.where, shopId };
          }
          if (["create"].includes(operation)) {
            args.data = { ...args.data, shopId };
          }
          if (
            ["update", "updateMany", "delete", "deleteMany"].includes(
              operation
            )
          ) {
            args.where = { ...args.where, shopId };
          }
        }

        return query(args);
      },
    },
  });
}
