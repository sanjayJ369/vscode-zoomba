import path from "path";

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizePath(filePath: string) {
  let normalized = path.normalize(filePath);

  if (process.platform === "win32" && normalized.match(/^[a-zA-Z]:/)) {
    return normalized.charAt(0).toLowerCase() + normalized.slice(1);
  }
  return normalized;
}
