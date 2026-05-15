import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/",              "routes/index.tsx"),
  route("/login",         "routes/login.tsx"),
  route("/register",      "routes/register.tsx"),
  route("/home",          "routes/home.tsx"),
  route("/crear",         "routes/crear.tsx"),
  route("/matchmaking",   "routes/matchmaking.tsx"),
  route("/perfil",        "routes/perfil.tsx"),
  route("/perfil/editar", "routes/perfil.editar.tsx"),
  route("/ranking",       "routes/ranking.tsx"),
] satisfies RouteConfig;
