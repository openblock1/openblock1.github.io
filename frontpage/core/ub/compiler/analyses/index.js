/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

class Analyser {
    /**
     * @type {ModuleDef}
     */
    currentModule;
    /**
     * @type {FSMDef}
     */
    currentFSM;
    /**
     * 
     * @param {StateDef} 
     */
    currentState;
    /**
     * @type {FunctionDef}
     */
    currentFunction;
    /**
     * 
     * @param {AST} code 
     * @param {CompileContext} ctx 
     * @param {FunctionContext} fCtx 
     */
    visitCode(code, ctx, fCtx) {
    }

    visitCodeEnd(code, ctx, fctx, register) {
        return register;
    }
    visitModuleStart(m, ctx) {
        this.currentModule = m;
        this.visitStart(m, ctx);
    }
    visitModuleEnd(m, ctx) {
        this.visitEnd(m, ctx);
        this.currentModule = null;
    }

    visitFSMStart(fsm, ctx) {
        this.currentFSM = fsm;
        this.visitStart(fsm, ctx);
    }
    visitFSMEnd(fsm, ctx) {
        this.visitEnd(fsm, ctx);
        this.currentFSM = null;
    }

    visitStateStart(s, ctx) {
        this.currentState = s;
        this.visitStart(s, ctx);
    }
    visitStateEnd(s, ctx) {
        this.visitEnd(s, ctx);
        this.currentState = null;
    }

    visitFunctionStart(f, ctx) {
        this.currentFunction = f;
        this.visitStart(f, ctx);
    }
    visitFunctionEnd(f, ctx) {
        this.visitEnd(f, ctx);
        this.currentFunction = null;
    }

    visitEventHandlerStart(code, ctx) {
        this.currentFunction = code;
        this.visitStart(code, ctx);
    }
    visitEventHandlerEnd(code, ctx) {
        this.visitEnd(code, ctx);
        this.currentFunction = null;
    }

    visitMessageHandlerStart(code, ctx) {
        this.currentFunction = code;
        this.visitStart(code, ctx);
    }
    visitMessageHandlerEnd(code, ctx) {
        this.visitEnd(code, ctx);
        this.currentFunction = null;
    }

    visitStatementStart(code, ctx, fCtx) {
        this.visitStart(code, ctx, fCtx);
    }
    visitStatementEnd(code, ctx, fCtx) {
        this.visitEnd(code, ctx, fCtx);
    }

    visitRepeatTimesStart(l, ctx, fCtx) {
        this.visitStart(l, ctx, fCtx);
    }
    visitRepeatTimesEnd(l, ctx, fCtx) {
        this.visitEnd(l, ctx, fCtx);
    }

    visitIfFlowStart(l, ctx, fCtx) {
        this.visitStart(l, ctx, fCtx);
    }
    visitIfFlowEnd(l, ctx, fCtx) {
        this.visitEnd(l, ctx, fCtx);
    }

    visitWhileUntilLoopStart(l, ctx, fCtx) {
        this.visitStart(l, ctx, fCtx);
    }
    visitWhileUntilLoopEnd(l, ctx, fCtx) {
        this.visitEnd(l, ctx, fCtx);
    }
    visitForLoopStart(l, ctx, fCtx) {
        this.visitStart(l, ctx, fCtx);
    }
    visitForLoopEnd(l, ctx, fCtx) {
        this.visitEnd(l, ctx, fCtx);
    }
    visitStart(arg, ctx, fCtx) { }
    visitEnd(arg, ctx, fCtx) { }
    finish() { }
}
class RootAnalyser extends Analyser {
    /**
     * @type {AST[]}
     */
    codeStack = [];
    /**
     * @type {Analyser[]}
     */
    analyserList;
    /**
     * @type {CompileContext}
     */
    compileContext;
    /**
     * 
     * @param {Analyser[]} analyserList 
     * @param {CompileContext} context 
     */
    constructor(analyserList, context) {
        super();
        this.analyserList = analyserList;
        this.compileContext = context;
        this.debug = context.options.debug;
    }

    _writeDebugInfoStart(code, ctx, fCtx) {
        if (this.debug && code.blockId) {
            // if (!code.blockId) {
            //     debugger
            // }
            // 这个功能为debug用，不是语法指令，不需要统计分析
            let idx = ctx.buildRelocationInfo('string', code.blockId);
            let pos = ctx.getWritingDataIdx();
            idx.idx = pos;
            ctx.pushData(new B_DBI(code, ctx, fCtx, idx));
        }
    }
    _writeDebugInfoEnd(code, ctx, fCtx, targetRegister) {
        if (this.debug && (code instanceof Expr)) {
            // if (!code.blockId) {
            //     debugger
            // }
            let code1 = this.codeStack[0];
            if (!(code1 && code1.blockId)) {
                return targetRegister;
            }
            let idx = ctx.buildRelocationInfo('string', code1.blockId);
            let pos = ctx.getWritingDataIdx();
            idx.idx = pos;
            let e = new B_ExtInfo(code, ctx, fCtx, idx);
            ctx.pushData(e);
            let b = new B_DBE(code, ctx, fCtx);
            let reg = fCtx.getRegister(targetRegister.rtype, targetRegister.astType);
            b.register = reg;
            b.targetRegister = targetRegister;
            ctx.pushData(b);

            reg.return1 = reg.return;
            reg.return = function () {
                reg.return1();
                targetRegister.return();
            }

            return reg;
        }
        return targetRegister;
    }
    visitCode(code, ctx, fCtx) {
        super.visitCode(code, ctx, fCtx);
        this.codeStack.unshift(code);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitCode(code, ctx, fCtx);
        }
        this._writeDebugInfoStart(code, ctx, fCtx);
    }
    visitCodeEnd(code, ctx, fCtx, register) {
        let v = super.visitCodeEnd(code, ctx, fCtx, register);
        this.codeStack.shift();
        v = this._writeDebugInfoEnd(code, ctx, fCtx, v);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            v = analyser.visitCodeEnd(code, ctx, fCtx, v);
        }
        return v;
    }

    visitModuleStart(m, ctx) {
        super.visitModuleStart(m, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitModuleStart(m, ctx);
        }
    }
    visitModuleEnd(m, ctx) {
        super.visitModuleEnd(m, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitModuleEnd(m, ctx);
        }
    }

    visitFSMStart(fsm, ctx) {
        super.visitFSMStart(fsm, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitFSMStart(fsm, ctx);
        }
    }
    visitFSMEnd(fsm, ctx) {
        super.visitFSMEnd(fsm, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitFSMEnd(fsm, ctx);
        }
    }

    visitStateStart(s, ctx) {
        super.visitStateStart(s, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitStateStart(s, ctx);
        }
    }
    visitStateEnd(s, ctx) {
        super.visitStateEnd(s, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitStateEnd(s, ctx);
        }
    }

    visitFunctionStart(f, ctx) {
        super.visitFunctionStart(f, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitFunctionStart(f, ctx);
        }
    }
    visitFunctionEnd(f, ctx) {
        super.visitFunctionEnd(f, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitFunctionEnd(f, ctx);
        }
    }

    visitEventHandlerStart(code, ctx) {
        super.visitEventHandlerStart(code, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitEventHandlerStart(code, ctx);
        }
    }
    visitEventHandlerEnd(code, ctx) {
        super.visitEventHandlerEnd(code, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitEventHandlerEnd(code, ctx);
        }
    }

    visitMessageHandlerStart(code, ctx) {
        super.visitMessageHandlerStart(code, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitMessageHandlerStart(code, ctx);
        }
    }
    visitMessageHandlerEnd(code, ctx) {
        super.visitMessageHandlerEnd(code, ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitMessageHandlerEnd(code, ctx);
        }
    }

    visitStatementStart(code, ctx, fCtx) {
        super.visitStatementStart(code, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitStatementStart(code, ctx, fCtx);
        }
    }
    visitStatementEnd(code, ctx, fCtx) {
        super.visitStatementEnd(code, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitStatementEnd(code, ctx, fCtx);
        }
    }

    visitRepeatTimesStart(l, ctx, fCtx) {
        super.visitRepeatTimesStart(l, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitRepeatTimesStart(l, ctx, fCtx);
        }
    }
    visitRepeatTimesEnd(l, ctx, fCtx) {
        super.visitRepeatTimesEnd(l, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitRepeatTimesEnd(l, ctx, fCtx);
        }
    }

    visitIfFlowStart(l, ctx, fCtx) {
        super.visitIfFlowStart(l, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitIfFlowStart(l, ctx, fCtx);
        }
    }
    visitIfFlowEnd(l, ctx, fCtx) {
        super.visitIfFlowEnd(l, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitIfFlowEnd(l, ctx, fCtx);
        }
    }

    visitForLoopStart(l, ctx, fCtx) {
        super.visitForLoopStart(l, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitForLoopStart(l, ctx, fCtx);
        }
    }
    visitForLoopEnd(l, ctx, fCtx) {
        super.visitForLoopEnd(l, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitForLoopEnd(l, ctx, fCtx);
        }
    }
    visitWhileUntilLoopStart(l, ctx, fCtx) {
        super.visitWhileUntilLoopStart(l, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitWhileUntilLoopStart(l, ctx, fCtx);
        }
    }
    visitWhileUntilLoopEnd(l, ctx, fCtx) {
        super.visitWhileUntilLoopEnd(l, ctx, fCtx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.visitWhileUntilLoopEnd(l, ctx, fCtx);
        }
    }
    finish(ctx) {
        super.finish(ctx);
        for (let i = 0; i < this.analyserList.length; i++) {
            let analyser = this.analyserList[i];
            analyser.finish(ctx);
        }
    }
}