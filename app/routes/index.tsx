import { redirect } from "react-router";
import { isAuthenticated } from "~/services/auth.mock";

export function loader() {
  if (isAuthenticated()) {
    return redirect("/home");
  }
  return redirect("/login");
}

// Este componente nunca se renderiza porque el loader
// siempre redirige antes, pero React Router lo requiere.
export default function Index() {
  return null;
}
