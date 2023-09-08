import * as vscode from 'vscode';
import * as child_process from 'child_process';

const SHELL = '/bin/bash';

const channel = vscode.window.createOutputChannel('Outreach');

const log = (...args: any[]) => {  
  args.forEach(arg => channel.appendLine(arg));    
};

const error = (...args: any[]) => {  
  log(...args);
  channel.show();
};

const getConfigValue = (key: string) => {
  const config = vscode.workspace.getConfiguration('outreach');
  return config.get<string>(key);
}

const isSelectionPresent = (editor: vscode.TextEditor) => {
  const selection = editor.selection;
  return selection && !selection.start.isEqual(selection.end);
};

const selectLineWithCursor = (editor: vscode.TextEditor) => {
  const line = editor.selection.active.line;
  
  if (line != null) {
    const lineStart = new vscode.Position(line, 0);
    const lineEnd = editor.document.lineAt(line).range.end;
    
    editor.selection = new vscode.Selection(lineStart, lineEnd);
  } else {
    throw new Error('Cannot select the line with the cursor');
  }
};

const clearSelection = (editor: vscode.TextEditor) => {
  editor.selection = new vscode.Selection(editor.selection.end, editor.selection.end);
};

const runCommand = async (commandIdx: number) => {
  const editor = vscode.window.activeTextEditor;
  const command = getConfigValue(`commands.externalCommand${commandIdx}`);

  if (editor && command) {    
    try {
      if (!isSelectionPresent(editor)) {
        selectLineWithCursor(editor);
      }
      
      await replaceSelectionWithExternalOutput(editor, command);
      
      clearSelection(editor);
    } catch (e: any) {
      error(`Failed to execute \`${command}\`: ${e?.message || e}`);
    }
  }
};

const replaceSelectionWithExternalOutput = async (editor: vscode.TextEditor, command: string) => {
  const document = editor.document;
  const selection = editor.selection;
  const text = document.getText(selection);

  const [result, err] = await pipeToProcess(text, command);

  editor.edit(editBuilder => {
    editBuilder.replace(selection, result);
  });

  if (err) {
    error(`Running \`${command}\` produced output to the standard error stream:`, err.trim());
  }
};

const pipeToProcess = (text: string, command: string) => new Promise<string[]>((resolve, reject) => {
  const proc = child_process.spawn(command, {
    shell: SHELL,
  });

  let result = '';
  let err = '';
  
  proc.stdout.on('data', data => {
    result += data;
  });
  
  proc.stderr.on('data', data => {
    err += data;
  });        
  
  proc.on('error', reject);
  
  proc.on('exit', code => {
    if (code === 0) {
      resolve([result, err]);
    } else {
      reject(new Error(`Process exited with code ${code}`));
    }
  });

  proc.stdin.write(text);
  proc.stdin.end();
});

export function activate(context: vscode.ExtensionContext) {
  for (let i = 1; i <= 9; i++) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`outreach.sendToExternal${i}`, runCommand.bind(null, i))
    );
  }
}

export function deactivate() {};
