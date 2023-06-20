/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

var OpenBlock = {};
importScripts('AST/SObject/Serializable.js');
importScripts('AST/ModuleAST.js');
importScripts('ASTCompiler.js');
importScripts('analyses/index.js');
importScripts('analyses/stateData.js');
importScripts('analyses/state.js');
importScripts('analyses/fsmtree.js');
importScripts('analyses/fsmtreeData.js');
importScripts('analyses/functionTree.js');
importScripts('analyses/functionTreeData.js');
importScripts('analyses/blockIdMap.js');
class Data { }
class Instruct extends Data {
    ast; ctx; fCtx; module; FSM; state;
    static CODE(i) {
        return i << 24;
    }
    constructor(ast, ctx, fCtx) {
        super();
        if (!ctx) {
            throw Error('no ctx.');
        }
        this.ast = ast;
        this.ctx = ctx;
        this.fCtx = fCtx;
        this.module = ctx.currentModule;
        this.FSM = ctx.currentFSM;
        this.state = ctx.currentState;
    }
    throwError(msg) {
        if (this.ast) {
            this.ctx.markError(this.ast.blockId, this.fCtx, msg, this.module, this.FSM, this.state);
        }
    }
}
class Offset extends Data {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    toU32() {
        return this.value;
    }
}
class StringIdx extends Data {
    idx;
    str;
    constructor(str) {
        super();
        this.str = str;
    }
    updateRelocation(ctx) {
        let arr = ctx.relocation.string[this.str];
        if (!arr) {
            arr = [];
            ctx.relocation.string[this.str] = arr;
        }
        arr.push(this);
    }
    toU32() {
        return this.idx;
    }
}
class FloatIdx extends Data {
    idx;
    value;
    constructor(v) {
        super();
        this.value = v;
    }
    updateRelocation(ctx) {
        let arr = ctx.relocation.float[this.value];
        if (!arr) {
            arr = [];
            ctx.relocation.float[this.value] = arr;
        }
        arr.push(this);
    }
    toU32() {
        return this.idx;
    }
}
class IntegerIdx extends Data {
    idx;
    value;
    constructor(v) {
        super();
        this.value = v;
    }
    updateRelocation(ctx) {
        let arr = ctx.relocation.integer[this.value];
        if (!arr) {
            arr = [];
            ctx.relocation.integer[this.value] = arr;
        }
        arr.push(this);
    }
    toU32() {
        return this.idx;
    }
}
class StructFieldIndex extends Data {
    idx;
    value;
    constructor(v) {
        super();
        this.value = v;
    }
    updateRelocation(ctx) {
        let arr = ctx.relocation.structFieldIndex[this.value];
        if (!arr) {
            arr = [];
            ctx.relocation.structFieldIndex[this.value] = arr;
        }
        arr.push(this);
    }
    toU32() {
        return this.idx;
    }
}
class BinIdx extends Data {
    idx;
    value;
    constructor(v) {
        super();
        this.value = v;
    }
    updateRelocation(ctx) {
        let binarr = ctx.relocation.bin;
        let record = binarr.find(b => {
            if (b.value.length != this.value.length) {
                return false;
            }
            for (let i = 0; i < b.value.length; i++) {
                if (b[i] !== this.value[i]) {
                    return false;
                }
            }
            return true;
        });
        if (!record) {
            record = { value: this.value, idxList: [] };
            binarr.push(record);
        }
        // 为了尽早释放重复的内存数据
        this.value = record.value;
        record.idxList.push(this);
    }
    toU32() {
        return this.idx;
    }
}
class IntegerData extends Data {
    integer;
    constructor(i) {
        super();
        this.integer = i;
    }
    toU32() {
        return this.integer;
    }
}
Serializable(IntegerData);

class RegisterHandler {
    arr;
    i;
    rtype;
    name;
    blockId;
    sn;
    constructor(arr, i, rtype, blockId) {
        this.arr = arr;
        this.i = i;
        this.rtype = rtype;
        this.blockId = blockId
    }
    return() {
        if (this.arr[this.i] === this) {
            this.arr[this.i] = null;
        } else {
            throw Error('internal error');
        }
    }
    is(rtype) {
        return rtype === this.rtype;
    }
    getTypeId() {
        return OpenBlock.getTypeIdByName(this.rtype);
    }
}
class CompileError {
    src;
    state;
    fsm;
    func;
    blockId;
    message;
}
class CompileContext {
    analyser;
    /**
     * @type {Object.<string,Object>}
     */
    analysed = {};
    data = [];
    nativeLibs = [];
    relocation = {
        string: {},
        float: {},
        integer: {},
        bin: [],
        structFieldIndex: {}
    };
    export = {
        fsms: {},
        functions: {},
        structs: {}
    };
    localoffset = {};
    header = {};
    ast;
    errors = [];
    structs = [];

    loopStack = [];

    constructor(options) {
        this.options = Object.assign({}, options);
        let analysers = [new FunctionTreeAnalyser(), new StateAnalyser(), new FsmTreeAnalyser(),new BlockIdMap()];
        this.analyser = new RootAnalyser(analysers, this);
    }
    /**
     * 
     * @param {fCtx} f
     * @param {string} msg 
     */
    markError(blockId, f, msg, module, FSM, state) {
        module = module || this.currentModule;
        FSM = FSM || this.currentFSM;
        state = state || this.currentState;
        let e = new CompileError();
        if (FSM) {
            e.fsm = FSM.name;
        }
        if (state) {
            e.state = state.name;
        }
        e.src = module.name;
        if (f && f.funcDef) {
            e.func = f.funcDef.name;
        } else if (f) {
            e.func = f.name;
        }
        e.blockId = blockId;
        e.message = msg;
        this.errors.push(e);
    }
    startLoop() {
        this.loopStack.push({ continue_: [], break_: [] });
    }
    markContinue(br) {
        if ((br instanceof B_BR) || (br instanceof B_BRIF) || (br instanceof B_BRIFN)) {
            this.loopStack[this.loopStack.length - 1].continue_.push(br);
        } else {
            throw Error('');
        }
    }
    markBreak(br) {
        if ((br instanceof B_BR) || (br instanceof B_BRIF) || (br instanceof B_BRIFN)) {
            this.loopStack[this.loopStack.length - 1].break_.push(br);
        } else {
            throw Error('');
        }
    }
    endLoop(continueEntry, breakEntry) {
        let stack = this.loopStack.pop();
        stack.continue_.forEach(br => { br.targetOffset = continueEntry });
        stack.break_.forEach(br => { br.targetOffset = breakEntry });
    }
    addNativeLib(libname, libhash) {
        if (libname === "" && libhash === "") {
            // buildin
            return;
        }
        let lib = this.nativeLibs.find(l => l.libname === libname);
        if (lib) {
            if (libhash != lib.libhash) {
                throw Error("使用了不同版本的本地库：" + libname);
            }
        } else {
            this.nativeLibs.push({ libname, libhash })
        }
    }
    buildRelocationInfo(type, value) {
        if (typeof (value) === 'undefined') {
            throw Error('value is undefined');
        }
        let idx;
        switch (type) {
            case 'string':
                idx = new StringIdx(value);
                break;
            case 'float':
                idx = new FloatIdx(value);
                break;
            case 'integer':
                idx = new IntegerIdx(value);
                break;
            case 'bin':
                idx = new BinIdx(value);
                break;
            case 'structFieldIndex':
                idx = new StructFieldIndex(value);
                break;
            default:
                throw Error('Can\'t handle type ' + type);
        }
        idx.updateRelocation(this);
        return idx;
    }
    pushData(data) {
        this.data.push(data);
    }
    getWritingDataIdx() {
        return this.data.length;
    }
    writeDebugInfo(ast, fCtx) {
        if (this.options.debug) {
            let idx = this.buildRelocationInfo('string', ast.blockId);
            let bc = new B_DebugInstruct(ast, this, fCtx, idx);
            this.pushData(bc);
        }
    };
}
importScripts('bitcode.js');

function compile(ctx) {
    let ast = ctx.ast;
    ast.compile(ctx);
    ctx.analyser.finish(ctx);
    let bin = [];
    ctx.data.forEach(inst => {
        let u32 = inst.toU32(ctx);
        bin.push(u32);
    });
    ctx.bin = bin;
}
self.onmessage = function (msg) {
    let data = msg.data;
    let request = data.request;
    let ast = JSON.parse(request.str_ast, Deserializer);
    OpenBlock.nativeTypes = request.nativeTypes;
    let ctx = new CompileContext(request.options);
    ctx.ast = ast;
    // console.log(ast);
    try {
        compile(ctx);
        let m = {
            callbackSN: msg.data.callbackSN
        };
        // 为了性能，减少一次复制
        let bin;
        if (ctx.errors.length === 0) {
            bin = new Uint32Array(ctx.bin).buffer
        }
        m.data = {
            export: JSON.stringify(ctx.export),//ctx.export,
            header: ctx.header,
            relocation: ctx.relocation,
            bin: bin,
            errors: ctx.errors,
            nativeLibs: ctx.nativeLibs,
            analysed: JSON.stringify(ctx.analysed)
        };
        self.postMessage(m, bin ? [bin] : null);
    } catch (e) {
        console.error(e);
        self.postMessage({
            error: e,
            callbackSN: msg.data.callbackSN
        });
    } finally {
        setTimeout(() => {
            close();
        }, 0000);
    }
};