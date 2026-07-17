/** Mesh Drive agent module - MeshCentral 1.2.1 compatible */
"use strict";

var meshdrive_mesh = null;

function meshdrive_sendStatus(status, message) {
    try {
        if (meshdrive_mesh && typeof meshdrive_mesh.SendCommand === 'function') {
            meshdrive_mesh.SendCommand({ action: 'plugin', plugin: 'meshdrive', pluginaction: 'agentStatus', status: status, message: message, tag: 'console' });
        } else if (typeof SendCommand === 'function') {
            SendCommand({ action: 'plugin', plugin: 'meshdrive', pluginaction: 'agentStatus', status: status, message: message, tag: 'console' });
        }
    } catch (e) { }
}

function meshdrive_runShell(commandText) {
    try {
        var child;
        if (process.platform === 'win32') {
            child = require('child_process').execFile(process.env['windir'] + '\\system32\\cmd.exe');
            child.stdin.write(commandText + '\r\n');
            child.stdin.write('exit\r\n');
        } else {
            child = require('child_process').execFile('/bin/sh', ['sh']);
            child.stdin.write(commandText + '\n');
            child.stdin.write('exit\n');
        }
        child.stdout.str = '';
        child.stderr.str = '';
        child.stdout.on('data', function (data) { this.str += data.toString(); });
        child.stderr.on('data', function (data) { this.str += data.toString(); });
        child.on('exit', function (code) {
            var out = '';
            try { out = (this.stdout.str || '') + (this.stderr.str || ''); } catch (e) { out = ''; }
            if (code && code !== 0) { meshdrive_sendStatus('error', 'exit=' + code + ' ' + out); }
            else { meshdrive_sendStatus('ok', out || 'OK'); }
        });
    } catch (e) {
        meshdrive_sendStatus('error', String(e && e.message ? e.message : e));
    }
}

function meshdrive_platform() {
    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'macos';
    return 'linux';
}

function meshdrive_openDrive() {
    var p = meshdrive_platform();
    if (p === 'windows') {
        return meshdrive_runShell('start "" "\\\\mesh.aplicado.com.br@SSL\\drive"');
    }
    if (p === 'macos') {
        return meshdrive_runShell('/usr/bin/open "davs://mesh.aplicado.com.br/drive/"');
    }
    return meshdrive_runShell('xdg-open "davs://mesh.aplicado.com.br/drive/" >/dev/null 2>&1');
}

function meshdrive_mapDrive() {
    var p = meshdrive_platform();
    if (p === 'windows') {
        var ps = "$target='\\\\mesh.aplicado.com.br@SSL\\drive';" +
            "$drive=$null;" +
            "foreach($l in 'M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'){" +
            "$name=$l+':';" +
            "if(-not (Get-PSDrive -Name $l -ErrorAction SilentlyContinue)){ $drive=$name; break }" +
            "};" +
            "if($drive -eq $null){ exit 22 };" +
            "cmd /c net use $drive $target /persistent:yes;" +
            "Start-Process explorer.exe ($drive+'\\');";
        var encoded = Buffer.from(ps, 'utf16le').toString('base64');
        return meshdrive_runShell('powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ' + encoded);
    }
    if (p === 'macos') {
        return meshdrive_runShell('mkdir -p "$HOME/MeshDrive" && mount_webdav "https://mesh.aplicado.com.br/drive/" "$HOME/MeshDrive" ; /usr/bin/open "$HOME/MeshDrive"');
    }
    return meshdrive_runShell('mkdir -p "$HOME/MeshDrive" && mount -t davfs "https://mesh.aplicado.com.br/drive/" "$HOME/MeshDrive" ; xdg-open "$HOME/MeshDrive" >/dev/null 2>&1');
}

function consoleaction(args, rights, sessionid, parent) {
    try {
        meshdrive_mesh = parent;
        if (typeof args['_'] === 'undefined') {
            args['_'] = [];
            args['_'][1] = args.pluginaction;
        }
        var fnname = args['_'][1] || args.pluginaction;
        switch (fnname) {
            case 'openDrive':
                meshdrive_openDrive();
                return 'Mesh Drive open command sent.';
            case 'mapDrive':
                meshdrive_mapDrive();
                return 'Mesh Drive map command sent.';
            default:
                return 'Unknown Mesh Drive action: ' + fnname;
        }
    } catch (e) {
        meshdrive_sendStatus('error', String(e && e.message ? e.message : e));
        return 'Mesh Drive error: ' + String(e && e.message ? e.message : e);
    }
}

module.exports = { consoleaction : consoleaction };
