import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';
import 'dotenv/config'; // 添加此行以解决模块未找到的错误

config({ path: '.env.local' });

// 调试输出环境变量
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

export default defineConfig({
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    ssl: false,
  },
  verbose: true,
  strict: true,
});

// import type { Config } from 'drizzle-kit';
// import { config } from 'dotenv';

// config({ path: '.env.local' });

// export default {
//   schema: "./db/schema.ts",
//   out: "./drizzle",
//   dialect: 'pg',
//   dbCredentials: {
//     host: process.env.DB_HOST!,
//       port: parseInt(process.env.DB_PORT!, 10),
//       user: process.env.DB_USER!,
//       password: process.env.DB_PASSWORD!,
//       database: process.env.DB_NAME!,
//   },
//   verbose: true,
//   strict: true,
// } satisfies Config;
