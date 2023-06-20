
/**
 * @license
 * Copyright 2022 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
class OB_Network {
    idGen = 0;
    simulatorWindows = [];
    join(target) {
        if (this.simulatorWindows.indexOf(target) < 0) {
            let id = this.idGen++;
            let name = 'network-peer-' + id
            target.id = id;
            target.ob_network_peer_name = name;
            let tmsg = { module: 'ob-network', cmd: 'peer-join', name };
            this.simulatorWindows.forEach((t) => {
                t.postMessage(tmsg, '*');
                target.postMessage({ module: 'ob-network', cmd: 'peer-join', name: t.ob_network_peer_name }, '*');
            });
            this.simulatorWindows.push(target);
        }
    }
    leave(target) {
        let idx = this.simulatorWindows.indexOf(target);
        if (idx >= 0) {
            this.simulatorWindows.splice(idx, 1);
            this.simulatorWindows.forEach((t) => {
                t.postMessage({ module: 'ob-network', cmd: 'peer-leave', name: target.ob_network_peer_name }, '*');
            });
        }
    }
    send(src, target, buffer) {
        let t = this.simulatorWindows.find(t => t.ob_network_peer_name == target);
        if (t) {
            t.postMessage({ module: 'ob-network', cmd: 'message', src, buffer }, '*');
        }
    }
    checkLeft() {
        let length = this.simulatorWindows.length;
        for (let i = length - 1; i >= 0; i--) {
            let sw = this.simulatorWindows[i];
            if (sw.closed) {
                this.leave(sw);
            }
        }
    }
}
let ob_network = new OB_Network();
// for network
setInterval(() => {
    ob_network.checkLeft();
}, 3000);
window.addEventListener('message', (ev) => {
    if (ev.data.module == 'ob-network') {
        switch (ev.data.cmd) {
            case 'join':
                ob_network.join(ev.source);
                break;
            case 'leave':
                ob_network.leave(ev.source);
                break;
            case 'message':
                ob_network.send(ev.source.ob_network_peer_name, ev.data.target, ev.data.buffer);
                break;
        }
    }
});