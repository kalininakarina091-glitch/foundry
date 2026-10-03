import AuthForm from "@/components/auth-form";
import { isNetlifyDeployment, DATABASE_DEPLOYMENT_MESSAGE } from "@/lib/deployment";
export default function Signup() {
  return <AuthForm signup unavailable={isNetlifyDeployment() ? DATABASE_DEPLOYMENT_MESSAGE : undefined} />;
}
