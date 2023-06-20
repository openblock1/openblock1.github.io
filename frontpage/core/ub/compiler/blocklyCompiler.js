/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

 (function () {
    console.log('compiler loading..');
    importScripts("parsers/blocklyxmlparser.js",'compiler.js');
    var parser = blocklyxmlparser;
    function p(e, m) {
        if (e.data.msgSN) {
            m.msgSN = e.data.msgSN;
            self.postMessage(m);
        }
    }
    onmessage = function (e) {
        try {
            switch (e.data.cmd) {
                case 'updateState':
                    let arrayBuffer = compiler.complieBytecodeJsonObj(e.data.workspace, e.data.nativeCalls, true);
                    p(e, {
                        result: arrayBuffer
                    });
                    return;
                case 'compileLib':
                    parser.parse(e.data.src);
                    // let obj = compiler.compileLib(e.data.src, !!e.data.debug);
                    // let str = JSON.stringify(obj);
                    // p(e, {
                    //     result: str
                    // });
                    return;
                default:
                    throw new Error('not support cmd:' + e.data.cmd);
            }
        } catch (err) {
            console.log(err);
            p(e, {
                error: err
            });
        }
    }
    console.log('compiler loading finished.');
})();