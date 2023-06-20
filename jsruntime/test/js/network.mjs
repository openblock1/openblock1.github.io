
/**
 * @license
 * Copyright 2022 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
import * as obvm from '../../runtime/vm.mjs'

class WebPostMessageConnector {
    constructor(source) {
        this.joined = false;
        this.source = source;
        this.listener = this.onMessage.bind(this);
    }
    setNetwork(nw) {
        this.ob_network = nw;
    }
    is_joined() {
        return this.joined;
    }
    join() {
        if (this.joined) {
            return;
        }
        window.addEventListener('message', this.listener, true);
        this.source.postMessage({ module: 'ob-network', cmd: 'join' });
        this.joined = true;
    }
    leave() {
        if (!this.joined) {
            return;
        }
        this.source.postMessage({ module: 'ob-network', cmd: 'leave' });
        window.removeEventListener('message', this.listener);
        this.joined = false;
    }
    onMessage(evt) {
        if (evt.source === this.source && evt.data.module == 'ob-network') {
            switch (evt.data.cmd) {
                case 'peer-join':
                    this.ob_network.onPeerJoin(evt.data.name);
                    break;
                case 'peer-leave':
                    this.ob_network.onPeerLeave(evt.data.name);
                    break;
                case 'message':
                    this.ob_network.onMessage(evt.data.src, evt.data.buffer);
                    break;
            }
        }
    }
    sendMessage(target, buffer) {
        if (!this.joined) {
            return;
        }
        this.source.postMessage({ module: 'ob-network', cmd: 'message', target, buffer });
    }
}

class WebSocketConnector {
    constructor(serviceUrl, projectID) {
        this.projectID = projectID;
        this.serviceUrl = serviceUrl;
        this.joined = false;
        this.connecting = false;
    }
    async newConnection(url) {
        return new WebSocket(url);
    }
    setNetwork(nw) {
        this.network = nw;
    }
    getClientId() {
        return this.clientId;
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    is_joined() {
        return this.joined;
    }
    async join() {
        if (this.joined) {
            console.log('已经加入网络');
            return;
        }
        if (this.connecting) {
            console.log('正在加入网络');
            return;
        }
        if (!this.projectID) {
            console.log('不是网络工程');
            return;
        }
        const socket = await this.newConnection(this.serviceUrl);
        const that = this;
        that.socket = socket;
        this.connecting = true;
        socket.addEventListener('error', (evt, a, b, c) => {
            that.joined = false;
            that.connecting = false;
            that.socket = null;
            console.error(evt, a, b, c);
            socket.close();
        });
        socket.addEventListener('close', (e) => {
            that.joined = false;
            that.connecting = false;
            that.socket = null;
        });
        socket.addEventListener('message', function (event) {
            let blob = event.data;
            if (blob instanceof ArrayBuffer) {
                that.onWSMessage(blob);
            } else if (blob instanceof Blob) {
                blob.arrayBuffer().then(buffer => {
                    that.onWSMessage(buffer);
                });
            }
        });
    }
    leave() {
        if (!this.joined) {
            return;
        }
        if (this.socket) {
            try {
                this.socket.close();
            } catch (e) { }
            this.socket = null;
        }
        this.connecting = false;
        this.joined = false;
    }
    /**
     * 
     * @param {ArrayBuffer} buffer 
     */
    onWSMessage(buffer) {
        if (buffer.byteLength == 0) {
            this.socket.send(buffer);
            return;
        }
        let view = new DataView(buffer);
        let cmd = view.getUint8(0);
        switch (cmd) {
            case 0:
                // 接收clientid
                let clientID = view.getUint32(1);
                console.log(clientID);
                this.socket.clientID = clientID;
                this.clientID = clientID;
                this.joined = true;
                this.connecting = false;
                // 加入网络
                let view1 = new DataView(new ArrayBuffer(5));
                view1.setUint8(0, 0);
                view1.setUint32(1, this.projectID);
                this.socket.send(view1.buffer);
                break;
            case 1:
                let remoteClientID1 = view.getUint32(1);
                this.network.onPeerJoin(remoteClientID1);
                break;
            case 2:
                let remoteClientID2 = view.getUint32(1);
                this.network.onPeerLeave(remoteClientID2);
                break;
            case 3:
                let remoteClientID3 = view.getUint32(1);
                this.onMessage(remoteClientID3, view);
                break;
        }
    }
    /**
     * 
     * @param {number} remoteClientID 
     * @param {DataView} dataView 
     */
    onMessage(remoteClientID, dataView) {
        let buffer = dataView.buffer;
        let start = dataView.byteOffset + 5;
        let content = buffer.slice(start);
        this.network.onMessage(remoteClientID, content);
    }
    /**
     * a, b TypedArray of same type
     * @param {*} a 
     * @param {*} b 
     * @returns 
     */
    concatTypedArrays(a, b) { // a, b TypedArray of same type
        var c = new (a.constructor)(a.length + b.length);
        c.set(a, 0);
        c.set(b, a.length);
        return c;
    }
    sendMessage(target, buffer) {
        if (!this.joined) {
            return;
        }
        let buf = new ArrayBuffer(5);
        let view = new DataView(buf);
        view.setUint8(0, 3);
        view.setUint32(1, target);
        let a = new Uint8Array(buf);
        let b = new Uint8Array(buffer);
        let c = this.concatTypedArrays(a, b);
        this.socket.send(c.buffer);
    }
}
class OBNetworkImpl {
    // fsms = [];
    // joined_peers = {};
    // connector;
    // obvm;
    constructor() {
        this.fsms = [];
        this.joined_peers = {};
        this.destoryCallback = this.on_fsm_destoryed.bind(this);
    }
    onPeerJoin(name) {
        this.joined_peers[name] = true;
        this.obvm.BroadcastMessage(new obvm.EventMessage('network_peer_join', 'Network_target', name, null));
    }
    setConnector(c) {
        this.connector = c;
        c.setNetwork(this);
    }
    onPeerLeave(name) {
        delete this.joined_peers[name];
        this.obvm.BroadcastMessage(new obvm.EventMessage('network_peer_leave', 'Network_target', name, null));
    }
    join(obvm) {
        if (this.connector && this.connector.is_joined()) {
            return;
        }
        this.obvm = obvm;
        // this.connector = window.parent == window ? new WebSocketConnector(this) : new WebPostMessageConnector(this);
        this.connector.join();
        console.log('join network');
    }
    is_joined() {
        return !!(this.connector && this.connector.is_joined());
    }
    leave() {
        if (this.connector && this.connector.is_joined()) {
            console.log('leave network');
            this.connector.leave();
        }
    }
    set_enable(fsm, enable) {
        if (enable) {
            this.enableFSM(fsm);
        } else {
            this.disableFSM(fsm);
        }
    }
    disableFSM(fsm) {
        let enabled = this.is_enabled(fsm);
        if (!enabled) {
            console.log('fsm not enabled');
            return;
        }
        let idx = this.fsms.indexOf(fsm);
        this.fsms.splice(idx, 1);
        fsm.OffDestroyed(this.destoryCallback);
        console.log('fsm network port off');
    }
    enableFSM(fsm) {
        let enabled = this.is_enabled(fsm);
        if (enabled) {
            console.log('already enabled');
            return;
        }
        this.fsms.push(fsm);
        fsm.OnDestroyed(this.destoryCallback);
        console.log('fsm network port on');
    }
    on_fsm_destoryed(fsm) {
        this.set_enable(fsm, false);
    }
    is_enabled(fsm) {
        let enabled = this.fsms.indexOf(fsm) > -1;
        return enabled;
    }
    // encodeIntoAtPosition(string, u8array, position) {
    //     let encoder = new TextEncoder();
    //     return encoder.encodeInto(string, position ? u8array.subarray(position | 0) : u8array);
    // }
    /**
     * 
     * @param {Number} targetFsmID 
     * @param {obvm.UserMessage} msg 
     */
    sendMessage(target, targetFsmID, msg, st, f, local) {
        if (this.connector && this.connector.is_joined()) {
            let vm = msg.sender.VM;
            let msgBuffer = vm.messageToBuffer(msg, st, f, local);
            // let json = {
            //     title, data, regType, dataType, srcFsmId, targetFsmID
            // }
            // let str = JSON.stringify(json);
            // let bufferLength = str.length * 3;
            let fullBuffer = new ArrayBuffer(msgBuffer.length + 8);
            let fullBuffer_uint8 = new Uint8Array(fullBuffer);
            fullBuffer_uint8.set(msgBuffer, 8);
            let view = new DataView(fullBuffer);
            view.setUint32(0, targetFsmID);
            view.setUint32(4, msgBuffer.length);
            // let info = this.encodeIntoAtPosition(str, new Uint8Array(msg.buffer), 4);
            // msg.setUint32(0, info.written);
            this.connector.sendMessage(target, fullBuffer);
        }
    }
    onMessage(src, content) {
        // let decoder = new TextDecoder();
        let view = new DataView(content);
        let targetFsmID = view.getUint32(0);
        let length = view.getUint32(4);
        let content1 = new Uint8Array(content, 8, length);
        let that = this;
        // let str = decoder.decode(content1);
        // let json = JSON.parse(str);
        // let title = json.title;
        // let dataType = json.dataType;
        // let srcFsmID = json.srcFsmID;
        // let targetFsmID = json.targetFsmID;
        let srcFsm;
        function fsmBuilder(id) {
            if (!srcFsm) {
                srcFsm = {
                    id,
                    data: {
                        Name: 'remote-' + src + '-' + id
                    },
                    PostMessage(msg) {
                        that.sendMessage(src, id, msg);
                    }
                };
            }
            return srcFsm;
        }
        if (targetFsmID > 0) {
            let fsm = this.obvm.getFsmByID(targetFsmID);
            if (fsm) {
                let vm = fsm.VM;
                let msg = vm.u8arrayToMessage(content1, fsmBuilder);
                fsm.PostMessage(msg);
            }
        } else {
            this.fsms.forEach(fsm => {
                let vm = fsm.VM;
                let msg = vm.u8arrayToMessage(content1, fsmBuilder);
                fsm.PostMessage(msg);
            });
        }
    }
}
function join_installer(builder, args) {
    let that = this;
    builder.PushAction((st, f, local, pos) => {
        that.impl.join(st.fsm.VM);
        return pos + 1;
    });
}
function leave_installer(builder, args) {
    let that = this;
    builder.PushAction((st, f, local, pos) => {
        that.impl.leave();
        return pos + 1;
    });
}
function set_enable_installer(builder, args) {
    let that = this;
    let argIdx = args[1] & 0xFFF;
    let arg = builder.LongRegister(argIdx);
    builder.PushAction((st, f, local, pos) => {
        let argVal = arg(st, f, local);
        that.impl.set_enable(st.fsm, argVal);
        return pos + 1;
    });
}
function is_enabled_installer(builder, args) {
    let that = this;
    let retRegIdx = args[0];
    retRegIdx = retRegIdx & 0xFFF;
    builder.LongRegister(retRegIdx, (st, f, local) => {
        return that.impl.is_enabled(st.fsm) ? 1 : 0;
    });
}
function is_joined_installer(builder, args) {
    let that = this;
    let retRegIdx = args[0];
    retRegIdx = retRegIdx & 0xFFF;
    builder.LongRegister(retRegIdx, (st, f, local) => {
        return that.impl.is_joined() ? 1 : 0;
    });
}
function send_message_install(builder, args) {
    let that = this;
    let targetIdx = args[1];
    targetIdx = targetIdx & 0xFFF;
    let targetF = builder.NObjectRegister(targetIdx);

    let titleIdx = args[2];
    titleIdx = titleIdx & 0xFFF;
    let titleF = builder.StringRegister(titleIdx);

    let dataIdx = args[3];
    let dataRegType = (dataIdx & 0xF000) >> 12;
    dataIdx = dataIdx & 0xFFF;

    let dataF;
    switch (dataRegType) {
        case 0:
            dataF = builder.LongRegister(dataIdx);
            break;
        case 1:
            dataF = builder.DoubleRegister(dataIdx);
            break;
        case 2:
            dataF = builder.StringRegister(dataIdx);
            break;
        case 3:
            dataF = builder.StructRegister(dataIdx);
            break;
        case 4:
            dataF = builder.NObjectRegister(dataIdx);
            break;
    }
    builder.PushAction((st, f, local, pos) => {
        let target = targetF(st, f, local);
        let title = titleF(st, f, local);
        let data = dataF(st, f, local);
        let dataType = obvm.Message.ArgTypeOf(dataRegType, data);
        let msg = new obvm.UserMessage(title, dataType, data, st.fsm);
        that.impl.sendMessage(target, 0, msg, st, f, local);
        return pos + 1;
    });
}
class OBNetwork {
    constructor() {
        this.impl = new OBNetworkImpl();
    }
    /**
    * 安装到脚本库
    * @param {OBScript} script 
    */
    install(script) {
        script.InstallLib("network", "network", [
            join_installer.bind(this),
            leave_installer.bind(this),
            is_joined_installer.bind(this),
            set_enable_installer.bind(this),
            is_enabled_installer.bind(this),
            send_message_install.bind(this)
        ]);
    }
    setProjectId(id) {
        this.impl.setProjectId(id);
    }
    getProjectId() {
        return this.impl.getProjectId();
    }
    setConnector(c) {
        this.impl.setConnector(c);
    }
    leave() {
        this.impl.leave();
    }
}
export { OBNetwork, WebPostMessageConnector, WebSocketConnector };