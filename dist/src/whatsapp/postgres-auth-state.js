"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePostgresAuthState = usePostgresAuthState;
exports.clearAuthState = clearAuthState;
const baileys_1 = require("@whiskeysockets/baileys");
const crypto_util_1 = require("./crypto.util");
const BufferJSON = {
    replacer: (_key, value) => {
        if (value?.type === 'Buffer' && Array.isArray(value?.data)) {
            return { type: 'Buffer', data: Buffer.from(value.data).toString('base64') };
        }
        if (value instanceof Uint8Array) {
            return { type: 'Buffer', data: Buffer.from(value).toString('base64') };
        }
        return value;
    },
    reviver: (_key, value) => {
        if (value?.type === 'Buffer' && typeof value?.data === 'string') {
            return Buffer.from(value.data, 'base64');
        }
        return value;
    },
};
function serialize(data) {
    return JSON.stringify(data, BufferJSON.replacer);
}
function deserialize(json) {
    return JSON.parse(json, BufferJSON.reviver);
}
async function usePostgresAuthState(prisma, userId) {
    const existing = await prisma.whatsAppSession.findUnique({ where: { userId } });
    const creds = existing?.credsData
        ? deserialize((0, crypto_util_1.decryptString)(existing.credsData))
        : (0, baileys_1.initAuthCreds)();
    const saveCreds = async () => {
        await prisma.whatsAppSession.upsert({
            where: { userId },
            create: { userId, credsData: (0, crypto_util_1.encryptString)(serialize(creds)) },
            update: { credsData: (0, crypto_util_1.encryptString)(serialize(creds)) },
        });
    };
    const state = {
        creds,
        keys: {
            get: async (type, ids) => {
                const rows = await prisma.whatsAppSessionKey.findMany({
                    where: { userId, category: type, keyId: { in: ids } },
                });
                const result = {};
                for (const row of rows) {
                    let value = deserialize((0, crypto_util_1.decryptString)(row.data));
                    if (type === 'app-state-sync-key' && value) {
                        value = baileys_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                    }
                    result[row.keyId] = value;
                }
                return result;
            },
            set: async (data) => {
                const ops = [];
                for (const category of Object.keys(data)) {
                    const categoryData = data[category];
                    if (!categoryData)
                        continue;
                    for (const keyId of Object.keys(categoryData)) {
                        const value = categoryData[keyId];
                        if (value === null || value === undefined) {
                            ops.push(prisma.whatsAppSessionKey
                                .delete({ where: { userId_category_keyId: { userId, category, keyId } } })
                                .catch(() => undefined));
                        }
                        else {
                            const encrypted = (0, crypto_util_1.encryptString)(serialize(value));
                            ops.push(prisma.whatsAppSessionKey.upsert({
                                where: { userId_category_keyId: { userId, category, keyId } },
                                create: { userId, category, keyId, data: encrypted },
                                update: { data: encrypted },
                            }));
                        }
                    }
                }
                await Promise.all(ops);
            },
        },
    };
    return { state, saveCreds };
}
async function clearAuthState(prisma, userId) {
    await prisma.$transaction([
        prisma.whatsAppSessionKey.deleteMany({ where: { userId } }),
        prisma.whatsAppSession.deleteMany({ where: { userId } }),
    ]);
}
//# sourceMappingURL=postgres-auth-state.js.map