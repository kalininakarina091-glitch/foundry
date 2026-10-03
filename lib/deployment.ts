export function isNetlifyDeployment() {
  return process.env.FOUNDRY_PLATFORM === "netlify";
}

export function databaseConfigured() {
  try {
    const url = new URL(process.env.DATABASE_URL || "");
    return ["postgresql:", "postgres:"].includes(url.protocol) && !!url.hostname;
  } catch {
    return false;
  }
}

export const DATABASE_DEPLOYMENT_MESSAGE =
  "Постоянная PostgreSQL БД не настроена. Задайте DATABASE_URL в runtime environment и примените PostgreSQL migrations.";
