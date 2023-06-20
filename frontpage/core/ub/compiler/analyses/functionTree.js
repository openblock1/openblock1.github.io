
class FunctionTreeAnalyser extends Analyser {

    allFunction = new FunctionTreeData();
    fsmFullname() {
        return this.currentModule.name + '.' + this.currentFSM.name;
    }
    visitFunctionStart(f, ctx) {
        super.visitFunctionStart(f, ctx);
        let fname = this.currentFunction.fullname;
        let func = this.allFunction.get(fname);
        if (!func) {
            func = this.allFunction.create(fname, 'function', this.currentFSM ? this.fsmFullname() : false);
        }
    }
    visitEventHandlerStart(code, ctx) {
        super.visitEventHandlerStart(code, ctx);
        let fname = this.currentFunction.fullname;
        let func = this.allFunction.get(fname);
        if (!func) {
            func = this.allFunction.create(fname, 'event', this.fsmFullname());
        }
    }
    visitMessageHandlerStart(code, ctx) {
        super.visitMessageHandlerStart(code, ctx);
        let fname = this.currentFunction.fullname;
        let func = this.allFunction.get(fname);
        if (!func) {
            func = this.allFunction.create(fname, 'message', this.fsmFullname());
        }
    }
    visitCode(code, ctx, fCtx) {
        super.visitCode(code, ctx, fCtx);
        if (code instanceof VoidMethodCall ||
            code instanceof ValueMethodCall ||
            code instanceof VoidNativeCall ||
            code instanceof ValueNativeCall) {
            let fname = this.currentFunction.fullname;
            let func = this.allFunction.get(fname);
            if (!func) {
                func = this.allFunction.create(fname);
            }
            /**
             * @type {String}
             */
            let targetFullname;
            if (code.MethodName) {
                targetFullname = code.MethodName;
                let end = targetFullname.indexOf('(');
                if (end >= 0) {
                    targetFullname = targetFullname.substring(0, end);
                }
                if (targetFullname.startsWith('.')) {
                    targetFullname = this.currentModule.name
                        + (this.currentFSM ? '.' + this.currentFSM.name + '.' + this.currentState.name : '')
                        + targetFullname;
                }
            } else {
                targetFullname = code.func.fullname;
            }
            let path = this.currentFunction.fullname;
            func.add(new FunctionCallItem().init(code, targetFullname, path));
        }
    }

    finish(ctx) {
        ctx.analysed.FunctionTree = this.allFunction.functions;
    }
}