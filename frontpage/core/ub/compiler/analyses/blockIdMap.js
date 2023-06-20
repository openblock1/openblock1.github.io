
class BlockIdMap extends Analyser {
    data = {
    };
    add(code, ctx, fCtx) {
        if (!code.blockId) {
            return;
        }
        let list = this.data[code.blockId];
        if (!list) {
            list = [];
            this.data[code.blockId] = list;
        } else {
            console.log('重复块ID')
        }
        let info = { type: code.__proto__.constructor.name };
        info.module = ctx.currentModule.name;
        if (ctx.currentFSM) {
            info.fsmType = ctx.currentFSM.name;
            info.state = ctx.currentState.name;
        }
        if (fCtx) {
            info.codename = fCtx.funcDef.codename;
            info.fullname = fCtx.funcDef.fullname;
            info.signature = fCtx.funcDef.signature;
        }
        list.push(info);
    }
    visitEventHandlerStart(code, ctx) {
        super.visitEventHandlerStart(code, ctx);
        this.add(code, ctx);
    }

    visitMessageHandlerStart(code, ctx) {
        super.visitMessageHandlerStart(code, ctx);
        this.add(code, ctx);
    }
    visitCode(code, ctx, fCtx) {
        super.visitCode(code, ctx, fCtx);
        this.add(code, ctx, fCtx);
    }
    finish(ctx) {
        ctx.analysed.blockIdMap = this.data;
    }
}