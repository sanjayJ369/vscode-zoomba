import { exec } from "child_process";
import { readFile } from "fs";
import { readdir } from "fs/promises";
import { dirname } from "path";
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

export function runCoverage(context: vscode.ExtensionContext) {
  // get current editor
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No Active Editor!");
    return;
  }

  // get name of the file
  let file = editor.document.fileName;
  let fileDir = dirname(file);
  // run the file though zmc
  const userShell = process.env.SHELL || "/bin/zsh";

  // Run an interactive shell so that the alias is loaded
  exec(
    `${userShell} -i -c "zmc ${file}"`,
    { cwd: fileDir },
    async (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
        return;
      }
      let files = await readdir(dirname(file));

      let regex = /.*coverage\.txt$/;
      files = files.filter((file) => regex.test(file));
      // get the latest file
      let coverage_file = files.reduce((prev, curr) => {
        let getFileDate = function (name: string): number {
          return Number(name.slice(0, name.length - 13).replace("_", ""));
        };
        return getFileDate(curr) > getFileDate(prev) ? curr : prev;
      });
      readFile(fileDir + "/" + coverage_file, (err, data) => {
        if (err) {
          vscode.window.showErrorMessage(err.message);
        }
        console.log("hello");
        parseJSON(data.toString());
      });
    }
  );
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
