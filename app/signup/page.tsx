import AuthForm from "@/components/auth-form";
import { databaseConfigured, DATABASE_DEPLOYMENT_MESSAGE } from "@/lib/deployment";
export default function Signup() {
  return <AuthForm signup unavailable={!databaseConfigured() ? DATABASE_DEPLOYMENT_MESSAGE : undefined} />;
}
