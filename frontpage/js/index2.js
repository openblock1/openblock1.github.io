/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

// window.addEventListener("beforeunload", function (e) {
//     e.preventDefault();
//     var dialogText = '离开此网站？系统可能不会保存您所做的更改。';
//     e.returnValue = dialogText;
//     return dialogText;
// });
window.FileInterface = Object.assign({
    saveExeFile(e, arrbuf) {
        if (e) {
            throw e;
        }
        FileOD.Save(/*src.name + '.xe'*/'logic.xe', new Blob([arrbuf], {
            type: 'application/octet-stream'
        }));
    },
    saveLibFile(srcname, e, blob) {
        if (e) {
            throw e;
        }
        FileOD.Save(srcname + '.xl', blob);
    },
    saveSrcFile(srcname, e, src_str) {
        if (e) {
            throw e;
        }
        FileOD.Save(srcname + '.xs', src_str);
    },
    loadSrcFiles(cb) {
        let _loadFiles = (files, cb) => {
            let parsedFile = [];
            let errors = [];

            function checkFinish() {
                if (parsedFile.length + errors.length === files.length) {
                    if (errors.length > 0) {
                        throw new Error(errors);
                    }
                    try {
                        VFS.partition.src.putAll(parsedFile);
                    } catch (e) {
                        console.error(e);
                    }
                    if (typeof (cb) === 'function') {
                        cb(parsedFile)
                    }
                }
            }
            files.forEach((f) => {
                // let fname = f.name.toLowerCase();
                let reader = new FileReader();
                reader.readAsText(f);
                reader.onloadend = (evt) => {
                    try {
                        let json = JSON.parse(evt.target.result);
                        if (json.type === 'src' || json.type === 'lib') {
                            parsedFile.push({ name: json.name + '.xs', content: json });
                        } else {
                            throw new Error(`未知文件类型:${json.name}-${json.type}`);
                        }
                    } catch (e) {
                        errors.push(e);
                    }
                    checkFinish();
                };
            });
        };
        FileOD.Open('.xs,.xl', 'File', (files) => {
            files = Object.values(files);
            _loadFiles(files, () => {
                if (cb) {
                    cb(files);
                }
            });
        }, true);
    },
    loadExcel(cb) {
        FileOD.Open('.xlsx', 'ArrayBuffer', (arrayBufferArray) => {
            cb(arrayBufferArray);
        }, true);
    },
    uploadFiles(suffixs, type, cb) {
        FileOD.Open(suffixs, type, (arrayBufferArray) => {
            cb(arrayBufferArray);
        }, true);
    },
    uploadFile(suffixs, type, cb) {
        FileOD.Open(suffixs, type, (arrayBufferArray) => {
            cb(arrayBufferArray);
        }, false);
    },
    downloadFiles(filename, blob) {
        FileOD.Save(filename, blob);
    }
}, window.FileInterface);
function showCreateVarDiv(callback) {
    return function (src, target, workspace) {
        window.UB_IDE.showVariableInfo = true;
        window.UB_IDE.createVarInfo = { src, name: "", target, type: '', wrap: "", baseData: [], callback, export: true, workspace };
        window.UB_IDE.avalibleVarTypes("");
    }
}
function asyncConfirm(msg, callback) {
    window.UB_IDE.$Modal.confirm({
        title: '确认',
        content: `<p>${msg}</p>`,
        onOk() {
            callback(true);
        },
        onCancel() {
            callback(false);
        }
    });
}
document.addEventListener('DOMContentLoaded', function () {
    (function () {
        let stateToolbox, functionToolbox;
        let config;
        function buildBlockly() {
            config.uiCallbacks = {
                addFsmVariable: showCreateVarDiv(OpenBlock.addFSMVariable),
                addStateVariable: showCreateVarDiv(OpenBlock.addStateVariable),
                confirm: asyncConfirm,
                prompt: AsyncPrompt.prompt
            };
            config.toolbox = {
                state: stateToolbox,
                function: functionToolbox
            };
            OpenBlock.init({
                stubToolbox: false,
                uiCallbacks: config.uiCallbacks,
                extI18NPath: 'i18n/',
                toolbox: config.toolbox,
                blocklyOpt: config.blocklyOpt || {
                    grid: {
                        spacing: 25,
                        length: 3,
                        "colour": "#F3F3F3",
                        snap: false
                    },
                    move: {
                        scrollbars: true,
                        drag: true,
                        wheel: true
                    },
                    // maxBlocks: 65535,
                    zoom: {
                        'controls': true,
                        'wheel': true,
                        minScale: 0.7,
                    },
                    scrollbars: true,
                    sounds: false,
                    comments: true,
                    disable: true
                }
            });
        }
        let promises = [];
        promises.push(axios({
            type: 'GET',
            url: 'core/xml/stateToolbox2.xml',
            responseType: 'text',
            async: false,
        }).then(({ data }) => {
            stateToolbox = data;
        }));
        promises.push(axios({
            type: 'GET',
            url: 'core/xml/functionToolbox.xml',
            responseType: 'text',
            async: false
        }).then(({ data }) => {
            functionToolbox = data;
        }));
        promises.push(axios({
            url: 'config/openblock.json',
            responseType: 'json',
            async: false
        }).then(({ data }) => {
            config = data;
        }))
        Promise.all(promises).then(buildBlockly);
    })();
});
function startUI() {
    window.UB_IDE = new Vue({
        el: '#openblock',
        data: {
            showEditor: true,
            showProjectWindow: true,
            //OpenBlock: OpenBlock,
            srcs: OpenBlock.BlocklyParser.loadedFiles.srcs,
            searchBlockId: '',
            createVarInfo: null,
            tabs: [],
            showingTabName: "",
            siderUsing: null,
            /**
             * 侧边栏
             * @type {{name:string,icon:string,tooltip:string}[]}
             */
            siderComponents: [],
            extSlot: {
                /**
                 * 不随编辑器的组件
                 */
                windows: [],
                /**
                 * 随编辑器隐藏的组件
                 */
                subwindows: [],
                /**
                 * 左侧工具栏
                 */
                lefttoolbox: [],
                /**
                 * 右侧工具栏
                 */
                righttoolbox: [],
            },
            projectName: '',
            editProjectName: false,
            editingSrc: { src: {} },
            showSrcEditWindow: false,
            showRenameDialog: false,
            renameDialog: false,
            showVariableInfo: false,
            showErrorWindow: false,
            compiling: false,
            icp: null
        },
        mounted: function () {
            axios.get('/icp').then(({ data }) => {
                this.icp = data;
            }).catch(() => { });
            this.$nextTick(function () {
                hideOverallLoading();
            });
            window.selectFunctionByName = this.selectFunctionByName;
            window.selectFunction = this.selectFunction;
        },
        methods: {
            saveAll() {
                this.tabs.forEach(tab => {
                    let t = tab.target();
                    if (t && t.saveCode) {
                        t.saveCode();
                    }
                });
            },
            runProject() {
                this.saveAll();
                if (OpenBlock.currentConnector && OpenBlock.currentConnector.runProject) {
                    OpenBlock.currentConnector.runProject();
                }
            },
            doEditProjectName() {
                this.editProjectName = true;
            },
            updateProjectNameKeypress(e) {
                if (e.code === "Enter") {
                    this.updateProjectName();
                } else if (e.code === 'Escape') {
                    VFS.partition.config.get('project.json', (proj) => {
                        if (proj && proj.name !== this.projectName) {
                            this.projectName = proj.name;
                        }
                    });
                    this.editProjectName = false;
                }
            },
            updateProjectName() {
                VFS.partition.config.get('project.json', (proj) => {
                    if (proj && proj.name !== this.projectName) {
                        proj.name = this.projectName;
                        VFS.partition.config.put('project.json', proj);
                    }
                });
                this.editProjectName = false;
            },
            addExtComponent(slot, componentName) {
                this.extSlot[slot].push(componentName);
            },
            removeExtComponent(slot, componentName) {
                let index = 0;
                do {
                    index = this.extSlot[slot].indexOf(componentName);
                    if (index > -1) {
                        this.extSlot[slot].splice(index, 1);
                    }
                } while (index > -1);
            },
            ensureExtComponent(slot, componentName) {
                if (this.extSlot[slot].indexOf(componentName) === -1) {
                    this.addExtComponent(slot, componentName);
                }
            },

            /**
             * 
             * @param {{ name: componentName, icon: 'md-filing', tooltip: '数据集',priority:0 }} componentinfo 
             */
            addSiderComponent(componentinfo) {
                if (typeof (componentinfo.priority) !== 'number') {
                    componentinfo.priority = 0;
                }
                this.siderComponents.push(componentinfo);
                this.siderComponents.sort((e1, e2) => {
                    return e1.priority - e2.priority;
                });
            },
            removeSiderComponent(componentName) {
                const index = this.siderComponents.findIndex((c) => c.name === componentName);
                if (index > -1) {
                    this.siderComponents.splice(index, 1);
                }
            },
            /**
             * 
             * @param {{ name: componentName, icon: 'md-filing', tooltip: '数据集' }} componentinfo 
             */
            ensureSiderComponent(componentinfo) {
                if (this.siderComponents.findIndex((c) => c.name === componentinfo.name) < 0) {
                    this.addSiderComponent(componentinfo);
                }
            },

            useConnector(connector) {
                OpenBlock.useConnector(connector);
            },
            triggleSider(componentName) {
                if (this.siderUsing === componentName) {
                    this.siderUsing = null;
                } else {
                    this.siderUsing = componentName;
                }
            },
            avalibleVarTypes(value) {
                function check(v1, v2) {
                    if (!v1) {
                        return false;
                    }
                    v1 = v1.toLowerCase();
                    return v1.indexOf(v2) > -1;
                }
                value = value.toLowerCase();
                let structTypes = OpenBlock.getAvailableTypes(this.createVarInfo.src);
                let newTypes = structTypes.filter(t => check(t[0], value) || check(t[1], value)).map(t => t[0]);
                let nativeTypes = Object.keys(OpenBlock.nativeTypes).filter(t => check(t, value) || check(Blockly.Msg[t], value));
                nativeTypes = nativeTypes.map(t => OpenBlock.i(t));
                this.createVarInfo.baseData = newTypes.concat(nativeTypes);
            },
            applyCreateVar() {
                let i = this.createVarInfo;
                let typeName = i.type;
                let allType = OpenBlock.getAvailableTypes(this.createVarInfo.src);
                let type = allType.find(t => t[0] === typeName);
                if (type) {
                    i.type = type[1];
                } else {
                    let t = Object.keys(OpenBlock.nativeTypes).find(t => OpenBlock.i(t) === typeName);
                    if (t) {
                        i.type = t;
                    } else {
                        throw Error(OpenBlock.i('未设置类型'));
                    }
                }
                i.callback(i.target, i);
                Vue.nextTick(function () {
                    this.showVariableInfo = false;
                });
            },
            loadFiles: function () {
                FileInterface.loadSrcFiles(() => {
                    OpenBlock.exportExePackage();
                });
            },
            newFile: function () {
                let f = OpenBlock.newSrc({
                    "env": []
                });
                VFS.partition.src.put(f.name + '.xs', f);
            },
            editSrc(src) {
                this.showSrcEditWindow = false;
                Vue.nextTick(() => {
                    let newDeps = [].concat(src.depends);
                    let editingSrc = {
                        src,
                        warning: null,
                        name: src.name,
                        depends: newDeps,
                    };
                    this.editingSrc = editingSrc;
                    this.showSrcEditWindow = true;
                    this.$forceUpdate();
                });
            },
            submitEditingSrc() {
                let editingSrc = this.editingSrc;
                let src = editingSrc.src;
                if (!editingSrc.name) {
                    editingSrc.warning = "需要指定模块名称";
                    return;
                }
                let check =
                    OpenBlock.BlocklyParser.loadedFiles.srcs.find(s => (s != src && s.name === editingSrc.name));
                if (check) {
                    editingSrc.warning = "模块名称冲突";
                    return;
                }
                if (src.name != editingSrc.name) {
                    let oldName = src.name;
                    VFS.partition.src.delete(oldName + '.xs');
                    src.name = editingSrc.name;
                }
                this.showSrcEditWindow = false;
                this.editingSrc = { src: {} };

                src.depends = editingSrc.depends;
                VFS.partition.src.put(src.name + '.xs', src);
                OpenBlock.BlocklyParser.updateDepends();
                this.$forceUpdate();
            },
            cleanEditingSrc() {
                this.showSrcEditWindow = false;
                this.editingSrc = { src: {} };
            },
            analyze: function () {
                OpenBlock.exportExePackage();
            },
            saveSrcFile: function (src) {
                this.tabs.forEach(tab => {
                    let t = tab.target();
                    if (t && t.saveCode) {
                        t.saveCode();
                    }
                });
                OpenBlock.serializeSrc(src, (e, src_str) => { FileInterface.saveSrcFile(src.name, e, src_str); });
            },
            // saveLibFile: function (src) {
            //     OpenBlock.exportExePackage();
            //     OpenBlock.serializeLib(src, (e, blob) => { FileInterface.saveLibFile(src.name, e, blob); });
            // },
            saveExeFile: function () {
                this.tabs.forEach(tab => {
                    let t = tab.target();
                    if (t && t.saveCode) {
                        t.saveCode();
                    }
                });
                OpenBlock.exportExePackage(FileInterface.saveExeFile);
            },
            addFSM: function (src) {
                OpenBlock.addFSM(src);
            },
            prompt(msg, oldValue, onok) {
                let self = this;
                this.renameDialog = {
                    title: msg,
                    oldValue: oldValue,
                    value: oldValue,
                    ok() {
                        onok(self.renameDialog.value);
                        self.showRenameDialog = false;
                    }, cancel() {
                        self.showRenameDialog = false;
                    }
                }
                this.showRenameDialog = true;
            },
            renameFSM: function (src, fsm) {
                this.prompt("重命名状态机类型", fsm.name, (v) => {
                    if (v) {
                        if (v === fsm.name) {
                            return;
                        }
                        let check = src.fsms.find(_fsm => _fsm.name === v);
                        if (check) {
                            Vue.nextTick(() => {
                                this.$Modal.error({
                                    title: "错误",
                                    content: "该名称已存在"
                                });
                            });
                        } else {
                            fsm.name = v;
                            OpenBlock.saveAllSrc();
                            OpenBlock.exportExePackage();
                        }
                    }
                });
            },
            renameState: function (fsm, state) {
                this.prompt("重命名状态", state.name, (v) => {
                    if (v) {
                        if (v === state.name) {
                            return;
                        }
                        let check = fsm.states.find(o => o.name === v);
                        if (check) {
                            Vue.nextTick(() => {
                                this.$Modal.error({
                                    title: "错误",
                                    content: "该名称已存在"
                                });
                            });
                        } else {
                            state.name = v;
                            OpenBlock.saveAllSrc();
                            OpenBlock.exportExePackage();
                        }
                    }
                });
            },
            renameStruct: function (src, st) {
                this.prompt("重命名数据结构", st.name, (v) => {
                    if (v) {
                        if (v === st.name) {
                            return;
                        }
                        let check = src.structs.find(o => o.name === v);
                        if (check) {
                            Vue.nextTick(() => {
                                this.$Modal.error({
                                    title: "错误",
                                    content: "该名称已存在"
                                });
                            });
                        } else {
                            st.name = v;
                            OpenBlock.saveAllSrc();
                            OpenBlock.exportExePackage();
                        }
                    }
                });
            },
            renameFunction: function (src, st) {
                this.prompt("重命名函数", st.name, (v) => {
                    if (v) {
                        if (v === st.name) {
                            return;
                        }
                        let check = src.functions.find(o => o.name === v);
                        if (check) {
                            Vue.nextTick(() => {
                                this.$Modal.error({
                                    title: "错误",
                                    content: "该名称已存在"
                                });
                            });
                        } else {
                            st.name = v;
                            OpenBlock.saveAllSrc();
                            OpenBlock.exportExePackage();
                        }
                    }
                });
            },
            renameFSMVariable: function (fsm, v) {
                let newName = prompt("name", v.name)
                if (newName) {
                    v.name = newName;
                    OpenBlock.saveAllSrc();
                    OpenBlock.exportExePackage();
                }
            },
            setStartState: function (fsm, state) {
                let index = fsm.states.indexOf(state);
                if (index != 0) {
                    let startState = fsm.states[0];
                    // fsm.states[index] = startState;
                    Vue.set(fsm.states, index, startState);
                    // fsm.states[0] = state;
                    Vue.set(fsm.states, 0, state);
                }
                OpenBlock.saveAllSrc();
            },
            removeFSMVariable: function (fsm, v) {

                this.$Modal.confirm({
                    title: '删除',
                    content: `<p>删除变量 ${v.name}</p>`,
                    onOk() {
                        OpenBlock.removeFSMVariable(fsm, v);
                        OpenBlock.exportExePackage();
                    }
                });
            },
            removeFSM: function (src, fsm) {
                this.$Modal.confirm({
                    title: '删除',
                    content: `<p>删除状态机类型 ${fsm.name}</p>`,
                    onOk() {
                        OpenBlock.removeFSM(src, fsm);
                        OpenBlock.exportExePackage();
                    }
                });
            },
            addFsmVariable: function (src, fsm) {
                showCreateVarDiv(OpenBlock.addFSMVariable)(src, fsm)
            },
            removeFSMState: function (fsm, v) {
                this.$Modal.confirm({
                    title: '删除',
                    content: `<p>删除状态 ${v.name}</p>`,
                    onOk() {
                        OpenBlock.removeFSMState(fsm, v);
                        OpenBlock.exportExePackage();
                    }
                });
            },
            removeStruct(src, struct) {
                this.$Modal.confirm({
                    title: '删除',
                    content: `<p>删除数据结构 ${struct.name}</p>`,
                    onOk() {
                        OpenBlock.removeStruct(src, struct);
                        OpenBlock.exportExePackage();
                    }
                });
            },
            addFSMState: function (fsm) {
                let state = OpenBlock.addState(fsm);
            },
            addStruct: function (src) {
                if (src && src.structs) {
                    let dt = OpenBlock.addStruct(src);
                }
            },
            addFunction: function (src) {
                if (src && src.functions) {
                    let f = OpenBlock.addFunction(src);
                }
            },
            removeFunction(s, f) {
                this.$Modal.confirm({
                    title: '删除',
                    content: `<p>删除函数 ${f.name}</p>`,
                    onOk() {
                        OpenBlock.removeFunction(s, f);
                        OpenBlock.exportExePackage();
                    }
                });
            },
            openBlocklyTab(key, lableBuilder, builderFunc, beforeContentDestroy1) {
                let workspace = this.tabs.find(info => info.key === key);
                if (workspace) {
                    this.showingTabName = workspace.name;
                } else {
                    // let self = this;
                    let newTab = {
                        name: Math.random().toString(16),
                        label: lableBuilder,
                        content: "blockly-editor",
                        key: key,
                        target() { return null; },
                        contentBuilder: (dom, editor) => { return builderFunc(dom, editor, newTab); },
                        beforeContentDestroy(arg) {
                            beforeContentDestroy1(arg);
                        }
                    };
                    this.tabs.push(newTab);
                    this.showingTabName = newTab.name;
                }
                this.siderUsing = null;
            },
            closeTab(key) {
                const index = this.tabs.findIndex(t => t.key === key);
                if (index > -1) {
                    this.tabs.splice(index, 1);
                    if (index >= this.tabs.length) {
                        if (this.tabs.length > 0) {
                            this.showingTabName = this.tabs[this.tabs.length - 1].name;
                        } else {
                            this.showingTabName = null;
                        }
                    }
                }
            },
            openDataTab(tableName) {
                let tab = this.tabs.find(info => info.key === tableName);
                if (tab) {
                    this.showingTabName = tab.name;
                } else {
                    let self = this;
                    let newTab = {
                        name: Math.random().toString(16),
                        label: createElement => {
                            return createElement('div', { attrs: { class: "ns bold" } }, [
                                createElement('icon', { attrs: { type: "ios-folder" } }),
                                tableName,
                                createElement('icon', {
                                    attrs: { type: "ios-close" }, on: {
                                        click: function () {
                                            self.closeTab(tableName);
                                        }
                                    }
                                })]);
                        },
                        content: "data-viewer",
                        key: tableName,
                        target() { return null; },
                        contentBuilder: (dom, editor) => { },
                        beforeContentDestroy(arg) {
                        }
                    };
                    this.tabs.push(newTab);
                    this.showingTabName = newTab.name;
                }
                this.siderUsing = null;
            },
            gotoSrc(srcInfo, blockId) {
                // selectStateByName
                // selectFunctionByName
                if (!blockId) {
                    blockId = srcInfo.blockId;
                }
                var count = srcInfo.func && (srcInfo.func.match(/\./g) || []).length;
                if (count == 1) {
                    if (!srcInfo.codename) {
                        let compiled = OpenBlock.Compiler.compiled;
                        let mod = compiled[srcInfo.module];
                        if (!mod.analysed) {
                            return;
                        }
                        let blockIdMap = mod.analysed.blockIdMap;
                        if (!blockIdMap) {
                            return;
                        }
                        let list = blockIdMap[blockId]
                        if (list && list.length > 0) {
                            srcInfo = list[0];
                            this.gotoSrc(srcInfo, blockId);
                            return;
                        }
                    }
                    this.selectFunctionByName(srcInfo.module, srcInfo.codename, blockId);
                } else {
                    this.selectStateByName(srcInfo.module, srcInfo.fsmType, srcInfo.state, blockId);
                }
            },
            selectState(src, fsm, state, blockId) {
                let self = this;
                this.openBlocklyTab(state, createElement => {
                    return createElement('div', { attrs: { class: "ns bold" } }, [
                        createElement('icon', { attrs: { type: "ios-fastforward" } }),
                        state.name + ":" + fsm.name,
                        createElement('icon', {
                            attrs: { type: "ios-close" }, on: {
                                click: function () {
                                    self.closeTab(state);
                                }
                            }
                        })]);
                },
                    (dom, editor, tab) => {
                        let w = OpenBlock.buildStateBlockly(src, fsm, state, dom);
                        tab.target = function () { return w };
                        return w;
                    }, ws => {
                        if (ws.saveCode) {
                            ws.saveCode();
                            ws.dispose();
                        } else {
                            debugger
                        }
                    });
                if (blockId) {
                    setTimeout(() => {
                        let tab = this.tabs.find(t => {
                            return t.key === state;
                        });
                        if (tab) {
                            let ubctx = tab.target();
                            let ctx = ubctx.context;
                            let workspace = ctx.workspace;
                            // this.currentBlocklyWorkspace.context.workspace.highlightBlock(errinfo.err.blockId);
                            let blk = workspace.getBlockById(blockId);
                            if (blk) {
                                blk.select();
                                OpenBlock.Utils.centerOnSingleBlock(workspace, blk.id);
                            }
                        }
                    }, 5);
                }
            },
            selectStateByName(srcName, fsmName, stateName, blockId) {
                let src = OpenBlock.getSrcByName(srcName);
                let fsm = OpenBlock.getFsmByName(src, fsmName);
                let state = OpenBlock.getStateByName(fsm, stateName);
                this.selectState(src, fsm, state, blockId);
            },
            selectStruct(src, struct) {
                let self = this;
                this.openBlocklyTab(struct, (createElement) => {
                    return createElement('div', { attrs: { class: "ns bold" } }, [
                        createElement('icon', { attrs: { type: "logo-codepen" } }),
                        struct.name + ":" + src.name,
                        createElement('icon', {
                            attrs: { type: "ios-close" }, on: {
                                click: function () {
                                    self.closeTab(struct);
                                }
                            }
                        })]);
                },
                    (dom, editor, tab) => {
                        let w = OpenBlock.buildStructBlockly(src, struct, dom);
                        tab.target = function () { return w; };
                        return w;
                    }, ws => {
                        ws.saveCode();
                        ws.dispose();
                    });
            },
            selectFunctionByName(srcName, funcName, blockId) {
                let src = OpenBlock.getSrcByName(srcName);
                let func = OpenBlock.getFuncGroupByFunctionName(src, funcName);
                this.selectFunction(src, func, blockId);
            },
            selectFunction(src, f, blockId) {
                if (!(src && f)) {
                    console.error(src, f);
                    return;
                }
                let self = this;
                this.openBlocklyTab(f, (createElement) => {
                    return createElement('div', { attrs: { class: "ns bold" } }, [
                        createElement('icon', { attrs: { type: "md-calculator" } }),
                        f.name + ":" + src.name,
                        createElement('icon', {
                            attrs: { type: "ios-close" }, on: {
                                click: function () {
                                    self.closeTab(f);
                                }
                            }
                        })]);
                },
                    (dom, editor, tab) => {
                        let w = OpenBlock.buildFunctionBlockly(src, f, dom);
                        tab.target = function () { return w; };
                        return w;
                    }, ws => {
                        if (ws.saveCode) {
                            ws.saveCode();
                            ws.dispose();
                        } else {
                            debugger
                        }
                    });
                if (blockId) {
                    setTimeout(() => {
                        let tab = this.tabs.find(t => {
                            return t.key === f;
                        });
                        if (tab) {
                            let ubctx = tab.target();
                            let ctx = ubctx.context;
                            let workspace = ctx.workspace;
                            // this.currentBlocklyWorkspace.context.workspace.highlightBlock(errinfo.err.blockId);
                            let blk = workspace.getBlockById(blockId);
                            if (blk) {
                                blk.select();
                                OpenBlock.Utils.centerOnSingleBlock(workspace, blk.id);
                            }
                        }
                    }, 5);
                }
            },
            addDepends: function (src, depends) {
                OpenBlock.addDepends(src, depends);
                OpenBlock.exportExePackage();
            },
            removeDepends: function (src, depends) {
                OpenBlock.removeDepends(src, depends);
                OpenBlock.exportExePackage();
            },
            unloadFile: function (file) {
                this.$Modal.confirm({
                    title: '卸载模块',
                    content: `<p>是否卸载模块 ${file.name}</p>`,
                    onOk() {
                        for (let idx in VFS.partition.src._storage.datas) {
                            let fileInfo = VFS.partition.src._storage.datas[idx];
                            if (fileInfo === file) {
                                VFS.partition.src.delete(idx);
                                break;
                            }
                        }
                        OpenBlock.exportExePackage();
                    }
                });
            },
            highlightErrBlock: function (errinfo) {
                if (!errinfo.err.src) {
                    return;
                }
                let keyName;
                let type;
                if (errinfo.err.state) {
                    this.selectStateByName(errinfo.err.src,
                        errinfo.err.fsm,
                        errinfo.err.state);
                    keyName = errinfo.err.state;
                    type = 'state';
                } else if (errinfo.err.func) {
                    this.selectFunctionByName(errinfo.err.src, errinfo.err.func, errinfo.err.blockId);
                    type = 'func'
                    keyName = errinfo.err.func;
                }
                setTimeout(() => {
                    let tab = this.tabs.find(t => {
                        try {
                            return t.key.name === keyName
                                && t.key.type === type
                                && t.target().context.src.name === errinfo.err.src
                                && t.target().context.fsm.name === errinfo.err.fsm;
                        } catch (e) {
                            console.log(e);
                            return false;
                        }
                    });
                    if (tab) {
                        let ubctx = tab.target();
                        let ctx = ubctx.context;
                        let workspace = ctx.workspace;
                        // this.currentBlocklyWorkspace.context.workspace.highlightBlock(errinfo.err.blockId);
                        let blk = workspace.getBlockById(errinfo.err.blockId);
                        if (blk) {
                            blk.select();
                            OpenBlock.Utils.centerOnSingleBlock(workspace, blk.id);
                        }
                    }
                }, 5);
            },
            importData: function () {
                FileInterface.loadExcel(
                    /**
                     * 
                     * @param {{name:String,content:ArrayBuffer}[]} arrayBufferArray 
                     */
                    (arrayBufferPair) => {
                        // OpenBlock.DataImporter.excel.import(arrayBufferPair);
                        // OpenBlock.DataImporter.reorganizeData();
                        // arrayBufferPair.forEach(pair=>{
                        //     VFS.partition.data.put(pair.name,pair.content)
                        // });
                        VFS.partition.data.putAll(arrayBufferPair);
                    });

            },
            clearData() {
                // OpenBlock.DataImporter.cleanData();
                VFS.partition.data.deleteAll();
            },
            allLibs(srcName) {
                if (!srcName) {
                    return [];
                }
                if (OpenBlock.BlocklyParser.loadedFiles.dependingTree) {
                    let unavalibles = this.unavalibleLibs(srcName).map(l => l.value);
                    let arr = OpenBlock.BlocklyParser.loadedFiles.dependingTree.allNodes.map(n => n.value);
                    let r = arr.map(a => { return { "label": a, "key": a, "disabled": a === srcName || (unavalibles.indexOf(a) > -1 && this.editingSrc.depends.indexOf(a) < 0) }; });
                    return r;
                } else {
                    return [];
                }
            },
            avalibleLibs: function (srcName) {
                if (!srcName) {
                    return [];
                }
                if (OpenBlock.BlocklyParser.loadedFiles.dependingTree &&
                    OpenBlock.BlocklyParser.loadedFiles.dependingTree.errors.length === 0) {
                    let r = OpenBlock.BlocklyParser.loadedFiles.dependingTree.avalibleOutNode(srcName);
                    return r;
                }
            },
            unavalibleLibs(srcName) {
                if (!srcName) {
                    return [];
                }
                if (OpenBlock.BlocklyParser.loadedFiles.dependingTree &&
                    OpenBlock.BlocklyParser.loadedFiles.dependingTree.errors.length === 0) {
                    let r = OpenBlock.BlocklyParser.loadedFiles.dependingTree.unavalibleOutNode(srcName);
                    return r;
                }
                return [];
            },
            changeSrcDepends(newTargetKeys, direction, moveKeys) {
                this.editingSrc.depends = newTargetKeys;
            },
            exportProjectZip() {
                VFS.partition.config.get('project.json', (proj) => {
                    let projectName = (proj && proj.name) || 'project';
                    OpenBlock.exportProjectZip((content) => {
                        FileInterface.downloadFiles(projectName + '.obp', content);
                    });
                });
            },
            importProjectZip() {
                FileInterface.uploadFile('.zip,.obp', 'ArrayBuffer', (file) => {
                    OpenBlock.importProjectZip(file.content, () => {
                        this.compiling = true;
                        console.log('load zip finished.');
                        OpenBlock.DataImporter.excel.reimportAll();
                        OpenBlock.exportExePackage(() => {
                            UB_IDE.$Message.success(OpenBlock.i('工程加载完成'));
                            this.compiling = false;
                        });
                        VFS.partition.config.get('project.json', (proj) => {
                            if (proj && proj.name) {
                                this.projectName = proj.name;
                            } else {
                                this.projectName = null;
                            }
                        });
                    });
                });
            }
        },
        computed: {
            OpenBlock() { return OpenBlock },
            loadedFiles: function () {
                return [].concat(OpenBlock.BlocklyParser.loadedFiles.srcs, OpenBlock.BlocklyParser.loadedFiles.libs);
            },
            hasError() {
                if (this.compiling) {
                    return false;
                } else {
                    let r = this.errors.length > 0;
                    return r;
                }
            },
            errors: function () {
                let errors = [];
                this.srcs.forEach(src => {
                    src._errors.forEach(err => {
                        errors.push({
                            src, err
                        });
                    });
                    if (src.__compiled && src.__compiled.errors) {
                        src.__compiled.errors.forEach(err => { errors.push({ src, err }) });
                    }
                });
                return errors;
            }
        }
    });
    document.getElementById('openblock').style.display = 'block';
};
OpenBlock.onInited(startUI);
/**
 * 特别关注块类型。如果此类型的块发生变化，要尽快编译。
 */
let special_focus_block_type = ['typed_procedures', "struct_field"];
OpenBlock.onInited(() => {
    let title = document.title;
    VFS.partition.config.on('changed', () => {

        VFS.partition.config.get('project.json', (proj) => {
            if (proj && proj.name) {
                document.title = proj.name + ' - ' + title;
                UB_IDE.projectName = proj.name;
            } else {
                UB_IDE.projectName = null;
                document.title = title;
            }
        });
    });
    // 后台自动编译打包
    let timeout = -1;
    OpenBlock.wsBuildCbs.push(function (ws) {
        let vm = window.UB_IDE;
        if (vm) {
            let autosave = function (e) {
                if (!(e instanceof Blockly.Events.FinishedLoading)) {
                    return;
                }
                ws.removeChangeListener(autosave);
                async function save(ws) {

                    vm.tabs.forEach(async (tab) => {
                        let t = tab.target();
                        if (t && t.saveCode && t.context && t.context.workspace === ws) {
                            await new Promise((res, rej) => {
                                setTimeout(() => {
                                    console.log('save');
                                    t.saveCode();
                                    res();
                                }, 0);
                            });
                        }
                    });
                    timeout = -1;
                    vm.compiling = true;
                    OpenBlock.exportExePackage(() => {
                        vm.compiling = false;
                        vm.$forceUpdate();
                    });
                }
                ws.addChangeListener(function (e) {
                    // if (e.group) {
                    //     return;
                    // }
                    if (timeout > 0) {
                        clearTimeout(timeout);
                        timeout = setTimeout(save, 500);
                    }
                    if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
                        return;
                    }
                    if (e instanceof Blockly.Events.FinishedLoading) {
                        return true;
                    }
                    console.log("autosave", e);
                    OpenBlock.Compiler.stop();
                    OpenBlock.Linker.stop();
                    let time = 10000;
                    if (e.recordUndo) {
                        time = 5000;
                    }
                    if (e.blockId) {
                        let ws = Blockly.Workspace.getById(e.workspaceId);
                        if (ws) {
                            let blk = ws.getBlockById(e.blockId);
                            while (blk) {
                                if (special_focus_block_type.indexOf(blk.type) >= 0) {
                                    time = 100;
                                    break;
                                }
                                blk = blk.getParent();
                            }
                        }
                    }
                    timeout = setTimeout(save, time, Blockly.Workspace.getById(e.workspaceId));

                });
            };
            ws.addChangeListener(autosave);
        }
    });
    OpenBlock.Linker.onFinished((e, r) => {
        if (timeout > 0) {
            clearTimeout(timeout);
        }
        timeout = -1;
    });
});