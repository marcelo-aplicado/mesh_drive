/** Mesh Drive agent module */
(function () {
    var child_process = require('child_process');
    function sendStatus(status, message) {
        try { if (typeof SendCommand === 'function') SendCommand({ action: 'plugin', plugin: 'meshdrive', pluginaction: 'agentStatus', status: status, message: message }); } catch (e) {}
    }
    function exec(cmd) {
        try { child_process.exec(cmd, { windowsHide: true }, function (err, stdout, stderr) { if (err) sendStatus('error', String(stderr || err.message || err)); else sendStatus('ok', String(stdout || 'OK')); }); }
        catch (e) { sendStatus('error', String(e.message || e)); }
    }
    function platform() { if (process.platform === 'win32') return 'windows'; if (process.platform === 'darwin') return 'macos'; return 'linux'; }
    function openDrive() {
        var p = platform();
        if (p === 'windows') return exec('cmd.exe /c start "" "\\\\mesh.aplicado.com.br@SSL\\drive"');
        if (p === 'macos') return exec('/usr/bin/open "davs://mesh.aplicado.com.br/drive/"');
        return exec('xdg-open "davs://mesh.aplicado.com.br/drive/" >/dev/null 2>&1');
    }
    function mapDrive() {
        var p = platform();
        if (p === 'windows') {
            var ps = "$target='\\\\mesh.aplicado.com.br@SSL\\drive';$drive=$null;foreach($l in 'M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'){$name=$l+':';if(-not (Get-PSDrive -Name $l -ErrorAction SilentlyContinue)){ $drive=$name; break }};if($drive -eq $null){ exit 22 };cmd /c net use $drive $target /persistent:yes;Start-Process explorer.exe ($drive+'\\');";
            return exec('powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ' + Buffer.from(ps, 'utf16le').toString('base64'));
        }
        if (p === 'macos') return exec('mkdir -p "$HOME/MeshDrive" && mount_webdav "https://mesh.aplicado.com.br/drive/" "$HOME/MeshDrive" ; /usr/bin/open "$HOME/MeshDrive"');
        return exec('mkdir -p "$HOME/MeshDrive" && mount -t davfs "https://mesh.aplicado.com.br/drive/" "$HOME/MeshDrive" ; xdg-open "$HOME/MeshDrive" >/dev/null 2>&1');
    }
    global.consoleaction = function (args) {
        try {
            var cmd = args; if (typeof args === 'string') cmd = JSON.parse(args);
            if (!cmd || cmd.plugin !== 'meshdrive') return;
            if (cmd.pluginaction === 'openDrive') return openDrive();
            if (cmd.pluginaction === 'mapDrive') return mapDrive();
        } catch (e) { sendStatus('error', String(e.message || e)); }
    };
})();
