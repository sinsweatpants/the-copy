import { config as dotenvConfig } from "dotenv";
import dotenvExpand from "dotenv-expand";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// يبحث تلقائيًا عن .env سواء في جذر المستودع أو داخل backend/ أو المحلي
const candidates = [
  "../../../.env", // جذر المستودع (عند التشغيل من dist/src)
  "../../.env", // داخل backend/
  ".env", // احتياطي داخل نفس المجلد
].map((p) => path.resolve(__dirname, p));

const envPath = candidates.find((p) => fs.existsSync(p));
const env = dotenvConfig(envPath ? { path: envPath } : undefined);
dotenvExpand.expand(env);

if (!envPath) {
  console.warn("[load-env] لا يوجد .env في المسارات المتوقعة. سيتم الاعتماد على متغيرات بيئة النظام.");
}
if ((env as any)?.error) {
  console.error("[load-env] فشل تحميل .env:", (env as any).error);
}
