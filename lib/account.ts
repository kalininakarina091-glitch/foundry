import { z } from "zod";
// Shared by registration and password change.
export const passwordSchema = z.string().min(12).max(128);
export const PASSWORD_RULE = "Пароль должен содержать от 12 до 128 символов.";
// Typed confirmation for account deletion, compared case-insensitively.
export const DELETE_CONFIRMATION = "удалить";
/** The last administrator cannot delete themselves: nobody could run the pipeline. */
export function deletionBlocked(isAdmin: boolean, adminCount: number): boolean {
  return isAdmin && adminCount <= 1;
}
