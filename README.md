# Outreach

A Visual Studio Code extension to send a selection to an external process and
replace it with the output.

## Usage

First, configure up to 9 commands to be executed in a shell in the settings
(_Outreach > Commands_). You may configure the desired shell in _Outreach:
Shell Path_. If left empty, the default shell for your platform will be used.

Select a range in the editor. If there is no selection, Outreach will select
the line with the cursor. Pick a configured command from the palette (_Send
selection to external application_ n). The command will receive the selection
on the standard input and is expected to produce the result to the standard
output. Any output to the standard error will be logged.

You may configure a keyboard shortcut for each of the 9 commands.

## Settings

* `outreach.commands.externalCommand1`–`outreach.commands.externalCommand9` –
  Commands to be executed in a shell context.
* `outreach.shellPath` — An absolute path to the shell to use for executing
  the commands. Leave empty for the [default
  shell](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options).

