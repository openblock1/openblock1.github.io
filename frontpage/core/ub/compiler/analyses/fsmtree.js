class FsmTreeAnalyser extends Analyser {
    data = {
        fsm: {},
        staticFunctions: {},
    };
    visitStateStart(fsm, ctx) {
        super.visitStateStart(fsm, ctx);
        this.getRecord();
    }
    visitCode(code, ctx, fCtx) {
        super.visitCode(code, ctx, fCtx);
        if (code instanceof CreateFSM) {
            let state = this.getRecord();
            state.points.push(new CreateFSMCMD().init(code));
        }
    }
    getRecord() {
        function get(obj, key) {
            let v = obj[key];
            if (!v) {
                v = {};
                obj[key] = v;
            }
            return v;
        }
        if (this.currentFSM) {
            let fsm = get(this.data.fsm, this.currentFSM.name);
            let state = get(fsm, this.currentState.name);
            if (!state.points) {
                state.points = [];
            }
            return state;
        } else {
            let func = get(this.data.staticFunctions, this.currentFunction.fullname);
            if (!func.points) {
                func.points = [];
            }
            return func;
        }
    }
    finish(ctx) {
        ctx.analysed.FSMCreateTree = this.data;
    }
}