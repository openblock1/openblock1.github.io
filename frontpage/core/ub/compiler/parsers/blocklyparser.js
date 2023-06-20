/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

OpenBlock.BlocklyParser = (function () {
    var loadedFiles = {
        srcs: [],
        libs: [],
        dependingTree: null,
        analyzedModules: null,
        errors: [],
        structs: []
    };
    let onFilesAddedListeners = [];
    function onFilesAdded(files) {
        onFilesAddedListeners.forEach(l => {
            l(files);
        });
    }
    function addFilesAddedListener(l) {
        onFilesAddedListeners.push(l);
    }
    //
    let onFilesRemovedListeners = [];
    function onFilesRemoved(files) {
        onFilesRemovedListeners.forEach(l => {
            l(files);
        });
    }
    function addFilesRemovedListener(l) {
        onFilesRemovedListeners.push(l);
    }//
    function addFiles(files) {
        // let addingSrc = [];
        // let addingLibs = [];
        files.forEach((file) => {
            let old = judgeModuleName(file.name);
            if (file.type === "src") {
                if (Object.values(loadedFiles.srcs).indexOf(file) >= 0) {
                    return;
                }
                file.__compiled = null;
                file._errors = [];
                if (old && old.type === 'src') {
                    let idx = loadedFiles.srcs.indexOf(old);
                    Vue.set(loadedFiles.srcs, idx, file);
                } else {
                    loadedFiles.srcs.unshift(file);
                }
                // addingSrc.push(file);
            } else if (file.type === "lib") {
                if (Object.values(loadedFiles.libs).indexOf(file) >= 0) {
                    return;
                }
                if (old && old.type === 'lib') {
                    let idx = loadedFiles.libs.indexOf(old);
                    Vue.set(loadedFiles.libs, idx, file);
                } else {
                    loadedFiles.libs.push(file);
                }
                // loadedFiles.libs.push(file);
                // addingLibs.push(file);
            } else {
                throw new Error(`Unknown type name:${file.type}`);
            }
        });
        // addingSrc.forEach(src => {
        // });
        // addingLibs.forEach(lib => {
        // });
        onFilesAdded(files);
        updateDepends();
        analyze();
    };
    function removeFile(modelName) {
        let removed = [];
        function unloadFrom(arr) {
            let i = arr.findIndex(i => i.name === modelName);
            if (i >= 0) {
                removed.push(arr[i]);
                arr.splice(i, 1);
            }
        }
        unloadFrom(OpenBlock.BlocklyParser.loadedFiles.srcs);
        unloadFrom(OpenBlock.BlocklyParser.loadedFiles.libs);
        onFilesRemoved(removed);
        OpenBlock.BlocklyParser.updateDepends();
    }
    /**
     * 判断名称是否存在
     */
    function judgeModuleName(name) {
        for (let src of loadedFiles.srcs) {
            if (src.name === name) {
                return src;
            }
        }

        for (let lib of loadedFiles.libs) {
            if (lib.name === name) {
                return lib;
            }
        }
        return false;
    };
    function updateDepends() {
        let dag = new DAG();

        function add(s) {
            let dagNode = dag.addValue(s.name);
            s.depends.forEach(d => {
                dagNode.out.push(d);
            });
        }
        // 库不能依赖源文件，所以先检查库的依赖关系。没有问题了，再加入源文件检查
        loadedFiles.libs.forEach(add);
        try {
            dag.build();
        } catch (e) {
            throw e;
        }
        loadedFiles.srcs.forEach(add);
        try {
            dag.build();
        } catch (e) {
            throw e;
        }
        loadedFiles.dependingTree = dag;
    };
    function analyze() {
        loadedFiles.errors = [];
        var modules = _analyze_Modules();
        _analyze_2(modules);
        loadedFiles.analyzedModules = modules;
    };
    /**
     * 生成语法树
     */
    function _analyze_Modules() {
        var modules = [].concat(loadedFiles.libs);
        _analyze_SrcToModules(loadedFiles.srcs, modules);
        return modules;
    };
    /**
     * 将源文件解析为语法树
     * 
     * 解析后的信息会累加到modules末尾
     * @param 源码数组
     * @param 已经解析的模块数组
     */
    function _analyze_SrcToModules(srcArray, modules) {
        srcArray.forEach(src => {
            let lib = _analyze_SrcToLib(src);
            modules.push(lib);
            src.__analyzed = lib;
        });
    }
    function addSubArch(arr, target, callback, type, rootSrc) {
        if (arr && callback) {
            arr.forEach(item => {
                callback.call(target, _analyze_Architechture(item, new type(item), rootSrc));
            });
        }
    }
    function parseFunction(f, src, arch) {
        try {
            let parsed = parseXML(f.code, f.name);
            parsed.errors.forEach(e => {
                arch.wrapError(e);
                e.func = f.name;
                e.src = src.name;
                src._errors.push(e);
            });
            // src._errors = src._errors.concat(parsed.errors);
            return parsed.functions;
        } catch (e) {
            arch.wrapError(e);
            e.func = f.name;
            e.src = src.name;
            // throw e;
            src._errors.push(e);
        }
    }
    function parseStruct(st, src, arch) {
        try {
            let parsed = parseXML(st.code, st.name);
            parsed.errors.forEach(e => {
                arch.wrapError(e);
                e.struct = st.name;
                e.src = src.name;
                src._errors.push(e);
            });
            return parsed.structs;
        } catch (e) {
            arch.wrapError(e);
            e.struct = st.name;
            e.src = src.name;
            // throw e;
            src._errors.push(e);
        }
    }
    function parseState(st, src, arch) {
        let state = new StateDef();
        state.setName(st.name);
        st.variables.forEach(v => {
            state.addVariable(new VariableDeclaration(v));
        });
        //state.variables = st.variables
        try {
            let parsed = parseXML(st.code, st.name);
            parsed.errors.forEach(e => {
                arch.wrapError(e);
                e.state = st.name;
                e.src = src.name;
                src._errors.push(e);
            });
            if (parsed.functions) {
                parsed.functions.forEach(f => {
                    state.addFunction(f);
                });
            }
            if (parsed.eventHandlers) {
                parsed.eventHandlers.forEach(f => {
                    state.addEventHandler(f);
                });
            }
            if (parsed.messageHandlers) {
                parsed.messageHandlers.forEach(f => {
                    state.addMessageHandler(f);
                });
            }
            return state;
        } catch (e) {
            arch.wrapError(e);
            e.state = st.name;
            e.src = src.name;
            src._errors.push(e);
            return state;
        }
    }
    /**
     * 迭代分析xml结构
     * Function,Struct,EventHandler
     * @param {*} src 
     * @param {*} arch 
     * @returns 
     */
    function _analyze_Architechture(src, arch, rootSrc) {
        if (src.name) {
            arch.setName(src.name);
        }
        let oErrors = rootSrc._errors;
        rootSrc._errors = [];
        try {
            if (src.functions) {
                src.functions.forEach(f => {
                    let functions = parseFunction(f, rootSrc, arch);
                    if (functions) {
                        functions.forEach(func => {
                            arch.addFunction(func);
                        });
                    }
                });
            }
            if (src.structs) {
                src.structs.forEach(st => {
                    let structs = parseStruct(st, rootSrc, arch);
                    if (structs) {
                        structs.forEach(st => {
                            arch.addStruct(st);
                        });
                    }
                });
            }
            if (src.states) {
                src.states.forEach(st => {
                    arch.addState(parseState(st, rootSrc, arch));
                });
            }
            addSubArch(src.variables, arch, arch.addVariable, VariableDeclaration, rootSrc);
            if (src.fsms) {
                src.fsms.forEach(f => { f.type = "fsm" });
                addSubArch(src.fsms, arch, arch.addFSM, FSMDef, rootSrc);
            }
        } finally {
            rootSrc._errors.forEach(e => {
                e[src.type] = src.name;
            });
            rootSrc._errors = oErrors.concat(rootSrc._errors)
        }
        return arch;
    }
    /**
     * 解析源文件语法树
     * @param {源文件} src 
     */
    function _analyze_SrcToLib(src) {
        src._errors = [];
        let module = new ModuleDef();
        module.env = module.env.concat(src.env);
        _analyze_Architechture(src, module, src);
        return module;
    }
    /**
     * 解析 blockly xml
     * @param {*} xml 
     */
    function parseXML(xml, codename) {
        let blocklyfsm = new BlocklyFSM();
        let parsed = {
            functions: [],
            eventHandlers: [],
            structs: [],
            messageHandlers: []
        };
        let typeMap = {
            EventHandlerDef: parsed.eventHandlers,
            MessageHandlerDef: parsed.messageHandlers,
            FunctionDef: parsed.functions,
            StructDef: parsed.structs
        }
        if (xml && xml.length > 0) {
            let parser = new EasySAXParser({ on: blocklyfsm.getListener() });
            parser.parse(xml);
        }
        let blocks = blocklyfsm.rootBlocks;
        if (blocks) {
            blocks.forEach(b => {
                let ast = b.AST();
                if (ast && typeMap[ast.__proto__.constructor.name]) {
                    typeMap[ast.__proto__.constructor.name].push(ast);
                } else {
                    // 忽略随意摆放的块
                    // throw Error('非预期的 ' + ast.__proto__.constructor.name);
                }
            });
        }
        for (let k in parsed) {
            let arr = parsed[k];
            arr.forEach((v) => {
                v.codename = codename;
            });
        }
        parsed.errors = blocklyfsm.errors;
        return parsed;
    }
    /**
     * 建立关联关系(link?)
     * @param {*} r1 
     */
    function _analyze_2(modules) {
        let arr = [];
        modules.forEach(mod => {
            mod.structs.forEach(st => {
                arr.push(st);
            });
        });
        OpenBlock.BlocklyParser.loadedFiles.structs = arr;
    };
    function getStructDefByName(name) {
        return OpenBlock.BlocklyParser.loadedFiles.structs.find(st => {
            return st.fullname === name;
        });
    }
    VFS.partition.src = new VFS(new VFSMemoryCache());
    VFS.partition.src.on('put', (e) => {
        let files = [];
        for (let i = 0; i < e.length; i++) {
            files.push(e[i].content);
        }
        addFiles(files);
    });
    VFS.partition.src.on('delete', (e) => {
        removeFile(e.content.name);
    });
    VFS.partition.src.on('deleteAll', (e) => {
        loadedFiles.srcs.splice(0, loadedFiles.srcs.length);
        OpenBlock.BlocklyParser.updateDepends();
    });
    return {
        loadedFiles,
        // addFiles,
        // removeFile,
        updateDepends,
        analyze,
        getStructDefByName,
        addFilesAddedListener,
        addFilesRemovedListener
    }
})();