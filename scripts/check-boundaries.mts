import { readFile, readdir } from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const projects = ["entity-model", "content-pipeline", "entity-ui"];
const errors: string[] = [];
async function visit(directory: string, project: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", ".generated", "generated"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(file, project);
    else if (/\.[cm]?tsx?$/.test(entry.name)) {
      const text = await readFile(file, "utf8");
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
      const imports: string[] = [];
      function collect(node: ts.Node) {
        if (
          (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
          node.moduleSpecifier &&
          ts.isStringLiteral(node.moduleSpecifier)
        )
          imports.push(node.moduleSpecifier.text);
        if (
          ts.isCallExpression(node) &&
          (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
            (ts.isIdentifier(node.expression) && node.expression.text === "require"))
        ) {
          const argument = node.arguments[0];
          if (argument && ts.isStringLiteral(argument)) imports.push(argument.text);
        }
        ts.forEachChild(node, collect);
      }
      collect(source);
      for (const specifier of imports) {
        const browser = project === "entity-ui" || project === "site" || project === "storybook";
        const resolved = specifier.startsWith(".")
          ? path
              .relative(root, path.resolve(path.dirname(file), specifier))
              .split(path.sep)
              .join("/")
          : specifier;
        const pipeline = /^@tracker\/content-pipeline(?:\/|$)|^packages\/content-pipeline\//.test(
          resolved,
        );
        const ui = /^@tracker\/entity-ui(?:\/|$)|^packages\/entity-ui\//.test(resolved);
        const node = specifier.startsWith("node:") || builtinModules.includes(specifier);
        if (
          browser &&
          (node ||
            pipeline ||
            /(?:^|\/)(research|content|proposals|references)(?:\/|$)/.test(resolved))
        ) {
          errors.push(`${path.relative(root, file)} imports forbidden ${specifier}`);
        }
        if (
          project === "entity-model" &&
          (node || pipeline || ui || /^react|^@fluentui/.test(specifier))
        )
          errors.push(`${file}: model depends on ${specifier}`);
        if (project === "content-pipeline" && (ui || /^react|^@fluentui/.test(specifier)))
          errors.push(`${file}: Node pipeline depends on ${specifier}`);
      }
    }
  }
}
for (const project of projects) await visit(path.join(root, "packages", project, "src"), project);
await visit(path.join(root, "apps/site/src"), "site");
// Storybook configuration is Node-side; only fixture and story content is browser-side.
await visit(path.join(root, "apps/storybook/fixtures"), "storybook");
if (errors.length) throw new Error(errors.join("\n"));
console.log("Package runtime boundaries passed");
