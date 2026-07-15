import { PowerSyncTransactor } from "@tanstack/powersync-db-collection";
import { createTransaction } from "@tanstack/react-db";
import { db } from "./pw-db";

export const createTx = () =>
  createTransaction({
    autoCommit: true,
    mutationFn: async ({ transaction }) => {
      await new PowerSyncTransactor({ database: db }).applyTransaction(
        transaction,
      );
    },
  });
