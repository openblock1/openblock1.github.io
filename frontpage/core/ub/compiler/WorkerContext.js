/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

 class WorkerContext {
    worker;
    callbackSN = 0;
    callbacks = {};
    constructor(path) {
        let worker = new Worker(path);
        worker.onmessage = this.onmessage.bind(this);
        this.worker = worker;
    }
    postMessage(data, cb) {
        let msg = { request: data };
        if (cb) {
            let callbackSN = this.callbackSN++;
            this.callbacks[callbackSN] = cb;
            msg.callbackSN = callbackSN;
        }
        this.worker.postMessage(msg);
    };
    terminate() {
        this.worker.terminate();
    }
    onmessage(m) {
        let data = m.data.data, callbackSN = m.data.callbackSN, error = m.data.error;
        let cb = this.callbacks[callbackSN];
        if (cb) {
            delete this.callbacks[callbackSN];
            setTimeout(() => {
                cb(error, data, this);
            }, 1);
        }
    };
}