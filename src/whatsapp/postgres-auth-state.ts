import {
  AuthenticationCreds,
  AuthenticationState,
  initAuthCreds,
  proto,
  SignalDataTypeMap,
} from '@whiskeysockets/baileys';
import { PrismaService } from '../prisma/prisma.service';
import { encryptString, decryptString } from './crypto.util';

// Baileys ships BufferJSON for (de)serializing Buffer/Uint8Array fields;
// importing the exact export path can shift between versions, so we
// re-implement the same JSON reviver/replacer contract here.
const BufferJSON = {
  replacer: (_key: string, value: any) => {
    if (value?.type === 'Buffer' && Array.isArray(value?.data)) {
      return { type: 'Buffer', data: Buffer.from(value.data).toString('base64') };
    }
    if (value instanceof Uint8Array) {
      return { type: 'Buffer', data: Buffer.from(value).toString('base64') };
    }
    return value;
  },
  reviver: (_key: string, value: any) => {
    if (value?.type === 'Buffer' && typeof value?.data === 'string') {
      return Buffer.from(value.data, 'base64');
    }
    return value;
  },
};

function serialize(data: unknown): string {
  return JSON.stringify(data, BufferJSON.replacer);
}

function deserialize<T>(json: string): T {
  return JSON.parse(json, BufferJSON.reviver);
}

/**
 * Loads/persists Baileys' AuthenticationState for one user, backed by
 * Postgres (WhatsAppSession for creds, WhatsAppSessionKey for signal keys)
 * with values encrypted at rest. Mirrors the on-disk useMultiFileAuthState
 * shape/behavior so it drops into makeWASocket({ auth }) unchanged.
 */
export async function usePostgresAuthState(
  prisma: PrismaService,
  userId: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const existing = await prisma.whatsAppSession.findUnique({ where: { userId } });
  const creds: AuthenticationCreds = existing?.credsData
    ? deserialize(decryptString(existing.credsData))
    : initAuthCreds();

  const saveCreds = async () => {
    await prisma.whatsAppSession.upsert({
      where: { userId },
      create: { userId, credsData: encryptString(serialize(creds)) },
      update: { credsData: encryptString(serialize(creds)) },
    });
  };

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type, ids) => {
        const rows = await prisma.whatsAppSessionKey.findMany({
          where: { userId, category: type, keyId: { in: ids } },
        });
        const result: { [id: string]: SignalDataTypeMap[typeof type] } = {};
        for (const row of rows) {
          let value = deserialize<any>(decryptString(row.data));
          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }
          result[row.keyId] = value;
        }
        return result;
      },
      set: async (data) => {
        const ops: Promise<unknown>[] = [];
        for (const category of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
          const categoryData = data[category];
          if (!categoryData) continue;
          for (const keyId of Object.keys(categoryData)) {
            const value = categoryData[keyId];
            if (value === null || value === undefined) {
              ops.push(
                prisma.whatsAppSessionKey
                  .delete({ where: { userId_category_keyId: { userId, category, keyId } } })
                  .catch(() => undefined), // no-op if it never existed
              );
            } else {
              const encrypted = encryptString(serialize(value));
              ops.push(
                prisma.whatsAppSessionKey.upsert({
                  where: { userId_category_keyId: { userId, category, keyId } },
                  create: { userId, category, keyId, data: encrypted },
                  update: { data: encrypted },
                }),
              );
            }
          }
        }
        await Promise.all(ops);
      },
    },
  };

  return { state, saveCreds };
}

export async function clearAuthState(prisma: PrismaService, userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.whatsAppSessionKey.deleteMany({ where: { userId } }),
    prisma.whatsAppSession.deleteMany({ where: { userId } }),
  ]);
}
