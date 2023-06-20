/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

class StateAnalyser extends Analyser {
    // /**
    //  * @type {Object.<string,StateAnalysesResultModule>}
    //  */
    // modules = {
    // };
    /**
     * @type {StateAnalysesResultModule};
     */
    currModule;
    /**
     * @type {StateAnalysesResultFSM}
     */
    currFSM;
    /**
     * @type {StateAnalysesResultState}
     */
    currState;
    // currFunc;
    // currEvent;
    // currMessage;
    /**
     * @type {StateAnalysesResultFunction}
     */
    currCtx;
    /**
     * @type {Error[]}
     */
    errors = [];

    visitCode(code, ctx, fCtx) {
        if (code instanceof ChangeState ||
            code instanceof PushState) {
            this.currCtx.targetStates.push(code);
        } else if (code instanceof VoidMethodCall ||
            code instanceof ValueMethodCall) {
            this.currCtx.targetFunc.push(code.MethodName);
        } else if (code instanceof PopState) {
            this.currCtx.popBack = true;
            this.currState.popBack = true;
        }
        super.visitCode(code, ctx, fCtx);
    }

    visitModuleStart(m, ctx) {
        this.currModule = new StateAnalysesResultModule();
        this.currModule.name = m.name;
        super.visitModuleStart(m, ctx);
    }
    visitModuleEnd(m, ctx) {
        super.visitModuleEnd(m, ctx);
    }
    visitFSMStart(fsm, ctx) {
        this.currFSM = new StateAnalysesResultFSM();
        this.currFSM.name = fsm.name;
        this.currModule.fsm[fsm.name] = this.currFSM;
        super.visitFSMStart(fsm, ctx);
    }
    visitFSMEnd(fsm, ctx) {
        this.currFSM = null;
        super.visitFSMEnd(fsm, ctx);
    }
    visitStateStart(s, ctx) {
        this.currState = new StateAnalysesResultState();
        this.currState.name = s.name;
        this.currFSM.states[s.name] = this.currState;
        super.visitStateStart(s, ctx);
    }
    visitStateEnd(s, ctx) {
        let state = this.currState;
        /**
         * @this  {StateAnalysesResultEventHandler|StateAnalysesResultMessageHandler} 
         * @param {ChangeState} cmd
         */
        let addState = function (cmd) {
            let idx = state.relevantStates.findIndex(v => v === cmd.targetStateName);
            if (idx === -1) {
                state.relevantStates.push(cmd.targetStateName);
            }
            let idx1 = this.relevantStates.findIndex(v => v === cmd.targetStateName);
            if (idx1 === -1) {
                this.relevantStates.push(cmd.targetStateName);
            }
        };
        /**
         * @this {StateAnalysesResultEventHandler|StateAnalysesResultMessageHandler} 
         * @param {String} funName 
         */
        function funcHandler(funName) {
            if (funName.startsWith('.')) {//只处理作用域内的函数，超出作用域的不会触发跳转指令
                let func = state.function.find(f => "." + f.name === funName);
                if (func && !func.stateAnalysed) {
                    func.stateAnalysed = true;
                    func.targetStates.forEach(addState, this);
                    func.targetFunc.forEach(funcHandler, this);
                }
            }
        };
        /**
         * 
         * @param {StateAnalysesResultEventHandler|StateAnalysesResultMessageHandler} ele 
         */
        function handler(ele) {
            ele.targetStates.forEach(addState, ele);
            ele.targetFunc.forEach(funcHandler, ele);
        };
        state.event.forEach(handler);
        state.message.forEach(handler);
        this.currState = null;
        super.visitStateEnd(s, ctx);
    }
    visitFunctionStart(f, ctx) {
        if (!this.currFSM) {
            this.errors.push(Error("no fsm"));
        }
        this.currCtx = new StateAnalysesResultFunction();
        this.currCtx.name = f.name;
        super.visitFunctionStart(f, ctx);
    }
    visitFunctionEnd(f, ctx) {
        this.finishCtx();
        super.visitFunctionEnd(f, ctx);
    }

    visitEventHandlerStart(code, ctx) {
        if (!this.currFSM) {
            this.errors.push(Error("no fsm"));
        }
        this.currCtx = new StateAnalysesResultEventHandler();
        this.currCtx.name = code.name;
        super.visitEventHandlerStart(code, ctx);
    }
    visitEventHandlerEnd(code, ctx) {
        this.finishCtx();
        super.visitEventHandlerEnd(code, ctx);
    }

    visitMessageHandlerStart(code, ctx) {
        if (!this.currFSM) {
            this.errors.push(Error("no fsm"));
        }
        this.currCtx = new StateAnalysesResultMessageHandler();
        this.currCtx.name = code.name;
        super.visitMessageHandlerStart(code, ctx);
    }
    visitMessageHandlerEnd(code, ctx) {
        this.finishCtx();
        super.visitMessageHandlerEnd(code, ctx);
    }

    finishCtx() {
        if (this.currState) {
            this.currState[this.currCtx.type()].push(this.currCtx);
        }
        this.currCtx = null;
    }
    finish(ctx) {
        ctx.analysed.StateTransition = this.currModule;
    }
}