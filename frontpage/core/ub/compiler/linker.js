/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

class Linker {
    static worker;
    linked;
    onFinisheds = [];
    link(compiledLibs, data, nativeFuncMap, cb) {
        this.stop();
        Linker.worker = new WorkerContext(OpenBlock.safePath + 'compiler/linkerWorker.js');
        let data1 = { compiled: data.compiled };
        data1.structAST = JSON.parse(JSON.stringify(data.structAST));
        Linker.worker.postMessage({ compiledLibs, data: data1, nativeFuncMap }, (e, r) => {
            if (!e) {
                OpenBlock.Linker.linked = r;
            }
            if (cb) {
                cb(e, r);
            }
            for (let i = 0; i < this.onFinisheds.length; i++) {
                let f = this.onFinisheds[i];
                try {
                    f(e, r);
                } catch (e) {
                    console.error(e);
                }
            }
            // Linker.worker.terminate();
        });
    }
    onFinished(f) {
        this.onFinisheds.push(f);
    }
    stop() {
        if (Linker.worker) {
            Linker.worker.terminate();
        }
    }
}
OpenBlock.Linker = new Linker();