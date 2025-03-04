import { rejects } from "assert";
import { exec } from "child_process";
import { readFile } from "fs";
import { readdir } from "fs/promises";
import { dirname, posix, resolve } from "path";
import * as vscode from "vscode";

interface LinesCoverage {
  [lineNumber: number]: boolean;
}

interface BlocksCoverage {
  [blockRange: string]: boolean;
}

interface MethodsCoverage {
  [methodRange: string]: boolean;
}

interface CoverageData {
  lines: { [key: string]: LinesCoverage };
  blocks: { [key: string]: BlocksCoverage };
  methods: { [key: string]: MethodsCoverage };
}

export async function runCoverage(context: vscode.ExtensionContext) {
  // get current editor
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No Active Editor!");
    return;
  }

  // get name of the file
  let file = editor.document.fileName;
  let fileDir = dirname(file);
  let coverage: Map<string, number[]>;
  let coverageFile: string;
  // run the file though zmc
  const userShell = process.env.SHELL || "/bin/zsh";

  async function getCoverageFile(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Run an interactive shell so that the alias is loaded
      exec(
        `${userShell} -i -c "zmc ${file}"`,
        { cwd: fileDir },
        async (error, stdout, stderr) => {
          if (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
            reject(error);
          }

          // get all coverage files
          let files = await readdir(dirname(file));
          let regex = /.*coverage\.txt$/;
          files = files.filter((file) => regex.test(file));

          // get the latest file
          coverageFile = files.reduce((prev, curr) => {
            let getFileDate = function (name: string): number {
              return Number(
                name.slice(0, name.length - 13).replaceAll("_", "")
              );
            };
            return getFileDate(curr) > getFileDate(prev) ? curr : prev;
          });
          resolve(coverageFile);
        }
      );
    });
  }

  try {
    // read coverage file
    coverageFile = await getCoverageFile();
    readFile(fileDir + "/" + coverageFile, (err, data) => {
      if (err) {
        vscode.window.showErrorMessage(err.message);
      }
      // parse coverage file
      coverage = parseJSON(data.toString());
      applyCoverage(coverage);
    });
  } catch (error) {
    vscode.window.showErrorMessage((error as Error).message);
    return;
  }
}

function parseJSON(data: any): Map<string, number[]> {
  let coverage: CoverageData = JSON.parse(data);
  let filesMap: Map<string, number[]> = new Map();
  let files = Object.keys(coverage.lines);
  files.forEach((file: string) => {
    // for each file
    // get the lines of the file that are covered
    let lines = coverage.lines[file];
    let coveredLines: number[] = [];
    Object.keys(lines).forEach((line) => {
      if (lines[Number(line)] === true) {
        coveredLines.push(Number(line));
      }
    });

    filesMap.set(file, coveredLines);
  });
  console.log(filesMap);
  return filesMap;
}

function applyCoverage(coverage: Map<string, number[]>) {
  // create decoration type to add green overlay on covered liens
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgb(0, 255, 0, 0.1)",
    isWholeLine: true,
  });

  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No Active Editor!");
    return;
  }

  let fileName: string = editor.document.fileName;
  console.log(Object.keys(coverage));
  let coveredLines = coverage.get(fileName);

  // create ranges to apply decoration to the covered liens
  const decorations: vscode.DecorationOptions[] =
    coveredLines?.map((line) => {
      let range = new vscode.Range(
        new vscode.Position(line - 1, 0),
        new vscode.Position(line - 1, Number.MAX_VALUE)
      );
      return { range } as vscode.DecorationOptions;
    }) || [];

  editor.setDecorations(decorationType, decorations);
  console.log("decoratiosn applied");
}
