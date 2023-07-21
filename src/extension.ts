import * as vscode from 'vscode';
import * as child_process from 'child_process';

const SHELL = '/bin/bash';
const COMMAND = '/bin/sort';

const channel = vscode.window.createOutputChannel('Outreach');

const log = (...args: any[]) => {  
  args.forEach(arg => channel.appendLine(arg));    
};

const replaceSelectionWithExternalOutput = async (editor: vscode.TextEditor) => {
  const document = editor.document;
  const selection = editor.selection;
  const text = document.getText(selection);

  const [result, err] = await pipeToProcess(text);

  editor.edit(editBuilder => {
    editBuilder.replace(selection, result);
  });

  if (err) {
    log(`Running \`${COMMAND}\` produced output to the standard error stream:`, err.trim());
    channel.show();
  }
};

const pipeToProcess = (text: String) => new Promise<string[]>((resolve, reject) => {
  const proc = child_process.spawn(COMMAND, {
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
  let disposable = vscode.commands.registerCommand('outreach.sendToExternal', async () => {
    const editor = vscode.window.activeTextEditor;
    
    if (editor) {
      replaceSelectionWithExternalOutput(editor);
    }
  });
  
  context.subscriptions.push(disposable);
}

export function deactivate() {};
