import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Return absolute paths of all .graphql schema files.
 * Search order:
 *   1. dist/resources (when running compiled code)
 *   2. src/resources  (fallback when running ts directly / not copied)
 */
export const getAllGraphQLFiles = (): string[] => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // __dirname is <projectRoot>/dist/services when compiled; we want dist/resources sibling.
  const distResources = path.resolve(__dirname, "../resources");
  // When running via ts-node (or a future dev runner) this file may be in src/services.
  const srcResources = path.resolve(__dirname, "../../src/resources");

  console.log("Looking for GraphQL resources in:", {
    distResources,
    srcResources,
  });

  let resourcesDir: string | null = null;
  if (
    fs.existsSync(distResources) &&
    fs.statSync(distResources).isDirectory()
  ) {
    resourcesDir = distResources;
  } else if (
    fs.existsSync(srcResources) &&
    fs.statSync(srcResources).isDirectory()
  ) {
    resourcesDir = srcResources;
  }

  if (!resourcesDir) {
    console.warn(
      "No GraphQL resources directory found (looked in dist/resources and src/resources). Returning empty schema list."
    );
    return [];
  }

  return fs
    .readdirSync(resourcesDir)
    .filter((f) => f.endsWith(".graphql"))
    .map((f) => path.join(resourcesDir!, f));
};
