import { createHash } from "node:crypto";
import * as ts from "typescript";
import type { CodeEvidence, DependencyEvidence, RepositoryEvidence, SupportedProvider } from "../../shared/intelligence";

type RepositoryFile = {
  path: string;
  content: string;
};

type EvidenceScanInput = {
  repositoryFullName: string;
  commitSha: string;
  defaultBranch: string;
  files: RepositoryFile[];
};

type ProviderPackage = {
  provider: SupportedProvider;
  packageName: string;
};

type Binding = {
  provider: SupportedProvider;
  packageName: string;
};

const PROVIDER_PACKAGES: ProviderPackage[] = [
  { provider: "stripe", packageName: "stripe" },
  { provider: "stripe", packageName: "@stripe/stripe-js" },
  { provider: "openai", packageName: "openai" },
  { provider: "twilio", packageName: "twilio" },
];

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function providerForPackage(packageName: string) {
  return PROVIDER_PACKAGES.find((candidate) => candidate.packageName === packageName);
}

function lineRange(sourceFile: ts.SourceFile, node: ts.Node): [number, number] {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
  return [start, end];
}

function createEvidence(input: {
  kind: CodeEvidence["kind"];
  provider: SupportedProvider;
  sourceFile: ts.SourceFile;
  node: ts.Node;
  symbol?: string;
  subjectCandidate?: string;
}): CodeEvidence {
  const [startLine, endLine] = lineRange(input.sourceFile, input.node);
  const snippet = input.node.getText(input.sourceFile).trim();
  return {
    kind: input.kind,
    provider: input.provider,
    path: input.sourceFile.fileName,
    startLine,
    endLine,
    symbol: input.symbol,
    subjectCandidate: input.subjectCandidate,
    snippet,
    snippetSha256: hash(snippet),
  };
}

function parseJson(content: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(content) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function getStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function resolvePackageLockVersion(lockContent: string | undefined, packageName: string) {
  if (!lockContent) return undefined;
  const lock = parseJson(lockContent);
  if (!lock) return undefined;
  const packages = lock.packages;
  if (packages && typeof packages === "object") {
    const packageEntry = (packages as Record<string, unknown>)[`node_modules/${packageName}`];
    if (packageEntry && typeof packageEntry === "object" && typeof (packageEntry as Record<string, unknown>).version === "string") {
      return (packageEntry as Record<string, string>).version;
    }
  }
  const dependencies = lock.dependencies;
  const dependencyEntry = dependencies && typeof dependencies === "object" ? (dependencies as Record<string, unknown>)[packageName] : undefined;
  return dependencyEntry && typeof dependencyEntry === "object" && typeof (dependencyEntry as Record<string, unknown>).version === "string"
    ? (dependencyEntry as Record<string, string>).version
    : undefined;
}

export function extractDependencyInventory(files: RepositoryFile[]): DependencyEvidence[] {
  const packageJson = files.find((file) => file.path === "package.json");
  if (!packageJson) return [];
  const manifest = parseJson(packageJson.content);
  if (!manifest) return [];

  const declarations = { ...getStringRecord(manifest.dependencies), ...getStringRecord(manifest.devDependencies) };
  const packageLock = files.find((file) => file.path === "package-lock.json");

  return PROVIDER_PACKAGES.flatMap((candidate) => {
    const declaredRange = declarations[candidate.packageName];
    if (!declaredRange) return [];
    return [
      {
        packageName: candidate.packageName,
        declaredRange,
        resolvedVersion: resolvePackageLockVersion(packageLock?.content, candidate.packageName),
        manifestPath: packageJson.path,
        lockfilePath: packageLock?.path,
      },
    ];
  });
}

function propertyChain(expression: ts.Expression): { root?: string; properties: string[] } {
  const properties: string[] = [];
  let current: ts.Expression = expression;
  while (ts.isPropertyAccessExpression(current)) {
    properties.unshift(current.name.text);
    current = current.expression;
  }
  return { root: ts.isIdentifier(current) ? current.text : undefined, properties };
}

function providerForLiteral(value: string): SupportedProvider | undefined {
  if (/stripe\.com|\/v1\/(payment_intents|customers|checkout)/.test(value)) return "stripe";
  if (/api\.openai\.com|\/v1\/(responses|chat\/completions)/.test(value) || /^gpt-|^o\d/.test(value)) return "openai";
  if (/api\.twilio\.com|twilio\.com\//.test(value)) return "twilio";
  return undefined;
}

function isModelLiteral(value: string) {
  return /^gpt-|^o\d|^text-|^whisper-|^dall-e/.test(value);
}

export function extractTypeScriptCodeEvidence(files: RepositoryFile[]): CodeEvidence[] {
  const evidence: CodeEvidence[] = [];

  for (const file of files.filter((candidate) => /\.(?:[cm]?[jt]sx?)$/.test(candidate.path))) {
    const sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, file.path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const bindings = new Map<string, Binding>();

    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const packageInfo = providerForPackage(node.moduleSpecifier.text);
        if (packageInfo) {
          const importClause = node.importClause;
          if (importClause?.name) bindings.set(importClause.name.text, packageInfo);
          for (const named of importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings) ? importClause.namedBindings.elements : []) {
            bindings.set(named.name.text, packageInfo);
          }
          evidence.push(createEvidence({ kind: "import", provider: packageInfo.provider, sourceFile, node, symbol: packageInfo.packageName }));
        }
      }

      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === "require") {
        const packageArgument = node.initializer.arguments[0];
        const packageInfo = packageArgument && ts.isStringLiteral(packageArgument) ? providerForPackage(packageArgument.text) : undefined;
        if (packageInfo && ts.isIdentifier(node.name)) {
          bindings.set(node.name.text, packageInfo);
          evidence.push(createEvidence({ kind: "import", provider: packageInfo.provider, sourceFile, node, symbol: packageInfo.packageName }));
        }
      }

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const initializer = node.initializer;
        const constructorName = ts.isNewExpression(initializer) && ts.isIdentifier(initializer.expression) ? initializer.expression.text : undefined;
        const factoryName = ts.isCallExpression(initializer) && ts.isIdentifier(initializer.expression) ? initializer.expression.text : undefined;
        const binding = constructorName ? bindings.get(constructorName) : factoryName ? bindings.get(factoryName) : undefined;
        if (binding) {
          bindings.set(node.name.text, binding);
          evidence.push(createEvidence({ kind: "client_construction", provider: binding.provider, sourceFile, node, symbol: node.name.text }));
        }
      }

      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const chain = propertyChain(node.expression);
        const binding = chain.root ? bindings.get(chain.root) : undefined;
        if (binding && chain.properties.length > 0) {
          const subjectCandidate = `${binding.provider}.${chain.properties.join(".")}`;
          evidence.push(createEvidence({ kind: "direct_sdk_call", provider: binding.provider, sourceFile, node, symbol: chain.root, subjectCandidate }));
        }
      }

      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const provider = providerForLiteral(node.text);
        if (provider) {
          evidence.push(
            createEvidence({
              kind: isModelLiteral(node.text) ? "model_literal" : "endpoint_literal",
              provider,
              sourceFile,
              node,
              subjectCandidate: node.text,
            })
          );
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return evidence;
}

export function extractRepositoryEvidence(input: EvidenceScanInput): RepositoryEvidence {
  if (!input.repositoryFullName || !input.commitSha || !input.defaultBranch) {
    throw new Error("Repository full name, commit SHA, and default branch are required for evidence extraction.");
  }
  return {
    repositoryFullName: input.repositoryFullName,
    commitSha: input.commitSha,
    defaultBranch: input.defaultBranch,
    dependencies: extractDependencyInventory(input.files),
    codeEvidence: extractTypeScriptCodeEvidence(input.files),
  };
}
