export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "postgres://fintrack:fintrack@localhost:5432/fintrack",
  jwtSecret: process.env.JWT_SECRET ?? "development-secret-change-before-deployment",
  refreshSecret: process.env.REFRESH_TOKEN_SECRET ?? "development-refresh-secret-change"
};
