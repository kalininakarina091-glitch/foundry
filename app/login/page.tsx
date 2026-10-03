import AuthForm from "@/components/auth-form";
import { isNetlifyDeployment, DATABASE_DEPLOYMENT_MESSAGE } from "@/lib/deployment";
export default function Login() {
  return <AuthForm unavailable={isNetlifyDeployment() ? DATABASE_DEPLOYMENT_MESSAGE : undefined} />;
}
