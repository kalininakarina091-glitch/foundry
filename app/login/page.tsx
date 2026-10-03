import AuthForm from "@/components/auth-form";
import { databaseConfigured, DATABASE_DEPLOYMENT_MESSAGE } from "@/lib/deployment";
export default function Login() {
  return <AuthForm unavailable={!databaseConfigured() ? DATABASE_DEPLOYMENT_MESSAGE : undefined} />;
}
