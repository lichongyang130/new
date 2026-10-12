import type { AppArtifact, AppSchema } from "./app-schema";

export function generateApiArtifacts(schema: AppSchema): AppArtifact[] {
  const routes = (schema.api ?? []).map((route) => ({
    name: route.name,
    method: route.method,
    path: route.path,
    entity: route.entity ?? null,
    description: route.description ?? ""
  }));

  const content = [
    "export type GeneratedHttpMethod = \"GET\" | \"POST\" | \"PUT\" | \"PATCH\" | \"DELETE\";",
    "",
    "export interface GeneratedApiRoute {",
    "  name: string;",
    "  method: GeneratedHttpMethod;",
    "  path: string;",
    "  entity: string | null;",
    "  description: string;",
    "}",
    "",
    "/*",
    " * Generated route metadata only. Connect these definitions to authenticated",
    " * application handlers before exposing them publicly; this file does not",
    " * create database access or authorize requests on its own.",
    " */",
    "export const generatedApiRoutes: readonly GeneratedApiRoute[] = " +
      JSON.stringify(routes, null, 2) +
      ";",
    ""
  ].join("\n");

  return [{ path: "server/generated/api-routes.ts", content }];
}
