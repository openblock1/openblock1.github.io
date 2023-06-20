/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
    const ROOT_URL = "../jsruntime/test/";
    const PAGE_URL = "index.html";
    let windows = [];
    let window_sn = 0;
    let jspreviewer;
    let browser_run_window;

    function setLogFilter(win) {
        let arg = { usrLogLevel: win.usrLogLevel, sysLogLevel: win.sysLogLevel };
        let drawGrid = {
            "cmd": "setLogFilter",
            "arg": arg
        };
        win.iframe.contentWindow.postMessage(drawGrid);
        console.log(arg);
    }
    function standaloneWindow() {
        if ((!browser_run_window) || browser_run_window.closed) {
            browser_run_window = window.open(ROOT_URL + PAGE_URL, 'ob_run_window',"width=375,height=540,resizable,scrollbars=no,status=no,alwaysRaised=on,top=100,left=100");
        }

        OpenBlock.exportExePackage((err, result) => {
            if (!err) {
                let assets = {};
                let arr_assets = [];
                let datas = VFS.partition.assets._storage.datas
                for (let key in datas) {
                    let d = datas[key].slice(0);
                    assets[key] = d;
                    arr_assets.push(d);
                }
                let runProjectCmd = { "cmd": "runProject", "bytes": result, fsm: "Start.Main", assets };
                browser_run_window.postMessage(runProjectCmd, arr_assets);
                browser_run_window.focus();
            }
        });
    }
    function newWindow(result) {
        let assets = {};
        let arr_assets = [];
        let datas = VFS.partition.assets._storage.datas
        for (let key in datas) {
            let d = datas[key].slice(0);
            assets[key] = d;
            arr_assets.push(d);
        }
        let runProjectCmd = { "cmd": "runProject", "bytes": result, fsm: "Start.Main", assets };
        let sn = ++window_sn;
        let w = {
            id: sn, enable: true, style: {
                width: '375px',
                height: '600px',
                widthWithDev: '900px',
                borderBottom: '1px solid #e8eaec',
                borderRight: '1px solid #e8eaec'
            },
            gridX: 0, gridY: 0, iframe: null,
            mousePosition: { x: 0, y: 0 },
            msg: null,
            showLog: true,
            followNewLog: true,
            log: [],
            tool: null,
            // showDevTool: false,
            // Inspector: false,
            logType: ['sys', 'usr'],
            logLevel: [3, 4, 5],
            usrLogLevel: 5,
            sysLogLevel: 5,
        };
        let index = windows.length;
        w.onVisibleChange = function (v) {
            setTimeout(() => {
                windows.splice(index, 1);
                w.iframe.remove();
                // windows[index] = null;
            }, 5);
        };
        windows.push(w);
        setTimeout(() => {
            let iframes = jspreviewer.$refs.jsprevieweriframe;
            let iframe = iframes[iframes.length - 1];
            w.iframe = iframe;
            iframe.contentWindow.window.onload = () => {
                iframe.contentWindow.postMessage(runProjectCmd, arr_assets);
            };
            iframe.contentWindow.postMessage(runProjectCmd, arr_assets);
            jspreviewer.dragData.push(jspreviewer.$refs.jspreviewerinst[iframes.length - 1].$vnode.componentInstance._data.dragData);
            setLogFilter(w)
        }, 0);
    }
    Vue.component('jspreviewer_add', async (resolve, reject) => {
        let template = (await axios('../iframeconnector/add.html')).data;
        resolve({
            props: [],
            data: {},
            template,
            methods: {
                newWindow() {
                    OpenBlock.exportExePackage({ debug: true }, (err, result) => {
                        if (!err) {
                            newWindow(result);
                        }
                    });
                },
                runInStandaloneWindow() {
                    if (this.loading) {
                        UB_IDE.$Message.info(OpenBlock.i('正在打开工程，请稍后。'));
                        return;
                    }
                    UB_IDE.saveAll();
                    standaloneWindow();
                },
                // newDebugWindow() {
                //     OpenBlock.exportExePackage({ debug: true },  (err, result) => {
                //         if (!err) {
                //             newWindow(result);
                //         }
                //     });
                // }
            }
        });
    });
    Vue.component('jspreviewer', async (resolve, reject) => {
        let template = (await axios('../iframeconnector/jspreviewer.html')).data;
        resolve({
            props: [],
            data() {
                return {
                    enable: true,
                    dragData: [],
                    logDivColumns: [
                        {
                            title: OpenBlock.i('消息'),
                            key: 'msg',
                            className: 'logTableColumnNormal',
                        },
                        {
                            title: OpenBlock.i('来源'),
                            key: 'stackpath',
                            className: 'logTableColumnNormal',
                            render: (h, params) => {
                                return h('div', [
                                    h('a', {
                                        on: {
                                            click: this.clickTableCell(params.row)
                                        },
                                    }, params.row.stackpath)
                                ]);
                            }
                        },
                        {
                            title: OpenBlock.i('类型'),
                            key: 'type',
                            className: 'logTableColumnType logTableColumnNormal',
                            width: '35px',
                            filters: [
                                {
                                    label: OpenBlock.i('系统'),
                                    value: 1
                                },
                                {
                                    label: OpenBlock.i('用户'),
                                    value: 2
                                }
                            ],
                            filterMultiple: false,
                            filterMethod(value, row) {
                                if (value === 1) {
                                    return row.type === 'sys';
                                } else if (value === 2) {
                                    return row.type === 'usr';
                                }
                            }
                        },
                        {
                            title: OpenBlock.i('等级'),
                            key: 'level',
                            className: 'logTableColumnLevel logTableColumnNormal',
                            width: '35px',
                            filters: [
                                {
                                    label: 0,
                                    value: 0
                                },
                                {
                                    label: 1,
                                    value: 1
                                },
                                {
                                    label: 2,
                                    value: 2
                                },
                                {
                                    label: 3,
                                    value: 3
                                },
                                {
                                    label: 4,
                                    value: 4
                                },
                                {
                                    label: 5,
                                    value: 5
                                },
                                {
                                    label: 6,
                                    value: 6
                                },
                                {
                                    label: 7,
                                    value: 7
                                },
                                {
                                    label: 8,
                                    value: 8
                                },
                                {
                                    label: 9,
                                    value: 9
                                },
                                {
                                    label: 10,
                                    value: 10
                                },
                            ],
                            // filteredValue: [3, 4, 5, 6],
                            filterMultiple: true,
                            filterMethod(value, row) {
                                return row.level === value;
                            }
                        },
                        {
                            title: OpenBlock.i('时间'),
                            key: 'time',
                            className: 'logTableColumnTime logTableColumnNormal',
                            width: '60px'
                        },
                    ],
                    windows
                };
            },
            template,
            mounted() {
                jspreviewer = this;
                this.$watch('dragData', function (newValArr, oldVal) {
                    newValArr.forEach(newVal => {
                        if (!newVal.dragging) {
                            if (newVal.y < 0) {
                                newVal.y = 0;
                            }
                            if (newVal.x < -300) {
                                newVal.x = -300;
                            }

                            if (newVal.y > window.innerHeight - 100) {
                                newVal.y = window.innerHeight - 100;
                            }
                            if (newVal.x > window.innerWidth - 100) {
                                newVal.x = window.innerWidth - 100;
                            }

                        }
                    });
                }, { deep: true, immediate: true });
            },
            methods: {
                clickTableCell(d) {
                    let that = this;
                    return () => {
                        that.tableCell(d);
                    }
                },
                tableCell(data) {
                    this.$root.gotoSrc(data.block);
                    // if (data.cmd === 'text') {
                    //     this.$root.gotoSrc(data.block);
                    //     return;
                    // }
                    // switch (data.msg) {
                    //     default:
                    //         this.$root.gotoSrc(data.block);
                    // }
                },
                showLogChange(win) {
                    win.showLog = !win.showLog;
                    let runProjectCmd = {
                        "cmd": "showLog",
                        value: win.showLog
                    };
                    win.iframe.contentWindow.postMessage(runProjectCmd);
                },
                toggleFollowNewLog(win) {
                    win.followNewLog = !win.followNewLog;
                },
                closeSimular(win, index) {
                    console.log(win, index);
                },
                changeScreen(win, evt) {
                    win.style.height = evt.target.value;
                },
                restart(win) {
                    let runProjectCmd = {
                        "cmd": "restart",
                        fsm: "Start.Main"
                    };
                    win.iframe.contentWindow.postMessage(runProjectCmd);
                },
                clearLog(win) {
                    // let runProjectCmd = {
                    //     "cmd": "clearLog"
                    // };
                    // win.iframe.contentWindow.postMessage(runProjectCmd);
                    win.log = [];
                },
                pause(win) {
                    let runProjectCmd = {
                        "cmd": "pause"
                    };
                    win.iframe.contentWindow.postMessage(runProjectCmd);
                },
                resume(win) {
                    let runProjectCmd = {
                        "cmd": "resume"
                    };
                    win.iframe.contentWindow.postMessage(runProjectCmd);
                },
                logLevelChange(win) {
                    setLogFilter(win);
                },
                gridChange(win) {
                    let arg = { x: Math.abs(parseInt(win.gridX)), y: Math.abs(parseInt(win.gridY)) };
                    let drawGrid = {
                        "cmd": "drawGrid",
                        "arg": arg
                    };
                    win.iframe.contentWindow.postMessage(drawGrid);
                    console.log(arg);
                }
            }
        });
    });
    OpenBlock.onInited(() => {
        class Simulator extends OBConnector {
            pageUrl;
            loading = false;
            /**
             * @type {Window}
             */
            constructor() {
                super();
                this.pageUrl = "../jsruntime/test/index.html";
            }
            setLoading() {
                this.loading = true;
            }
            unsetLoading() {
                this.loading = false;
            }
            loadConfig() {
                Simulator.loadDefaultConfig();
            }
            static loadDefaultConfig() {
                let env = ROOT_URL + 'env/'
                let jsarr = [
                    env + 'i18n_zh.js',
                    env + 'nativeEvent.js',
                    env + 'native.js',
                ];
                var xmlpath = env + "nativeBlocks.xml";
                OpenBlock.loadNativeInfo(jsarr, xmlpath);
            }
            runProject() {
                if (this.loading) {
                    UB_IDE.$Message.info(OpenBlock.i('正在打开工程，请稍后。'));
                    return;
                }
                let assets = {};
                let arr_assets = [];
                let datas = VFS.partition.assets._storage.datas
                for (let key in datas) {
                    let d = datas[key].slice(0);
                    assets[key] = d;
                    arr_assets.push(d);
                }
                OpenBlock.exportExePackage({ debug: true }, (err, result) => {
                    if (!err) {
                        let runProjectCmd = {
                            "cmd": "runProject",
                            "bytes": result,
                            fsm: "Start.Main",
                            assets
                        };
                        if (windows.length == 0) {
                            newWindow(result);
                        }
                        setTimeout(() => {
                            jspreviewer.$refs.jsprevieweriframe.forEach(iframe => {
                                iframe.contentWindow.window.onload = () => {
                                    iframe.contentWindow.postMessage(runProjectCmd, arr_assets);
                                };
                                iframe.contentWindow.postMessage(runProjectCmd, arr_assets);
                            });
                        }, 5);
                    }
                });
            }
        }
        window.Simulator = Simulator;
        UB_IDE.ensureExtComponent('subwindows', 'jspreviewer');
        UB_IDE.ensureExtComponent('lefttoolbox', 'jspreviewer_add');
        let messageHandler = {
            mousemove(evt) {
                let v = evt.data.arg;
                let win = evt.source;
                let w = windows.find(w => w.iframe.contentWindow === win);
                w.mousePosition = v;
            },
            debug(evt) {
                if (evt.data.name === "Message received"
                    && evt.data.args.msg === "animationframe"
                    && evt.data.args.type === "event") {
                    return;
                }
                let msg = evt.data;
                let args = Object.assign({}, msg.block, msg.args);
                if (msg && msg.name) {
                    if (msg.name === 'Error') {
                        msg.msg = sprintf(OpenBlock.i(msg.args.title || msg.args.message), args);
                    } else {
                        msg.msg = sprintf(OpenBlock.i(msg.name), args);
                    }
                }
                msg.type = 'sys';
                switch (msg.name) {
                    case 'FSM created':
                        msg.stackpath = sprintf('%(fsm)s-%(state)s', args);
                        break;
                    case 'Event received':
                        msg.stackpath = sprintf('%(fsm)s-%(state)s', args);
                        break;
                    default:
                        if (msg.block.fsm) {
                            msg.stackpath = sprintf('%(fsm)s-%(state)s-%(func)s', args);
                        } else if (msg.block.fsmType) {
                            msg.stackpath = sprintf('%(fsmType)s-%(state)s-%(func)s', args);
                        }
                }
                let win = evt.source;
                this.putLog(win, msg);
            },
            putLog(win, v) {
                if (!win) {
                    return;
                }
                let wi = windows.findIndex(w => w.iframe.contentWindow === win);
                let w = windows[wi];
                if (!w) {
                    return;
                }
                function checkTime(i) {
                    if (i < 10) {
                        i = "0" + i;
                    }
                    return i;
                }
                var today = new Date();//定义日期对象   
                var hh = today.getHours();//通过日期对象的getHours方法返回小时   
                var mm = today.getMinutes();//通过日期对象的getMinutes方法返回分钟   
                var ss = today.getSeconds();//通过日期对象的getSeconds方法返回秒  
                mm = checkTime(mm);
                ss = checkTime(ss);
                let time = hh + ':' + mm + ':' + ss;
                v.time = time;
                w.log.push(v);
                if (w.log.length > 5000) {
                    w.log.shift();
                }
                if (w.followNewLog) {
                    let div = jspreviewer.$refs.logDiv[wi];
                    div.scrollTop = Number.MAX_SAFE_INTEGER;
                }
                if (v.level >= 5) {
                    if (!v.stype) {
                        if (v.level >= 8) {
                            v.stype = 'error';
                        } else if (v.level == 7) {
                            v.stype = 'warning';
                        } else if (v.level == 6) {
                            v.stype = 'success';
                        } else {
                            v.stype = 'info';
                        }
                    }
                    if (!v.content) {
                        v.content = v.msg;
                    }
                    w.msg = v;
                }
            },
            log(evt) {
                let v = evt.data.arg;
                let win = evt.source;
                this.putLog(win, v);
            },
            msg(evt) {
                let msg = evt.data.arg;
                if (msg && msg.format) {
                    msg.content = sprintf(OpenBlock.i(msg.info.title), msg.info.args);
                }
                let win = evt.source;
                let w = windows.find(w => w.iframe.contentWindow === win);
                w.msg = msg;
            }
        };
        function receiveMessage(event) {
            let cmd = event.data.cmd;
            if (messageHandler[cmd]) {
                messageHandler[cmd](event);
            }
        }
        window.addEventListener("message", receiveMessage);

    });

})();