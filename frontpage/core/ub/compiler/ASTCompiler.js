/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

(function () {
    function astType2BitcodeType(astType) {
        if (!astType) {
            return null;
        }
        if (OpenBlock.nativeTypes[astType]) {
            return "Nobject";
        }
        switch (astType) {
            case 'Number':
            case 'float':
                return 'float';
            case 'integer':
            case 'Integer':
            case 'Colour':
                return 'integer';
            case 'String':
            case 'string':
                return 'string';
            case 'Boolean':
            case 'boolean':
                return 'integer';
            case 'FSM':
                return "Nobject";
            case 'object':
            case 'Object':
                return 'object';
            default:
                return 'object';
        }
    }
    function integer2float(register, ctx, fCtx, block) {
        if (!block) {
            throw Error('block');
        }
        if (register.getTypeId() === 0) {
            let r = fCtx.getRegister('float');
            let ast = new B_I2F(block, ctx, fCtx, register, r);
            ctx.pushData(ast);
            register.return();
            return r;
        }
        else {
            return register;
        }
    }
    function float2integer(register, ctx, fCtx, block) {
        if (!block) {
            throw Error('block');
        }
        if (register.getTypeId() === 1) {
            let r = fCtx.getRegister('integer');
            let ast = new B_F2I(block, ctx, fCtx, register, r);
            ctx.pushData(ast);
            register.return();
            return r;
        }
        else if (register.getTypeId() === 0) {
            return register;
        } else if (register.getTypeId() != 0) {
            throw Error(`无法将${register.rtype}转换成整数`);
        }
    }
    function sameType(reg1, reg2, errmsg) {
        if (reg1.getTypeId() !== reg2.getTypeId()) {
            throw errmsg;
        }
    }
    function comparableNumber(ctx, fCtx, leftInfo, rightInfo, throwError) {
        let leftId = leftInfo.getTypeId();
        let rightId = rightInfo.getTypeId();
        if (leftId > 1 || leftId < 0 || rightId > 1 || rightId < 0) {
            if (throwError) {
                throw '参数必须为数字';
            } else {
                return;
            }
        }
        if (leftId === 0 && rightId === 1) {
            return { leftInfo: integer2float(leftInfo, ctx, fCtx, this), rightInfo };
        } else if (leftId === 1 && rightId === 0) {
            return { leftInfo, rightInfo: integer2float(rightInfo, ctx, fCtx, this) };
        } else {
            return { leftInfo, rightInfo };
        }
    }
    function compileArray(arr, infoArr, ctx, self, name) {
        // 局部函数预扫，补充省略的符号信息
        arr.forEach(function (a) {
            if (a.genSignature) {
                let signature = a.genSignature(self, ctx);
                if (name === 'functions') {
                    ctx.export.functions[signature] = a;
                    // {
                    //     name: a.name,
                    //     fullname: a.fullname,
                    //     signature,
                    //     returnType: a.returnType,
                    //     args: a.args
                    // };
                }
            }
        });
        arr.forEach(function (a) {
            if (infoArr[a.name]) {
                throw Error('函数重名：' + a.name);
            }
            let aoffset = a.compile(ctx, this);
            infoArr[a.name] = aoffset;
        });
    }
    function compileVariables(arr, infoArr, ctx) {
        arr.forEach(function (a) {
            // let aoffset = a.compile(ctx, this);
            // infoArr[a.type] = aoffset;
            let type = astType2BitcodeType(a.type);
            a.registerType = type;
            if (typeof (infoArr[type]) === 'undefined') {
                infoArr[type] = 1;
                a.registerIdx = 0;
            } else {
                let idx = infoArr[type]++;
                a.registerIdx = idx;
            }
        });
    }
    function pushVariables(info, ctx) {
        let keys = Object.keys(info);
        ctx.pushData(new IntegerData(keys.length));
        keys.forEach(rtype => {
            let rtypeid = OpenBlock.getTypeIdByName(rtype);
            let cnt = info[rtype];
            if (cnt > 0xFFFFFFF) {
                throw Error("too much variables");
            }
            if (rtypeid > 0xF) {
                throw Error("rtypeid too long");
            }
            let vari = rtypeid << 28 | cnt;
            ctx.pushData(new IntegerData(vari));
        });
    }
    function pushOffsetOfMap(arr, ctx) {
        let keys = Object.keys(arr);
        ctx.pushData(new IntegerData(keys.length));
        keys.forEach((a) => {
            ctx.pushData(new Offset(arr[a]));
        });
    }
    function compileArch(self, nameArr, ctx) {
        let headeridx = new IntegerData();
        ctx.pushData(headeridx);
        let info = {};
        nameArr.forEach(name => {
            info[name] = {};
            if (name === 'variables') {
                compileVariables(self[name], info[name], ctx);
            } else {
                compileArray(self[name], info[name], ctx, self, name);
            }
        });
        let idx = ctx.buildRelocationInfo('string', self.name);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;
        headeridx.integer = pos;
        ctx.pushData(idx);

        nameArr.forEach(name => {
            if (name === 'variables') {
                pushVariables(info[name], ctx);
            } else {
                pushOffsetOfMap(info[name], ctx);
            }
        });
        return pos;
    }
    AST.prototype.compile = function () {
        throw Error(this.constructor.name + ('没有实现compile方法'));
    };
    Dummy.prototype.compile = function () {
    };
    ModuleDef.prototype.compile = function (ctx) {
        Object.assign(ctx.header, {
            env: this.env,
            name: this.name
        });
        let lastModule = ctx.currentModule;
        ctx.currentModule = this;
        ctx.analyser.visitModuleStart(this, ctx);
        let length = new IntegerData();
        ctx.pushData(length);
        let pos = ctx.getWritingDataIdx();
        // 从Module开始，到ModuleHeader的偏移
        let i = compileArch(this, ['functions', 'fsms'], ctx);
        this.fsms.forEach(fsm => {
            let fullname = fsm.fullname(ctx);
            if (ctx.export.fsms[fullname]) {
                ctx.markError(f.blockId, ctx, '状态机类型重名:' + f.name);
            }
            ctx.export.fsms[fullname] = { name: fsm.name, fullname };
        });
        // this.functions.forEach(f => {
        //     let fullname = f.fullname;
        //     if (ctx.export.functions[f.name]) {
        //         ctx.markError(f.blockId, ctx, '重名函数' + f.name);
        //     }
        //     ctx.export.functions[fullname] = { name: f.name, fullname };
        // });
        let structsInfo = {};
        this.structs.forEach(st => {
            st.compile(structsInfo);
        });
        ctx.export.structs = structsInfo;
        length.integer = ctx.getWritingDataIdx() - pos;
        ctx.analyser.visitModuleEnd(this, ctx);
        ctx.currentModule = lastModule;
        return i;
    };
    FSMDef.prototype.compile = function (ctx) {
        let lastFSM = ctx.currentFSM;
        ctx.currentFSM = this;
        ctx.analyser.visitFSMStart(this, ctx);
        if (ctx.export.fsms[this.name]) {
            throw Error('Dup FSM:' + this.name);
        }
        let offset = compileArch(this, ['variables', 'functions', 'states'], ctx);
        let startStateName = this.states[0].name;
        let idx = ctx.buildRelocationInfo('string', startStateName);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;
        ctx.pushData(idx);
        ctx.analyser.visitFSMEnd(this, ctx);
        ctx.currentFSM = lastFSM;
        return offset;
    };
    StateDef.prototype.compile = function (ctx) {
        let lastState = ctx.currentState;

        ctx.analyser.visitStateStart(this, ctx);
        ctx.currentState = this;
        let r = compileArch(this, ['variables', 'functions', 'messageHandlers', 'eventHandlers'], ctx);
        ctx.analyser.visitStateEnd(this, ctx);
        ctx.currentState = lastState;
        return r;
    };

    class FunctionContext {
        static SN = 0;
        registers = {
            float: [],
            integer: [],
            string: [],
            object: [],
            Nobject: []
        }
        localVariables = {
            float: [],
            integer: [],
            string: [],
            object: [],
            Nobject: []
        };
        namedLocalVariables = {};
        offset;
        funcDef;
        constructor(funcDef) {
            this.funcDef = funcDef;
        }
        checkRegistersClean() {
            for (let k in this.registers) {
                let registerlist = this.registers[k];
                // console.log('register count:' + registerlist.length + ' ' + this.funcDef.signature);
                if (registerlist) {
                    if (registerlist.find(v => v)) {
                        console.error('寄存器未归还', registerlist)
                        // debugger;
                    }
                }
            }
        }
        getVarInfoByVarName(name) {
            return this.namedLocalVariables[name];
        }
        createLocalVarByVarDecl(type, varDecl) {
            this.createLocalVar(type, { name: varDecl.name, blockId: varDecl.blockId, structType: varDecl.type });
        }
        removeLocalVar(name) {
            delete this.namedLocalVariables[name];
        }
        createLocalVar(type, decl) {
            if (type === 'object' && !(decl && decl.structType)) {
                debugger
                throw Error('object类型变量必须提供structType');
            }
            if (decl && decl.name && this.namedLocalVariables[decl.name]) {
                throw Error(decl.name + ' 变量已存在 ' + "：" + + decl.blockId + "," + this.namedLocalVariables[decl.name].decl.blockId);
            }
            let arr;
            if (type) {
                arr = this.localVariables[type];
            } else {
                throw Error('必须明确数据类型');
            }
            if (!arr) {
                throw Error('no register typed ' + type);
            }
            for (let i = 0; i < arr.length; i++) {
                if (!arr[i]) {
                    let r = new RegisterHandler(arr, i, type, decl.blockId);
                    arr[i] = r;
                    if (decl && decl.name) {
                        this.namedLocalVariables[decl.name] = { register: r, decl: decl };
                    }
                    return r;
                }
            }
            let r = new RegisterHandler(arr, arr.length, type, decl.blockId);
            arr.push(r);

            if (decl && decl.name) {
                this.namedLocalVariables[decl.name] = { register: r, decl: decl };
            }
            return r;
        }
        /**
         * 
         * @param {String} register type 
         * @param {String} astType 
         * @returns 
         */
        getRegister(type, astType) {
            let sn = FunctionContext.SN++;
            if (type === 'object' && !astType) {
                throw Error('object类型需要提供 AST Type 参数');
            }
            if (type === 'Nobject' && !astType) {
                throw Error('Nobject类型需要提供 AST Type 参数');
            }
            let arr = this.registers[type];
            if (!arr) {
                throw Error('no register typed ' + type);
            }
            for (let i = 0; i < arr.length; i++) {
                if (!arr[i]) {
                    let r = new RegisterHandler(arr, i, type);
                    r.sn = sn;
                    r.caller = new Error().stack;
                    arr[i] = r;
                    if (type === 'object') {
                        r.astType = astType;
                    } else if (type === 'Nobject') {
                        r.astType = astType;
                    } else {
                        r.astType = null;
                    }
                    return r;
                }
            }
            let r = new RegisterHandler(arr, arr.length, type);
            r.sn = sn;
            r.caller = new Error().stack;
            if (type === 'object') {
                r.astType = astType;
            } else if (type === 'Nobject') {
                r.astType = astType;
            }
            arr.push(r);
            return r;
        }
        writeHeader(ctx) {
            this.headerPrt = new Offset(ctx.getWritingDataIdx() + 1);
            ctx.pushData(this.headerPrt);
        }
        begin(ctx) {
            // 声明参数为局部变量
            // this.funcDef.args[0].type.toCodeText()
            this.funcDef.args.forEach(arg => {
                let typeCode = arg.type.toCodeText();
                let btype = astType2BitcodeType(typeCode);
                this.createLocalVar(btype, { name: arg.name, blockId: arg.blockId, structType: typeCode });
            });
            this.writeHeader(ctx);
        }
        end(ctx) {
            let headerIdx = ctx.getWritingDataIdx();
            let nameidx = ctx.buildRelocationInfo('string', this.funcDef.getSignature());
            let namepos = ctx.getWritingDataIdx();
            nameidx.idx = namepos;
            ctx.pushData(nameidx);
            ctx.pushData(new IntegerData(this.registers.integer.length));
            ctx.pushData(new IntegerData(this.registers.float.length));
            ctx.pushData(new IntegerData(this.registers.string.length));
            ctx.pushData(new IntegerData(this.registers.object.length));
            ctx.pushData(new IntegerData(this.registers.Nobject.length));
            ctx.pushData(new IntegerData(this.localVariables.integer.length));
            ctx.pushData(new IntegerData(this.localVariables.float.length));
            ctx.pushData(new IntegerData(this.localVariables.string.length));
            ctx.pushData(new IntegerData(this.localVariables.object.length));
            ctx.pushData(new IntegerData(this.localVariables.Nobject.length));
            let statementlength = namepos - this.headerPrt.value;
            ctx.pushData(new IntegerData(statementlength));
            this.headerPrt.value = headerIdx;
        }
        compile(ctx) {
            let offset = ctx.getWritingDataIdx();
            this.ctx = ctx;
            this.begin(ctx);
            let body = this.funcDef.body;
            let alive = body.aliveAnalyzer(ctx, this);
            if (!alive) {
                ctx.markError(this.funcDef.blockId, this, "不是所有的路径都返回值");
            }
            body.compile(ctx, this);
            this.checkRegistersClean();
            this.end(ctx);
            return offset;
        }
    }
    FunctionDef.prototype.compile = function (ctx) {
        let offset = ctx.getWritingDataIdx();
        try {
            this.visitStart(ctx);
            this.compileBody(ctx);
            this.visitEnd(ctx);
        } catch (e) {
            ctx.markError(this.blockId, this, e);
        }
        return offset;

    };
    FunctionDef.prototype.compileBody = function (ctx) {
        let fCtx = new FunctionContext(this);
        fCtx.compile(ctx);
    };
    FunctionDef.prototype.visitStart = function (ctx) {
        ctx.analyser.visitFunctionStart(this, ctx);
    }
    FunctionDef.prototype.visitEnd = function (ctx) {
        ctx.analyser.visitFunctionEnd(this, ctx);
    }
    FunctionDef.prototype.getSignature = function () {
        return this.signature;
    };
    EventHandlerDef.prototype.getSignature = function () {
        return this.name;
    };
    EventHandlerDef.prototype.visitStart = function (ctx) {
        ctx.analyser.visitEventHandlerStart(this, ctx);
    }
    EventHandlerDef.prototype.visitEnd = function (ctx) {
        ctx.analyser.visitEventHandlerEnd(this, ctx);
    }
    MessageHandlerDef.prototype.getSignature = function () {
        return this.name;
    };
    MessageHandlerDef.prototype.visitStart = function (ctx) {
        ctx.analyser.visitMessageHandlerStart(this, ctx);
    }
    MessageHandlerDef.prototype.visitEnd = function (ctx) {
        ctx.analyser.visitMessageHandlerEnd(this, ctx);
    }
    StatementDef.prototype.aliveAnalyzer = function (ctx, fCtx) {
        if (!fCtx.funcDef.returnType) {
            return true;
        }
        let instructions = this.instructions;
        if (instructions.length === 0) {
            return false;
        }
        let last = instructions[instructions.length - 1];
        if (last instanceof Return) {
            return true;
        }
        for (let i = instructions.length - 1; i >= 0; i--) {
            let inst = instructions[i];
            if (inst.aliveAnalyzer) {
                let alive = inst.aliveAnalyzer(ctx, fCtx);
                if (alive) {
                    return true;
                }
            }
        }
        return false;
    }
    StatementDef.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitStatementStart(this, ctx, fCtx);
        this.variables.forEach(v => {
            try {
                let regType = astType2BitcodeType(v.type);
                fCtx.createLocalVarByVarDecl(regType, v);
            } catch (e) {
                ctx.markError(v.blockId, fCtx, e);
            }
        });
        let offset = ctx.getWritingDataIdx();
        // ctx.pushData(new B_STMT_start());
        this.instructions.forEach(a => {
            if (!a.compile) {
                console.log('no compile:');
                console.log(a);
                debugger
            }
            try {
                a.compile(ctx, fCtx);
            } catch (e) {
                ctx.markError(a.blockId, fCtx, e);
            }
        });
        // ctx.pushData(new B_STMT_end());
        ctx.analyser.visitStatementEnd(this, ctx, fCtx);
        return offset;
    };
    LOG.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let retInfo = this.expr.compile(ctx, fCtx);
        let inst = new B_PRT(this, ctx, fCtx);
        inst.argRegister = (retInfo);
        ctx.pushData(inst);
        retInfo.return();
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    MathSingle.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let value = this.value.compile(ctx, fCtx);
        let opcode = 0;
        switch (this.op) {
            case "NEG":
                opcode = 0;
                break;
            case "LN":
                opcode = 1;
                break;
            case "LOG10":
                opcode = 2;
                break;
            case "EXP":
                opcode = 3;
                break;
            case "POW10":
                opcode = 4;
                break;
            case "ROOT":
                opcode = 5;
                break;
            case "ABS":
                opcode = 6;
                break;
            case "SIN":
                opcode = 7;
                break;
            case "COS":
                opcode = 8;
                break;
            case "TAN":
                opcode = 9;
                break;
            case "ASIN":
                opcode = 10;
                break;
            case "ACOS":
                opcode = 11;
                break;
            case "ATAN":
                opcode = 12;
                break;
            case "ROUND":
                opcode = 13;
                break;
            case "ROUNDUP":
                opcode = 14;
                break;
            case "ROUNDDOWN":
                opcode = 15;
                break;

            default:
                throw Error(this.op);
        }
        value = integer2float(value, ctx, fCtx, this);
        ctx.pushData(new B_SGLF(this, ctx, fCtx, value, opcode));
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, value);
        // return value;
    };

    ARITH.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let leftInfo = this.left.compile(ctx, fCtx);
        let rightInfo = this.right.compile(ctx, fCtx);
        let opcode = 0;
        switch (this.op) {
            case "ADD":
                opcode = 0;
                break;
            case "MINUS":
                opcode = 1;
                break;
            case "MULTIPLY":
                opcode = 2;
                break;
            case "DIVIDE":
                opcode = 3;
                break;
            case "POWER":
                opcode = 4;
                break;
            case 'Modulo':// 此处为占位，实际使用 Modulo 块
                opcode = 5
                break;
            case "ATAN2":
                opcode = 6;
                break;
            default:
                throw Error(this.op);
        }
        if (leftInfo.is('integer') && rightInfo.is('integer')) {
            ctx.pushData(new B_ARITHI(this, ctx, fCtx, leftInfo, rightInfo, opcode));
            if (rightInfo.i != leftInfo.i) {
                rightInfo.return();
            }
            return ctx.analyser.visitCodeEnd(this, ctx, fCtx, leftInfo);
            // return leftInfo;
        } else if (leftInfo.is('float') || rightInfo.is('float')) {
            leftInfo = integer2float(leftInfo, ctx, fCtx, this);
            rightInfo = integer2float(rightInfo, ctx, fCtx, this);
            ctx.pushData(new B_ARITHF(this, ctx, fCtx, leftInfo, rightInfo, opcode));
            if (rightInfo.i != leftInfo.i) {
                rightInfo.return();
            }
            return ctx.analyser.visitCodeEnd(this, ctx, fCtx, leftInfo);
            // return leftInfo;
        }
        throw Error('not support yet');
    };
    I2F.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let v = this.number.compile(ctx, fCtx);
        v = integer2float(v, ctx, fCtx, this);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, v);
        // return v;
    }
    F2I.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let v = this.number.compile(ctx, fCtx);
        v = float2integer(v, ctx, fCtx, this);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, v);
        // return v;
    }
    Compare.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let leftInfo = this.left.compile(ctx, fCtx);
        let rightInfo = this.right.compile(ctx, fCtx);
        leftInfo = integer2float(leftInfo, ctx, fCtx, this);
        rightInfo = integer2float(rightInfo, ctx, fCtx, this);
        let returnReg = fCtx.getRegister('integer');
        let info;
        switch (this.op) {
            case "EQ":
                if (leftInfo.is('string')) {
                    sameType(leftInfo, rightInfo, '无法比较不同类型数据');
                    ctx.pushData(new B_EQ(this, ctx, fCtx, leftInfo, rightInfo, returnReg));
                } else {
                    info = comparableNumber(ctx, fCtx, leftInfo, rightInfo, true);
                    sameType(info.leftInfo, info.rightInfo, '无法比较不同类型数据');
                    ctx.pushData(new B_EQ(this, ctx, fCtx, info.leftInfo, info.rightInfo, returnReg));
                }
                break;
            case "NEQ":
                if (leftInfo.is('string')) {
                    sameType(leftInfo, rightInfo, '无法比较不同类型数据');
                    ctx.pushData(new B_NEQ(this, ctx, fCtx, leftInfo, rightInfo, returnReg));
                } else {
                    info = comparableNumber(ctx, fCtx, leftInfo, rightInfo, true);
                    sameType(info.leftInfo, info.rightInfo, '无法比较不同类型数据');
                    ctx.pushData(new B_NEQ(this, ctx, fCtx, info.leftInfo, info.rightInfo, returnReg));
                }
                break;
            case "LT":
                if (leftInfo.getTypeId() === 2 && rightInfo.getTypeId() === 2) {
                    ctx.pushData(new B_LT(this, ctx, fCtx, leftInfo, rightInfo, returnReg));
                } else {
                    info = comparableNumber(ctx, fCtx, leftInfo, rightInfo, true);
                    ctx.pushData(new B_LT(this, ctx, fCtx, info.leftInfo, info.rightInfo, returnReg));
                }
                break;
            case "LTE":
                if (leftInfo.getTypeId() === 2 && rightInfo.getTypeId() === 2) {
                    ctx.pushData(new B_LTE(this, ctx, fCtx, leftInfo, rightInfo, returnReg));
                } else {
                    info = comparableNumber(ctx, fCtx, leftInfo, rightInfo, true);
                    ctx.pushData(new B_LTE(this, ctx, fCtx, info.leftInfo, info.rightInfo, returnReg));
                }
                break;
            case "GT":
                if (leftInfo.getTypeId() === 2 && rightInfo.getTypeId() === 2) {
                    ctx.pushData(new B_GT(this, ctx, fCtx, leftInfo, rightInfo, returnReg));
                } else {
                    info = comparableNumber(ctx, fCtx, leftInfo, rightInfo, true);
                    ctx.pushData(new B_GT(this, ctx, fCtx, info.leftInfo, info.rightInfo, returnReg));
                }
                break;
            case "GTE":
                if (leftInfo.getTypeId() === 2 && rightInfo.getTypeId() === 2) {
                    ctx.pushData(new B_GTE(this, ctx, fCtx, leftInfo, rightInfo, returnReg));
                } else {
                    info = comparableNumber(ctx, fCtx, leftInfo, rightInfo, true);
                    ctx.pushData(new B_GTE(this, ctx, fCtx, info.leftInfo, info.rightInfo, returnReg));
                }
                break;
            default:
                throw Error(this.op);
        }
        leftInfo.return();
        rightInfo.return();
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, returnReg);
        // return returnReg;
    };

    TextConstExpr.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let r = fCtx.getRegister('string');
        let idx = ctx.buildRelocationInfo('string', this.text);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;

        ctx.pushData(new B_LDSTR(this, ctx, fCtx, idx, r));
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, r);
        // return r;
    };
    FloatConstExpr.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let r = fCtx.getRegister('float');
        let b;
        switch (this.special) {
            case "NaN":
                b = new B_LDF(this, ctx, fCtx, -1, r);
                ctx.pushData(b);
                break;
            case "POSITIVE_INFINITY":
                b = new B_LDF(this, ctx, fCtx, -2, r);
                ctx.pushData(b);
                break;
            case "NEGATIVE_INFINITY":
                b = new B_LDF(this, ctx, fCtx, -3, r);
                ctx.pushData(b);
                break;
            default:
                let idx = ctx.buildRelocationInfo('float', this.number);
                let pos = ctx.getWritingDataIdx();
                idx.idx = pos;
                b = new B_LDF(this, ctx, fCtx, idx, r);
                ctx.pushData(b);
        }
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, r);
        // return r;
    };
    IntegerConstExpr.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let r = fCtx.getRegister('integer');
        let idx = ctx.buildRelocationInfo('integer', this.number);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;
        let b = new B_LDI(this, ctx, fCtx, idx, r);
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, r);
        // return r;
    };
    ChangeState.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let targetName = this.targetStateName;
        let idx = ctx.buildRelocationInfo('string', targetName);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;
        if (!ctx.currentFSM) {
            ctx.markError(this.blockId, fCtx, "切换状态指令只能用于状态机作用域");
        }
        if (ctx.currentFSM.states.find(s => s.name === targetName) == null) {
            ctx.markError(this.blockId, fCtx, "找不到状态：" + targetName);
        }
        ctx.pushData(new B_CHSTT(this, ctx, fCtx, idx));
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    PushState.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let targetName = this.targetStateName;
        let idx = ctx.buildRelocationInfo('string', targetName);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;
        if (!ctx.currentFSM) {
            ctx.markError(this.blockId, fCtx, "切换状态指令只能用于状态机作用域");
        }
        if (ctx.currentFSM.states.find(s => s.name === targetName) == null) {
            ctx.markError(this.blockId, fCtx, "找不到状态：" + targetName);
        }
        ctx.pushData(new B_PUSTT(this, ctx, fCtx, idx));
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    PopState.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        ctx.pushData(new B_POPSTT(this, ctx, fCtx));
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    GetFSMVariableValue.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let fsm = ctx.currentFSM;
        let variables = fsm.variables;
        let varIdx = variables.findIndex(v => {
            return v.name === this.name;
        });
        if (varIdx === -1) {
            ctx.markError(this.blockId, fCtx, "找不到变量" + this.name);
            throw Error('找不到变量 ' + this.name);
        }
        let v = variables[varIdx];
        let regType = astType2BitcodeType(v.type);
        let r = fCtx.getRegister(regType, v.type);
        let bitcode = new B_FSMVG(this, ctx, fCtx, v.registerIdx, r);
        ctx.pushData(bitcode);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, r);
        // return r;
    };
    SetFSMVariableValue.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let fsm = ctx.currentFSM;
        let variables = fsm.variables;
        let varIdx = variables.findIndex(v => {
            return v.name === this.name;
        });
        if (varIdx === -1) {
            ctx.markError(this.blockId, fCtx, "找不到变量 " + this.name);
            ctx.analyser.visitCodeEnd(this, ctx, fCtx);
            return;
        }
        let v = variables[varIdx];
        let valueReg = this.value.compile(ctx, fCtx);
        if (v.type === 'Number') {
            valueReg = integer2float(valueReg, ctx, fCtx, this);
        }
        if (valueReg.rtype !== astType2BitcodeType(v.type)) {
            ctx.markError(this.blockId, fCtx, "类型不匹配 " + this.name);
            ctx.analyser.visitCodeEnd(this, ctx, fCtx);
            return;
        }
        let bitcode = new B_FSMVS(this, ctx, fCtx, v.registerIdx, valueReg);
        valueReg.return();
        ctx.pushData(bitcode);
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    GetStateVariableValue.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let state = ctx.currentState;
        let variables = state.variables;
        let varIdx = variables.findIndex(v => {
            return v.name === this.name;
        });
        if (varIdx === -1) {
            ctx.markError(this.blockId, fCtx, "找不到变量 " + this.name);
            throw Error('找不到变量 ' + this.name);
        }
        let v = variables[varIdx];
        let regType = astType2BitcodeType(v.type);
        let r = fCtx.getRegister(regType, v.type);
        let bitcode = new B_STVG(this, ctx, fCtx, v.registerIdx, r);
        ctx.pushData(bitcode);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, r);
        // return r;
    };
    SetStateVariableValue.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let state = ctx.currentState;
        let variables = state.variables;
        let varIdx = variables.findIndex(v => {
            return v.name === this.name;
        });
        if (varIdx === -1) {
            ctx.markError(this.blockId, fCtx, "找不到变量 " + this.name);
            return;
        }
        let v = variables[varIdx];
        let valueReg = this.value.compile(ctx, fCtx);
        if (v.type === 'Number') {
            valueReg = integer2float(valueReg, ctx, fCtx, this);
        }
        if (valueReg.rtype !== astType2BitcodeType(v.type)) {
            ctx.markError(this.blockId, fCtx, "类型不匹配 " + this.name);
            return;
        }
        let bitcode = new B_STVS(this, ctx, fCtx, v.registerIdx, valueReg);
        valueReg.return();
        ctx.pushData(bitcode);
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    function writeMethodCall(ctx, fCtx, register) {
        if (this.MethodName.startsWith('.')) {
            let scope = ctx.currentState || ctx.currentFunctions || ctx.currentModule;
            if (scope) {
                let flist = scope.functions;
                let simpleName = this.MethodName.substr(1);
                let func = flist.find(f => f.name === simpleName);
                if (!func) {
                    ctx.markError(this.blockId, fCtx, "找不到函数 " + this.MethodName);
                    return;
                }
                this.MethodName = func.signature;
            }
        } else if (this.MethodName.startsWith(ctx.currentModule.name + '.')) {
            if (!ctx.export.functions[this.MethodName]) {
                ctx.markError(this.blockId, fCtx, "找不到函数 " + this.MethodName);
                return;
            }
        }
        let registerRequest = [];
        let usedRegister = [];
        for (let i = 0; i < this.ArgList.length; i++) {
            let offerExpr = this.ArgList[i];
            let offerRegister = offerExpr.compile(ctx, fCtx);
            usedRegister.push(offerRegister);
            registerRequest.push(offerRegister);
        }

        // 不压缩
        let length = 4 * this.ArgList.length + 8;
        let u32 = [];
        u32.push(length - 4);
        if (register) {
            u32.push((register.getTypeId() << 12 | register.i));
        } else {
            u32.push(-1);
        }
        registerRequest.forEach(r => {
            let type = r.getTypeId();
            let idx = r.i;
            let code = type << 12 | idx;
            u32.push(code);
        });

        // 写入
        let argListIdx = ctx.buildRelocationInfo('bin', u32);
        let pos1 = ctx.getWritingDataIdx();
        argListIdx.idx = pos1;
        let info = new B_ExtInfo(this, ctx, fCtx, argListIdx);
        ctx.pushData(info);

        let idxN = ctx.buildRelocationInfo('string', this.MethodName);
        let pos = ctx.getWritingDataIdx();
        idxN.idx = pos;
        let call = new B_ValueMethodCall(this, ctx, fCtx, idxN);
        ctx.pushData(call);
        usedRegister.forEach(u => { u.return(); });
    };
    VoidMethodCall.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        writeMethodCall.call(this, ctx, fCtx);
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    ValueMethodCall.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let returnRegisterType = astType2BitcodeType(this.returnType);
        let register = fCtx.getRegister(returnRegisterType, this.returnType);
        writeMethodCall.call(this, ctx, fCtx, register);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    let writeNativeCall = function (ctx, fCtx, returnRegister) {
        let registerRequest = [];
        for (let i = 0; i < this.args.length; i++) {
            let offerExpr = this.args[i];
            let offerRegister = offerExpr.compile(ctx, fCtx);
            // offerRegister = integer2float(offerRegister, ctx, fCtx);
            if (offerRegister.rtype === 'integer' && this.func.args[i].type.name === 'Number') {
                offerRegister = integer2float(offerRegister, ctx, fCtx, this);
            }
            if (offerRegister.rtype === 'float' && this.func.args[i].type.name === 'Integer') {
                offerRegister = float2integer(offerRegister, ctx, fCtx, this);
            }
            registerRequest.push(offerRegister);
        }
        // 不压缩
        let length = 4 * this.func.args.length + 8 + 4;
        let u32 = [];
        u32.push(length - 4);
        u32.push(this.func.libIndex);
        if (returnRegister) {
            u32.push((returnRegister.getTypeId() << 12 | returnRegister.i));
        } else {
            u32.push(-1);
        }
        registerRequest.forEach(r => {
            let type = r.getTypeId();
            let idx = r.i;
            let code = type << 12 | idx;
            u32.push(code);
        });
        // 写入
        let argListIdx = ctx.buildRelocationInfo('bin', u32);
        let pos1 = ctx.getWritingDataIdx();
        argListIdx.idx = pos1;
        let info = new B_ExtInfo(this, ctx, fCtx, argListIdx);
        ctx.pushData(info);

        let idxN = ctx.buildRelocationInfo('string', this.func.libName);
        let pos = ctx.getWritingDataIdx();
        idxN.idx = pos;
        let call = new B_ValueNativeCall(this, ctx, fCtx, idxN);
        ctx.pushData(call);
        registerRequest.forEach(u => { u.return(); });
        ctx.addNativeLib(this.func.libName, this.func.libHash);
    }
    ValueNativeCall.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let returnRegisterType = this.func.returnType.registerType();
        let register = fCtx.getRegister(returnRegisterType, this.func.returnType.name);
        writeNativeCall.call(this, ctx, fCtx, register);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    VoidNativeCall.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        writeNativeCall.call(this, ctx, fCtx);
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    CreateFSM.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let idx = ctx.buildRelocationInfo('string', this.fsmTypeName.text);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;
        let register = fCtx.getRegister('Nobject', 'FSM');
        let code = new B_CreateFSM(this, ctx, fCtx, idx, register);
        ctx.pushData(code);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    FSMSendMessage.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let bodyExpr = this.bodyExpr ? this.bodyExpr.compile(ctx, fCtx) : null;
        let target = this.targetExpr.compile(ctx, fCtx);
        let title = this.title.compile(ctx, fCtx);
        if (bodyExpr && bodyExpr.getTypeId() == 4) {
            let idx = ctx.buildRelocationInfo('string', bodyExpr.astType);
            let pos = ctx.getWritingDataIdx();
            idx.idx = pos;
            let typeInfo = new B_ExtInfo(this, ctx, fCtx, idx);
            ctx.pushData(typeInfo);
        }
        let code = new B_FSMSendMsg(this, ctx, fCtx, title, target, bodyExpr);
        ctx.pushData(code);
        target.return();
        title.return();
        if (bodyExpr) { bodyExpr.return(); }
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };

    FSMSendDynamicMessage.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let bodyExpr = this.bodyExpr ? this.bodyExpr.compile(ctx, fCtx) : null;
        let target = this.targetExpr.compile(ctx, fCtx);
        let title = this.title.compile(ctx, fCtx);
        if (bodyExpr && bodyExpr.getTypeId() == 4) {
            let idx = ctx.buildRelocationInfo('string', bodyExpr.astType);
            let pos = ctx.getWritingDataIdx();
            idx.idx = pos;
            let typeInfo = new B_ExtInfo(this, ctx, fCtx, idx);
            ctx.pushData(typeInfo);
        }
        let code = new B_FSMSendMsg(this, ctx, fCtx, title, target, bodyExpr);
        ctx.pushData(code);
        target.return();
        title.return();
        if (bodyExpr) { bodyExpr.return(); }
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };

    FSMSendMessageWait.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let target = this.targetExpr.compile(ctx, fCtx);
        let title = this.title.compile(ctx, fCtx);
        let bodyExpr = this.bodyExpr ? this.bodyExpr.compile(ctx, fCtx) : null;
        let wait = this.waitSecond.compile(ctx, fCtx);
        let code = new B_FSMSendMsgWait_Data(this, ctx, fCtx, title, target, bodyExpr);
        ctx.pushData(code);
        let code1 = new B_FSMSendMsgWait(this, ctx, fCtx, wait);
        ctx.pushData(code1);
        target.return();
        title.return();
        wait.return();
        if (bodyExpr) { bodyExpr.return(); }
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    FSMBroadcastMessage.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let title = this.title.compile(ctx, fCtx);
        let bodyExpr = this.bodyExpr ? this.bodyExpr.compile(ctx, fCtx) : null;
        let code = new B_FSMBroadcastMsg(this, ctx, fCtx, title, this.sendToSelf, bodyExpr);
        ctx.pushData(code);
        title.return();
        if (bodyExpr) { bodyExpr.return(); }
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    FSMBroadcastMessageWait.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let title = this.title.compile(ctx, fCtx);
        let bodyExpr = this.bodyExpr ? this.bodyExpr.compile(ctx, fCtx) : null;
        let wait = this.waitSecond.compile(ctx, fCtx);
        let code = new B_FSMBroadcastMsgWait(this, ctx, fCtx, title, this.sendToSelf, bodyExpr, wait);
        ctx.pushData(code);
        title.return();
        wait.return();
        if (bodyExpr) { bodyExpr.return(); }
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    ReceivedMessage.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let btype = astType2BitcodeType(this.type);
        if (btype == null) {
            throw Error("没有接收数据");
        }
        let register = fCtx.getRegister(btype, this.type);
        ctx.pushData(new B_ReceivedMsg(this, ctx, fCtx, register));
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    Clone.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let st = this.value.compile(ctx, fCtx);
        let registerType = astType2BitcodeType(this.type);
        let register = fCtx.getRegister(registerType, this.type);
        ctx.pushData(new B_CLONE(this, ctx, fCtx, st, register));
        st.return();
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
    };
    GetStructField.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let st = this.value.compile(ctx, fCtx);
        let idx = ctx.buildRelocationInfo('structFieldIndex', this.type + ":" + this.fieldName);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;

        let registerType = astType2BitcodeType(this.fieldType);
        let register = fCtx.getRegister(registerType, this.fieldType);
        ctx.pushData(new B_Struct_Field_Desc(this, ctx, fCtx, register, idx));
        ctx.pushData(new B_GetStructField(this, ctx, fCtx, st, register));
        st.return();
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    SetStructField.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let st = this.stvalue.compile(ctx, fCtx);
        let value = this.value.compile(ctx, fCtx);
        let idx = ctx.buildRelocationInfo('structFieldIndex', this.type + ":" + this.fieldName);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;
        ctx.pushData(new B_Struct_Field_Desc(this, ctx, fCtx, value, idx));
        ctx.pushData(new B_SetStructField(this, ctx, fCtx, st, value));
        st.return();
        value.return();
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    Break.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let br = new B_BR(this, ctx, fCtx);
        ctx.markBreak(br);
        ctx.pushData(br);
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    Continue.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let br = new B_BR(this, ctx, fCtx);
        ctx.markContinue(br);
        ctx.pushData(br);
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    RepeatTimes.prototype.aliveAnalyzer = function (ctx, fCtx) {
        return this.stmt.aliveAnalyzer(ctx, fCtx);
    };
    RepeatTimes.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitRepeatTimesStart(this, ctx, fCtx);
        let timesReg = this.timesExpr.compile(ctx, fCtx);
        if (timesReg.getTypeId() != 0) {
            ctx.markError(this.blockId, fCtx, "循环次数必须为整数");
            return;
        }
        let timesVar = fCtx.createLocalVar('integer', { blockId: this.blockId });
        ctx.pushData(new B_Reg2Var(this, ctx, fCtx, timesReg, timesVar));
        ctx.pushData(new B_Var2Reg(this, ctx, fCtx, timesVar, timesReg));
        let checkReg = fCtx.getRegister('integer');
        let gz0 = new B_GZ0(this, ctx, fCtx, timesReg, checkReg);
        ctx.pushData(gz0);
        let brif = new B_BRIFN(this, ctx, fCtx);
        brif.setRegister(checkReg);
        let start = ctx.getWritingDataIdx();
        ctx.pushData(brif);
        ctx.startLoop();
        this.stmt.compile(ctx, fCtx);
        let continueEntry = ctx.getWritingDataIdx();
        ctx.pushData(new B_NOP(this, ctx, fCtx));
        ctx.pushData(new B_Var2Reg(this, ctx, fCtx, timesVar, timesReg));
        let dec = new B_DEC(this, ctx, fCtx, timesReg);
        ctx.pushData(dec);
        ctx.pushData(new B_Reg2Var(this, ctx, fCtx, timesReg, timesVar));
        let br = new B_BR(this, ctx, fCtx, start);
        ctx.pushData(br);
        let escape = ctx.getWritingDataIdx();
        brif.setBRTarget(escape);// goto B_GZ0(timesReg, checkReg);
        ctx.pushData(new B_NOP(this, ctx, fCtx));
        ctx.endLoop(continueEntry, escape);
        checkReg.return();
        timesReg.return();
        timesVar.return();
        ctx.analyser.visitRepeatTimesEnd(this, ctx, fCtx);
    };
    IfControl.prototype.aliveAnalyzer = function (ctx, fCtx) {
        if (this.ifthenPairs.length === 0) {
            return false;
        }
        for (let i = 0; i < this.ifthenPairs.length; i++) {
            let _if = this.ifthenPairs[i][0];
            let _then = this.ifthenPairs[i][1];
            if (_if instanceof IntegerConstExpr && _if.number === 1) {
                return _then.aliveAnalyzer(ctx, fCtx);
            }
        }
        return false;
    };
    IfControl.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitIfFlowStart(this, ctx, fCtx);
        let esc = [];

        this.ifthenPairs.forEach(pair => {
            let _if = pair[0];
            let _then = pair[1];
            let r = _if.compile(ctx, fCtx);
            let brifn = new B_BRIFN(this, ctx, fCtx);
            brifn.setRegister(r);
            ctx.pushData(brifn);
            _then.compile(ctx, fCtx);
            let br = new B_BR(this, ctx, fCtx);
            ctx.pushData(br);
            esc.push(br);
            brifn.setBRTarget(ctx.getWritingDataIdx());
            ctx.pushData(new B_NOP(this, ctx, fCtx));
            r.return();
        });
        let escIdx = ctx.getWritingDataIdx();
        ctx.pushData(new B_NOP(this, ctx, fCtx));
        esc.forEach(br => {
            br.targetOffset = escIdx;
        });
        ctx.analyser.visitIfFlowEnd(this, ctx, fCtx);
    };
    SetLocalVariableValue.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let varinfo = fCtx.getVarInfoByVarName(this.name);
        let valueReg = this.value.compile(ctx, fCtx);
        if (varinfo.register.rtype === 'float') {
            valueReg = integer2float(valueReg, ctx, fCtx, this);
        }
        if (varinfo.register.rtype !== valueReg.rtype) {
            debugger
            ctx.markError(this.blockId, fCtx, "类型不匹配 " + this.name);
            return;
        }
        let bc = new B_Reg2Var(this, ctx, fCtx, valueReg, varinfo.register);
        valueReg.return();
        ctx.pushData(bc);
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    GetLocalVariableValue.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let varinfo = fCtx.getVarInfoByVarName(this.name);
        if (!varinfo) {
            throw Error('不存在局部变量 ' + this.name);
        }
        let reg = fCtx.getRegister(varinfo.register.rtype, varinfo.decl.structType);
        let bitcode = new B_Var2Reg(this, ctx, fCtx, varinfo.register, reg);
        ctx.pushData(bitcode);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, reg);
        // return reg;
    };
    Return.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let valueReg = null;
        if (this.expr) {
            valueReg = this.expr.compile(ctx, fCtx);
        }
        let b = new B_RET(this, ctx, fCtx, valueReg);
        ctx.pushData(b);
        if (valueReg) {
            valueReg.return();
        }
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    NOP.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        ctx.pushData(new B_NOP(this, ctx, fCtx));
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    Comment.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    Self.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let v = fCtx.getRegister('Nobject', 'FSM');
        ctx.pushData(new B_SLF(this, ctx, fCtx, v));
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, v);
        // return v;
    };
    DFSM.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        ctx.pushData(new B_DFSM(this, ctx, fCtx));
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    }
    ForLoop.prototype.aliveAnalyzer = function (ctx, fCtx) {
        return this.stmt.aliveAnalyzer(ctx, fCtx);
    };
    ForLoop.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitForLoopStart(this, ctx, fCtx);
        let varinfo = fCtx.createLocalVar("integer", { name: this.varName, blockId: this.blockId });
        let fromRegister = this.fromExpr.compile(ctx, fCtx);
        if (fromRegister.getTypeId() === 0) {
            bc = new B_Reg2Var(this, ctx, fCtx, fromRegister, varinfo);
            ctx.pushData(bc);

        } else {
            ctx.markError(this.blockId, fCtx, "变量必须为整数类型");
            return;
        }

        let stepByinfo = fCtx.createLocalVar('integer', { blockId: this.blockId });
        let byRegister = this.byExpr.compile(ctx, fCtx);
        bc = new B_Reg2Var(this, ctx, fCtx, byRegister, stepByinfo);
        ctx.pushData(bc);

        let toinfo = fCtx.createLocalVar('integer', { blockId: this.blockId });
        let toRegister = this.toExpr.compile(ctx, fCtx);
        bc = new B_Reg2Var(this, ctx, fCtx, toRegister, toinfo);
        ctx.pushData(bc);


        let start = ctx.getWritingDataIdx();
        ctx.pushData(new B_NOP(this, ctx, fCtx));
        let ldVar = new B_Var2Reg(this, ctx, fCtx, varinfo, fromRegister);
        ctx.pushData(ldVar);
        let ldTo = new B_Var2Reg(this, ctx, fCtx, toinfo, toRegister);
        ctx.pushData(ldTo);
        let checkReg = fCtx.getRegister('integer');
        let check = new B_LTE(this, ctx, fCtx, fromRegister, toRegister, checkReg);
        ctx.pushData(check);
        let brifn = new B_BRIFN(this, ctx, fCtx);
        brifn.setRegister(checkReg);
        ctx.pushData(brifn);

        ctx.startLoop();
        this.stmt.compile(ctx, fCtx);

        let continueEntry = ctx.getWritingDataIdx();

        ctx.pushData(new B_NOP(this, ctx, fCtx));
        ctx.pushData(ldVar);
        let ldBy = new B_Var2Reg(this, ctx, fCtx, stepByinfo, byRegister);
        ctx.pushData(ldBy);
        let add = new B_ARITHI(this, ctx, fCtx, fromRegister, byRegister, 0);
        ctx.pushData(add);
        ctx.pushData(new B_Reg2Var(this, ctx, fCtx, fromRegister, varinfo));
        let br = new B_BR(this, ctx, fCtx, start);
        ctx.pushData(br);

        let escape = ctx.getWritingDataIdx();
        brifn.setBRTarget(escape);// goto B_GZ0(timesReg, checkReg);
        ctx.pushData(new B_NOP(this, ctx, fCtx));
        ctx.endLoop(continueEntry, escape);

        fromRegister.return();
        byRegister.return();
        varinfo.return();
        toRegister.return();
        stepByinfo.return();
        checkReg.return();
        ctx.analyser.visitForLoopEnd(this, ctx, fCtx);
        fCtx.removeLocalVar(this.varName);
    };
    WhileUntil.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitWhileUntilLoopStart(this, ctx, fCtx);
        ctx.startLoop();
        let continueEntry = ctx.getWritingDataIdx();
        ctx.pushData(new B_NOP(this, ctx, fCtx));
        var checkReg = this.bool.compile(ctx, fCtx);
        var br = this.mode ? new B_BRIFN(this, ctx, fCtx) : new B_BRIF(this, ctx, fCtx);
        br.setRegister(checkReg);
        ctx.pushData(br);

        this.statment.compile(ctx, fCtx);

        let start = new B_BR(this, ctx, fCtx, continueEntry);
        ctx.pushData(start);
        let escape = ctx.getWritingDataIdx();
        br.setBRTarget(escape);// goto B_GZ0(timesReg, checkReg);
        ctx.pushData(new B_NOP(this, ctx, fCtx));
        ctx.endLoop(continueEntry, escape);
        checkReg.return();
        ctx.analyser.visitWhileUntilLoopEnd(this, ctx, fCtx);
    };
    WhileUntil.prototype.aliveAnalyzer = function (ctx, fCtx) {
        return this.statment.aliveAnalyzer(ctx, fCtx);
    };
    Random.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let r = fCtx.getRegister('float');
        let b = new B_RAND(this, ctx, fCtx, r);
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, r);
        // return r;
    };
    RandomInt.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let from = this.From.compile(ctx, fCtx);
        from = integer2float(from, ctx, fCtx, this);
        let to = this.To.compile(ctx, fCtx);
        to = integer2float(to, ctx, fCtx, this);
        let r = fCtx.getRegister('float');
        let b = new B_RAND(this, ctx, fCtx, r);
        ctx.pushData(b);
        var a1 = new B_ARITHF(this, ctx, fCtx, to, from, 1);
        ctx.pushData(a1);
        var a2 = new B_ARITHF(this, ctx, fCtx, to, r, 2);
        ctx.pushData(a2);
        var a3 = new B_ARITHF(this, ctx, fCtx, to, from, 0);
        ctx.pushData(a3);
        var result = float2integer(to, ctx, fCtx, this);
        r.return();
        from.return();
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, result);
        // return result;
    };
    Modulo.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let dividend = this.dividend.compile(ctx, fCtx);
        dividend = integer2float(dividend, ctx, fCtx, this);
        let divisor = this.divisor.compile(ctx, fCtx);
        divisor = integer2float(divisor, ctx, fCtx, this);
        let b = new B_ARITHF(this, ctx, fCtx, dividend, divisor, 5);
        ctx.pushData(b);
        divisor.return();
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, dividend);
        // return dividend;
    };
    ToString.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let r = this.valueExpr.compile(ctx, fCtx);
        if (r.rtype === 'string') {
            return ctx.analyser.visitCodeEnd(this, ctx, fCtx, r);
            // return r;
        } else {
            let ret = fCtx.getRegister('string');
            let b = new B_ToString(this, ctx, fCtx, r, ret);
            r.return();
            ctx.pushData(b);
            return ctx.analyser.visitCodeEnd(this, ctx, fCtx, ret);
            // return ret;
        }
    };
    TextJoin.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let l = this.left.compile(ctx, fCtx);
        let r = this.right.compile(ctx, fCtx);
        let ret = fCtx.getRegister('string');
        let b = new B_TextJoin(this, ctx, fCtx, l, r, ret);
        ctx.pushData(b);
        l.return();
        r.return();
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, ret);
        // return ret;
    };
    SenderOfReceivedMessage.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let r = fCtx.getRegister('Nobject', 'FSM');
        let b = new B_Sender(this, ctx, fCtx, r);
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, r);
        // return r;
    };
    ValueOfMap.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map.compile(ctx, fCtx);
        let key = this.key.compile(ctx, fCtx);
        let maptype = map.astType;
        let elemType = maptype.substring('string_map<'.length, maptype.length - 1);
        let elemRegister = astType2BitcodeType(elemType);
        let register = fCtx.getRegister(elemRegister, elemType);
        let b = new B_VOM(this, ctx, fCtx, map, key, register);
        map.return();
        key.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    ValueAt.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let list = this.list.compile(ctx, fCtx);
        let idx = this.idx.compile(ctx, fCtx);
        let maptype = list.astType;
        let elemType = maptype.substring('list<'.length, maptype.length - 1);
        let elemRegister = astType2BitcodeType(elemType);
        let register = fCtx.getRegister(elemRegister, elemType);
        let b = new B_VAT(this, ctx, fCtx, list, idx, register);
        list.return();
        idx.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    ValueOfIMap.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map.compile(ctx, fCtx);
        let key = this.key.compile(ctx, fCtx);
        let maptype = map.astType;
        let elemType = maptype.substring('integer_map<'.length, maptype.length - 1);
        let elemRegister = astType2BitcodeType(elemType);
        let register = fCtx.getRegister(elemRegister, elemType);
        let b = new B_VOIM(this, ctx, fCtx, map, key, register);
        map.return();
        key.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    SizeOfMap.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map.compile(ctx, fCtx);
        let register = fCtx.getRegister('integer');
        let b = new B_SOM(this, ctx, fCtx, map, register);
        map.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, register);
        // return register;
    };
    STKV.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map.compile(ctx, fCtx);
        let key = this.key.compile(ctx, fCtx);
        let value = this.value.compile(ctx, fCtx);
        let b = new B_STKV(this, ctx, fCtx, map, key, value);
        map.return();
        key.return();
        value.return();
        ctx.pushData(b)
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    SVAT.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let list = this.list.compile(ctx, fCtx);
        let idx = this.idx.compile(ctx, fCtx);
        let value = this.value.compile(ctx, fCtx);
        let b = new B_SVAT(this, ctx, fCtx, list, idx, value);
        list.return();
        idx.return();
        value.return();
        ctx.pushData(b)
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    RVAT.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let list = this.list.compile(ctx, fCtx);
        let idx = this.idx.compile(ctx, fCtx);
        let b = new B_RVAT(this, ctx, fCtx, list, idx);
        list.return();
        idx.return();
        ctx.pushData(b)
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    IVAT.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let list = this.list.compile(ctx, fCtx);
        let idx = this.idx.compile(ctx, fCtx);
        let value = this.value.compile(ctx, fCtx);
        let b = new B_IVAT(this, ctx, fCtx, list, idx, value);
        list.return();
        idx.return();
        value.return();
        ctx.pushData(b)
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    STIKV.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map.compile(ctx, fCtx);
        let key = this.key.compile(ctx, fCtx);
        let value = this.value.compile(ctx, fCtx);
        let b = new B_STIKV(this, ctx, fCtx, map, key, value);
        map.return();
        key.return();
        value.return();
        ctx.pushData(b)
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    RKOM.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map.compile(ctx, fCtx);
        let key = this.key.compile(ctx, fCtx);
        let b = new B_RKOM(this, ctx, fCtx, map, key);
        map.return();
        key.return();
        ctx.pushData(b)
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    RKOIM.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map.compile(ctx, fCtx);
        let key = this.key.compile(ctx, fCtx);
        let b = new B_RKOIM(this, ctx, fCtx, map, key);
        map.return();
        key.return();
        ctx.pushData(b)
        ctx.analyser.visitCodeEnd(this, ctx, fCtx);
    };
    SHL.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let value = this.value.compile(ctx, fCtx);
        let bitCount = this.bitCount.compile(ctx, fCtx);
        let b = new B_SHL(this, ctx, fCtx, value, bitCount);
        bitCount.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, value);
        // return value;
    };
    BitAnd.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let a = this.a.compile(ctx, fCtx);
        let b = this.b.compile(ctx, fCtx);
        let bc = new B_AND(this, ctx, fCtx, a, b);
        b.return();
        ctx.pushData(bc);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, a);
        // return a;
    };
    let fixedRegister = {};
    FixRegister.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        if (fixedRegister[this.iid]) {
            return ctx.analyser.visitCodeEnd(this, ctx, fCtx, fixedRegister[this.iid]);
            // return fixedRegister[this.iid];
        }
        let value = this.value.compile(ctx, fCtx);
        let b = new B_FIX(this, ctx, fCtx, value);
        ctx.pushData(b);
        value._return = value.return;
        value.return = function () { };
        fixedRegister[this.iid] = value;
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, value);
        // return value;
    }
    UnfixRegister.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let r = fixedRegister[this.fid];
        delete fixedRegister[this.fid];
        r.return = r._return;
        return r;
    }
    LogicAnd.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let a = this.A.compile(ctx, fCtx);
        let b = this.B.compile(ctx, fCtx);
        b.return();
        let bc = new B_LAND(this, ctx, fCtx, a, b);
        ctx.pushData(bc);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, a);
        // return a;
    };
    LogicOr.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let a = this.A.compile(ctx, fCtx);
        let b = this.B.compile(ctx, fCtx);
        b.return();
        let bc = new B_LOR(this, ctx, fCtx, a, b);
        ctx.pushData(bc);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, a);
        // return a;
    };
    LogicNot.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let a = this.A.compile(ctx, fCtx);
        let bc = new B_LNOT(this, ctx, fCtx, a);
        ctx.pushData(bc);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, a);
        // return a;
    };
    Conditional.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let if_ = this.IF.compile(ctx, fCtx);
        let then_ = this.THEN.compile(ctx, fCtx);
        let else_ = this.ELSE.compile(ctx, fCtx);
        let bc = new B_COND(this, ctx, fCtx, if_, then_, else_);
        else_.return();
        if_.return();
        ctx.pushData(bc);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, then_);
        // return then_;
    }
    NewStruct.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let ret = fCtx.getRegister('object', this.structType);

        let idx = ctx.buildRelocationInfo('string', this.structType);
        let pos = ctx.getWritingDataIdx();
        idx.idx = pos;

        ctx.pushData(new B_NEW(this, ctx, fCtx, idx, ret));
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, ret);
        // return ret;
    }
    ConstrainNumber.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let ret = fCtx.getRegister('float');
        let value = this.value.compile(ctx, fCtx);
        let min = this.min.compile(ctx, fCtx);
        let max = this.max.compile(ctx, fCtx);
        ctx.pushData(new B_CSTR(this, ctx, fCtx, value, min, max, ret));
        min.return();
        max.return();
        value.return();
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, ret);
        // return ret;
    }

    CreateList.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let ret = fCtx.getRegister('object', 'list<' + this.elementType + '>');
        let typeIdx = ctx.buildRelocationInfo('string', this.elementType);
        let bc = new B_LIST(this, ctx, fCtx, ret, typeIdx);
        ctx.pushData(bc);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, ret);
        // return ret;
    };
    CreateStringMap.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let ret = fCtx.getRegister('object', 'string_map<' + this.elementType + '>');
        let typeIdx = ctx.buildRelocationInfo('string', this.elementType);
        let bc = new B_SMAP(this, ctx, fCtx, ret, typeIdx);
        ctx.pushData(bc);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, ret);
        // return ret;
    };
    CreateIntMap.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let ret = fCtx.getRegister('object', 'integer_map<' + this.elementType + '>');
        let typeIdx = ctx.buildRelocationInfo('string', this.elementType);
        let bc = new B_IMAP(this, ctx, fCtx, ret, typeIdx);
        ctx.pushData(bc);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, ret);
        // return ret;
    };

    /**
     * openblock变量必须初始化，此命令不再有意义
     */
    VarAssigned.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let v = this.value;

        if (v instanceof FloatConstExpr ||
            v instanceof TextConstExpr ||
            v instanceof IntegerConstExpr) {
            throw Error('不可用常量表达式');
        }
        let reg = v.compile(ctx, fCtx);
        let regtype = reg.getTypeId()
        if (regtype === 1 || regtype === 0) {
            throw Error('不支持数字和整数类型');
        }
        let retReg = fCtx.getRegister('integer');
        let b = new B_VAD(this, ctx, fCtx, reg, retReg);
        reg.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, retReg);
        // return retReg;
    }

    SME.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let key = this.key;
        let reg = key.compile(ctx, fCtx);
        let regtype = reg.getTypeId()
        if (regtype !== 2) {
            throw Error('索引必须为字符串类型');
        }
        let map = this.map;
        let mreg = map.compile(ctx, fCtx);
        let mregType = mreg.getTypeId();
        if (mregType !== 3) {
            throw Error('必须是字符串映射');
        }
        let retReg = fCtx.getRegister('integer');
        let b = new B_SME(this, ctx, fCtx, mreg, reg, retReg);
        reg.return();
        mreg.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, retReg);
    }
    IME.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let key = this.key;
        let reg = key.compile(ctx, fCtx);
        let regtype = reg.getTypeId()
        if (regtype !== 0) {
            throw Error('索引必须为整数类型');
        }
        let map = this.map;
        let mreg = map.compile(ctx, fCtx);
        let mregType = mreg.getTypeId();
        if (mregType !== 3) {
            throw Error('必须是整数映射');
        }
        let retReg = fCtx.getRegister('integer');
        let b = new B_IME(this, ctx, fCtx, mreg, reg, retReg);
        reg.return();
        mreg.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, retReg);
    }
    IMA.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map;
        let mreg = map.compile(ctx, fCtx);
        let mregType = mreg.getTypeId();
        if (mregType !== 3) {
            throw Error('必须是整数映射');
        }
        let retReg = fCtx.getRegister('object', 'list<Integer>');
        let b = new B_IMA(this, ctx, fCtx, mreg, retReg);
        mreg.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, retReg);
    }
    SMA.prototype.compile = function (ctx, fCtx) {
        ctx.analyser.visitCode(this, ctx, fCtx);
        let map = this.map;
        let mreg = map.compile(ctx, fCtx);
        let mregType = mreg.getTypeId();
        if (mregType !== 3) {
            throw Error('必须是字符串映射');
        }
        let retReg = fCtx.getRegister('object', 'list<String>');
        let b = new B_IMA(this, ctx, fCtx, mreg, retReg);
        mreg.return();
        ctx.pushData(b);
        return ctx.analyser.visitCodeEnd(this, ctx, fCtx, retReg);
    }
})();
