export function isNetlifyDeployment() {
  return process.env.FOUNDRY_PLATFORM === "netlify";
}

export const DATABASE_DEPLOYMENT_MESSAGE =
  "Для работы аккаунтов и рыночных данных на Netlify требуется постоянная внешняя БД. Локальный SQLite в deploy preview не используется.";
