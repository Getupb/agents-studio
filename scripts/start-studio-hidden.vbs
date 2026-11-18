' Start Agents Studio without a console window.
' The server runs in the background; stop it with scripts\stop-studio.cmd.
' Logs go to studio.log in the project root and are overwritten each start.

Option Explicit

Dim sh, fso, scriptDir, root, logFile, cmd, rc

Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
root = fso.GetParentFolderName(scriptDir)
logFile = root & "\studio.log"

' If port 3099 is already listening, do not start a second instance.
rc = sh.Run("cmd /c netstat -ano | findstr "":3099 "" | findstr LISTENING >nul 2>&1", 0, True)
If rc = 0 Then WScript.Quit 0

' Tell start-studio.cmd to skip its final pause.
sh.Environment("PROCESS")("DSH_PET_HIDDEN") = "1"

cmd = "cmd /c cd /d """ & root & """ && call scripts\start-studio.cmd --no-open > """ & logFile & """ 2>&1"
sh.Run cmd, 0, False