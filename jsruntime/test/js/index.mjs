/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

import * as obvm from '../../runtime/vm.mjs'
import * as obdebugger from '../../runtime/debugger.mjs'
import * as obcanvaslib from './canvas.mjs'
import * as obaudiolib from './audio.mjs'
import * as oblib_network from './network.mjs'
import * as oblib_sys from './sys.mjs'
import * as oblib_file from './file.mjs'
import * as util from '../../runtime/util.mjs'
import { PostMessageConnector } from '../../runtime/PostMessageConnector.mjs'
let imgsuffixs = ['.png', '.jpg', '.jpeg'];
let soundsuffixs = ['.wav', '.mp3'];

let logDiv = null;//document.getElementById('logDiv');
let logs = [];
/**
 * @type {HTMLCanvasElement}
 */
let stage = document.getElementById("stage");
let grid, lastGrid;
function updateStageSize() {
    let styled = window.getComputedStyle(stage);
    stage.height = parseInt(styled.height) / parseInt(styled.width) * 750;
    stage.width = 750;//parseInt(styled.width);
}
updateStageSize();
let obcanvas = new obcanvaslib.OBCanvas2D(stage);
let obaudio = new obaudiolib.OBAudio();
let ob_network = new oblib_network.OBNetwork();
let ob_file = new oblib_file.OSFile();
let ob_sys = new oblib_sys.Sys({ prompt: AsyncPrompt.prompt });
let nativeLibs = [
    obcanvas.install.bind(obcanvas),
    obaudio.install.bind(obaudio),
    ob_network.install.bind(ob_network),
    ob_sys.install.bind(ob_sys),
    ob_file.install.bind(ob_file)
];

var scriptArrayBuffer;
// var phaserSceneJSONStr;
let loadedScript, assets;
let vm;
let fsm;
let startTimestamp;
let lastAnimationFrameTimestamp;
let usrLogLevel = 5;
let sysLogLevel = 5;
let vmdebugger = null;
if (window.parent !== window) {
    let vmdebuggerConnector = new PostMessageConnector();
    vmdebugger = new obdebugger.Debugger({
        broker: vmdebuggerConnector
    });
}
function syncDebuggerSetting() {
    if (vm) {
        vm.logLevel = usrLogLevel;
    }
    if (vmdebugger) {
        vmdebugger.logLevel = sysLogLevel;
    }
}
/**
 * 检测长时间运行
 */
let frameStart;
function v2(e) {
    let t = e.currentTarget;
    let height = t.height;
    let width = t.width;
    let x = e.clientX;
    let y = e.clientY;
    let swidth = t.getBoundingClientRect().width;
    let sheight = t.getBoundingClientRect().height;
    let sx = x / swidth * width;
    let sy = y / sheight * height;
    sx = Math.floor(sx);
    sy = Math.floor(sy);
    return new obcanvaslib.Vector2(sx, sy);
}

function postErrorMessage(e) {
    // if (window.parent) {
    //     if (e.message === 'func_timeout') {
    //         window.parent.postMessage({
    //             cmd: 'msg',
    //             arg: {
    //                 type: 'error',
    //                 content: 'func_timeout'
    //             }
    //         }, '*');
    //     } else if (e.info) {
    //         window.parent.postMessage({
    //             cmd: 'msg',
    //             arg: {
    //                 type: 'error',
    //                 format: true,
    //                 info: e.info
    //             }
    //         }, '*');
    //     }
    // } else {
    //     throw e;
    // }
    throw e;
}
function ob_event(name, argType, arg) {
    if (vm && vm.isRunning()) {
        vm.BroadcastMessage(new obvm.EventMessage(name, argType, arg, null));
        updateVM();
    }
}
stage.addEventListener('touchstart', (e) => {
    ob_event('touchstart', 'Vector2', v2(e));
}, false);
stage.addEventListener('mousedown', (e) => {
    ob_event('touchstart', 'Vector2', v2(e));
}, false);
stage.addEventListener('touchmove', (e) => { ob_event('touchmove', 'Vector2', v2(e)) }, false);
stage.addEventListener('touchcancel', (e) => { ob_event('touchcancel', 'Vector2', v2(e)) }, false);
stage.addEventListener('touchend', (e) => { ob_event('touchend', 'Vector2', v2(e)) }, false);
stage.addEventListener('mouseup', (e) => { ob_event('touchend', 'Vector2', v2(e)) }, false);
stage.addEventListener('mousemove', (e) => {
    let v = v2(e);
    ob_event('mousemove', 'Vector2', v);
    if (window.parent) {
        window.parent.postMessage({
            cmd: 'mousemove',
            arg: v
        }, '*');
    }
}, false);
stage.addEventListener('click', (e) => { ob_event('click', 'Vector2', v2(e)) }, false);
stage.addEventListener('longpress', (e) => { ob_event('longpress', 'Vector2', v2(e)) }, false);
stage.addEventListener('swipe', () => { ob_event('swipe') }, false);
document.addEventListener('keydown', (e) => {
    ob_event('keydown', 'String', e.key)
}, false);
document.addEventListener('keyup', (e) => {
    ob_event('keyup', 'String', e.key)
}, false);
function restart(_fsm) {
    if (vm) {
        vm = null;
    }
    obaudiolib.OBAudio.reset();
    obcanvas.canvas2dctx.restore();
    ob_network.leave();
    if (loadedScript) {
        obcanvas.canvas2dctx.clearRect(0, 0, obcanvas.canvas.width, obcanvas.canvas.height);
        obcanvas.canvas2dctx.save();
        vm = new obvm.VM(loadedScript, {
            setTimeout: setTimeout.bind(window), Output: debugLog,
            assets: assets || {},
            debugger: vmdebugger
        });
        syncDebuggerSetting();
        // vm.Output = alert.bind(window);
        let fsmname = _fsm || document.getElementById("input_start_fsm").value;
        fsm = vm.CreateFSM(fsmname);
        if (!fsm) {
            debugLog("No FSM named " + fsmname);
        } else {
            window.parent.postMessage({
                cmd: 'msg',
                arg: null
            }, '*');
        }
        updateVM();
    }
}
const inputElement = document.getElementById("input_script");
if (inputElement) {
    inputElement.addEventListener("change", () => {
        const fileList = inputElement.files;
        if (fileList.length == 0) {
            return;
        }
        let reader = new FileReader();
        reader.onload = (evt) => {
            stage.width = stage.width;
            scriptArrayBuffer = reader.result;
            loadedScript = obvm.ScriptLoader.loadScript(scriptArrayBuffer, nativeLibs);
        };
        reader.readAsArrayBuffer(fileList[0]);
    }, false);
}
const runButton = document.getElementById('button_run');
if (runButton) {
    runButton.onclick = () => { restart() };
}
let AnimationFrameEvt = new obvm.EventMessage("animationframe", null, null, null);
function updateVM(updateFrame) {
    if (vm && vm.isRunning()) {
        frameStart = performance.now();
        try {
            if (vm.update()) {
                if (updateFrame && fsm) {
                    fsm.PostMessage(AnimationFrameEvt);
                }
            }
        } catch (e) {
            console.error(e);
            postErrorMessage(e);
        }
        if (lastAnimationFrameTimestamp && frameStart - lastAnimationFrameTimestamp > 500) {
            lastAnimationFrameTimestamp = frameStart;
            updateAnimation();
        }
    }
}
setInterval(updateVM, 100);
function updateAnimation() {
    if (grid != lastGrid) {
        lastGrid = grid;
        obcanvas.canvas2dctx.clearRect(0, 0, obcanvas.canvas.width, obcanvas.canvas.height);
    }
    updateVM(true);
    if (lastGrid) {
        /**
         * @type {CanvasRenderingContext2D}
         */
        let c2dctx = obcanvas.canvas2dctx;
        c2dctx.save();
        let gridX = lastGrid.x;
        let gridY = lastGrid.y;
        let width = obcanvas.canvas.width;
        let height = obcanvas.canvas.height;
        c2dctx.setLineDash([15, 15]);
        c2dctx.lineWidth = 2;
        if (gridX > 0) {
            for (let x = gridX; x < width; x += gridX) {
                c2dctx.fillStyle = 'black'
                c2dctx.lineDashOffset = 0;
                c2dctx.beginPath();
                c2dctx.moveTo(x, 0);
                c2dctx.lineTo(x, height);
                c2dctx.stroke();
                c2dctx.closePath();
                c2dctx.beginPath();
                c2dctx.fillStyle = 'white'
                c2dctx.lineDashOffset = 5;
                c2dctx.moveTo(x, 0);
                c2dctx.lineTo(x, height);
                c2dctx.closePath();
            }
        }
        if (gridY > 0) {
            for (let y = gridY; y < height; y += gridY) {
                c2dctx.fillRect(0, y, width, 1);
                c2dctx.fillStyle = 'black'
                c2dctx.lineDashOffset = 0;
                c2dctx.beginPath();
                c2dctx.moveTo(0, y);
                c2dctx.lineTo(width, y);
                c2dctx.stroke();
                c2dctx.closePath();
                c2dctx.beginPath();
                c2dctx.fillStyle = 'white'
                c2dctx.lineDashOffset = 5;
                c2dctx.moveTo(0, y);
                c2dctx.lineTo(width, y);
                c2dctx.closePath();
            }
        }
        c2dctx.restore();
    }
}
function step(timestamp) {
    if (!startTimestamp) {
        startTimestamp = timestamp;
    }
    lastAnimationFrameTimestamp = timestamp;
    updateAnimation();
    window.requestAnimationFrame(step);
}
window.requestAnimationFrame(step);
function debugLog(m, type, level, stackpath, block) {
    console.log(m);
    if (window.parent) {
        window.parent.postMessage({
            cmd: 'log',
            arg: {
                msg: String(m),
                stackpath, type, level, block
            }
        }, '*');
    }
    if (logDiv) {
        if (typeof (m) === 'object') {
            m = JSON.stringify(m);
        }
        logs.unshift(String(m));
        if (logs.length > 250) {
            logs.length = 250;
        }
        logDiv.innerText = logs.join('\n');
    }
}
window.runProject = function (projData) {
    obaudiolib.OBAudio.reset();
    stage.width = stage.width;
    scriptArrayBuffer = projData.bytes;
    loadedScript = obvm.ScriptLoader.loadScript(scriptArrayBuffer, nativeLibs, {
        debugger: new obdebugger.Debugger(),
        instructionWrap(instruction) {
            let pausable = obdebugger.Debugger.pausableInstructionWrap(instruction);
            return function (st) {
                if (performance.now() - frameStart > 15000) {
                    st.fsm.VM.pause();
                    throw new obvm.VMPausedException('func_timeout');
                }
                return pausable.apply(null, arguments)
            };
        }
    });
    assets = {};
    let _assets = projData.assets;
    let finished = 0;
    let wait = 0;
    for (let name in _assets) {
        let found = false;
        let lname = name.toLowerCase();
        for (let suffixs in imgsuffixs) {
            if (lname.endsWith(imgsuffixs[suffixs])) {
                wait++;
                let img = new Image();
                let src = _assets[name];
                if (src instanceof ArrayBuffer) {
                    let base64 = util.arrayBufferToBase64(_assets[name]);
                    let fileType = util.fileType(name).substring(1);
                    img.src = 'data:image/' + fileType + ';base64,' + base64;
                } else {
                    img.src = _assets[name];
                }
                img.onload = () => {
                    finished++;
                    if (finished == wait) {
                        restart(projData.fsm);
                    }
                };
                img.onerror = () => {
                    finished++;
                    if (finished == wait) {
                        restart(projData.fsm);
                    }
                };
                assets[name] = img;
                break;
            }
        }
        if (!found) {
            for (let suffixs in soundsuffixs) {
                let audioCtx = obaudiolib.OBAudio.mainAudioCtx;
                if (lname.endsWith(soundsuffixs[suffixs])) {
                    wait++;
                    audioCtx.decodeAudioData(_assets[name], (buffer) => {
                        assets[name] = buffer;
                        finished++;
                        if (finished == wait) {
                            restart(projData.fsm);
                        }
                    }, (e) => {
                        console.error("Error with decoding audio data" + e.err + ":" + name);
                        finished++;
                        if (finished == wait) {
                            restart(projData.fsm);
                        }
                    });
                    found = true;
                    break;
                }
            }
        }
    }

    if (finished == wait) {
        restart(projData.fsm);
    }
}
if (window.parent) {
    let messageHandler = {
        runProject(evt) {
            ob_network.setConnector(new oblib_network.WebPostMessageConnector(evt.source));
            runProject(evt.data);
        },
        restart(evt) {
            restart(evt.data.fsm);
        },
        showLog(evt) {
            logDiv.style.display = evt.data.value ? 'block' : 'none';
        },
        clearLog() {
            logs.length = 0;
            if (logDiv) {
                logDiv.innerText = "";
            }
        },
        pause() {
            vm.pause();
        },
        resume() {
            vm.resume();
        },
        drawGrid(evt) {
            let arg = evt.data.arg;
            grid = arg;
        },
        setLogFilter(evt) {
            let arg = evt.data.arg;
            usrLogLevel = arg.usrLogLevel;
            sysLogLevel = arg.sysLogLevel;
            syncDebuggerSetting();
        }
    };
    window.addEventListener("message", receiveMessage);

    function receiveMessage(event) {
        let cmd = event.data.cmd;
        if (messageHandler[cmd]) {
            messageHandler[cmd](event);
        }
    }

    (function () {
        var throttle = function (type, name, obj) {
            obj = obj || window;
            var running = false;
            var func = function () {
                if (running) { return; }
                running = true;
                setTimeout(function () {
                    obj.dispatchEvent(new CustomEvent(name));
                    running = false;
                }, 5);
            };
            obj.addEventListener(type, func);
        };

        /* init - you can init any event */
        throttle("resize", "optimizedResize");
    })();

    // handle event
    window.addEventListener("optimizedResize", function () {
        updateStageSize();
        // obcanvas.canvas2dctx.save();
        // restart();
        ob_event('windowResize', 'null');
    });

}
try {
    // let ext = await import('./jsruntime.ext.mjs');
    // if (ext && ext.default && ext.default.install) {
    //     nativeLibs.push(ext.default.install);
    // }
    if (window.JSRExt) {
        nativeLibs.push(window.JSRExt.install);
    }
} catch (e) {
    console.info(e);
}

if (location.search) {
    const BASE_URL = '/projects/files/';
    const LIST_FILE = 'exe/list.txt';
    const PROJECT_CONFIG_FILE = 'config/project.json';
    const MAIN_XE = 'exe/main.xe';

    let pidx = location.search.indexOf('p=');
    let p;
    if (pidx > 0) {
        let pend = location.search.indexOf('&', pidx);
        if (pend >= 0) {
            p = location.search.substring(pidx + 2, pend);
        } else {
            p = location.search.substring(pidx + 2);
        }
    }
    if (p) {
        const PROJ_URL = BASE_URL + p + '/';
        const LIST_FILE_URL = PROJ_URL + LIST_FILE;
        let mainXE;
        let serviceUrl = location.host + '/service/network';
        if (location.protocol === 'https:') {
            serviceUrl = 'wss://' + serviceUrl;
        } else {
            serviceUrl = 'ws://' + serviceUrl;
        }
        ob_network.setConnector(new oblib_network.WebSocketConnector(serviceUrl, p));
        assets = {};
        axios(LIST_FILE_URL).then(({ data }) => {
            console.log(data);
            let list = data.split('\n');
            let prom = [];
            list.forEach(file => {
                let reqConf = {
                    responseType: 'arraybuffer'
                }
                let lfile = file.toLowerCase();
                if (lfile.endsWith('.json') || lfile.endsWith('.txt')) {
                    reqConf.responseType = 'json'
                }
                for (let k in imgsuffixs) {
                    let fix = imgsuffixs[k];
                    if (lfile.endsWith(fix)) {
                        let fname = file.substring(file.indexOf('/') + 1);
                        assets[fname] = PROJ_URL + file;
                        return;
                    }
                }
                let res = axios(PROJ_URL + file, reqConf).then(({ data }) => {
                    switch (file) {
                        case PROJECT_CONFIG_FILE:
                            if (data.name) {
                                document.title = data.name;
                            }
                            break;
                        case MAIN_XE:
                            mainXE = data;
                            break;
                        default:
                            let fname = file.substring(file.indexOf('/') + 1);
                            assets[fname] = data;
                            break;
                    }
                });
                prom.push(res);
            });
            Promise.all(prom).then(() => {
                runProject({
                    bytes: mainXE,
                    assets
                });
            });
        });
    }
}