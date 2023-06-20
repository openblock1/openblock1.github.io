/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

class B_PRT extends Instruct {
    static CODE = Instruct.CODE(1);
    argRegister;
    constructor(block, ctx, fCtx) {
        super(block, ctx, fCtx);
    }
    toU32() {
        return this.constructor.CODE | (this.argRegister.getTypeId() << 20) | this.argRegister.i;
    }
}
class B_ARITHI extends Instruct {
    static CODE = Instruct.CODE(2);
    left;
    right;
    opcode;
    constructor(block, ctx, fCtx, l, r, op) {
        super(block, ctx, fCtx);
        this.left = l;
        this.right = r;
        this.opcode = op;
    }
    toU32() {
        if (!(this.left.is('integer'))) {
            this.throwError('整数计算左值必须是整数寄存器')
        }
        if (!(this.right.is('integer'))) {
            this.throwError('整数计算右值必须是整数寄存器')
        }
        return this.constructor.CODE | (this.opcode << 20) | (this.left.i << 10) | this.right.i;
    }
}
/**
 * 注意，此指令没有申请新的寄存器，具有利用left寄存器作为返回值的副作用。
 * 所以使用此指令的操作需要注意不要释放left寄存器
 * 
            switch (this.Opcode)
            {
                case 0:
                    return l + r;
                case 1:
                    return l - r;
                case 2:
                    return l * r;
                case 3:
                    return l / r;
                case 4:
                    return Math.Pow(l, r);
                case 5:
                    return l%r;
                default:
                    throw new Exception("未知操作符 " + this.Opcode);
            }
 */
class B_ARITHF extends Instruct {
    static CODE = Instruct.CODE(3);
    left;
    right;
    opcode;
    constructor(block, ctx, fCtx, l, r, op) {
        super(block, ctx, fCtx);
        if (!(r.is('float') && l.is('float'))) {
            throw Error('must be float.')
        }
        this.left = l;
        this.right = r;
        this.opcode = op;
    }
    toU32() {
        if (!(this.right.is('float'))) {
            this.throwError('整数计算右值必须是整数寄存器')
        }
        if (!(this.left.is('float'))) {
            this.throwError('整数计算左值必须是整数寄存器')
        }
        return this.constructor.CODE | (this.opcode << 20) | (this.left.i << 10) | this.right.i;
    }
}
class B_LDSTR extends Instruct {
    static CODE = Instruct.CODE(4);
    str;
    register;
    constructor(block, ctx, fCtx, str, r) {
        super(block, ctx, fCtx);
        if (!r.is('string')) {
            throw Error('must be string');
        }
        this.str = str;
        this.register = r;
    }
    toU32() {
        return this.constructor.CODE | (this.register.i << 16) | this.str.toU32();
    }
}
class B_LDI extends Instruct {
    static CODE = Instruct.CODE(5);
    number;
    register;
    constructor(block, ctx, fCtx, n, r) {
        super(block, ctx, fCtx);
        if (!r.is('integer')) {
            throw Error('must be int.');
        }
        this.number = n;
        this.register = r;
    }
    toU32() {
        return this.constructor.CODE | (this.register.i << 16) | this.number.toU32();
    }
}
class B_LDF extends Instruct {
    static CODE = Instruct.CODE(6);
    number;
    register;
    constructor(block, ctx, fCtx, n, r) {
        super(block, ctx, fCtx);
        if (!r.is('float')) {
            throw Error('must be int.');
        }
        this.number = n;
        this.register = r;
    }
    toU32() {
        if (typeof (this.number) === 'number') {
            return this.constructor.CODE | ((this.register.i & 0xff) << 16) | (this.number & 0xffff);
        } else {
            return this.constructor.CODE | ((this.register.i & 0xff) << 16) | this.number.toU32();
        }
    }
}
class B_RET extends Instruct {
    static CODE = Instruct.CODE(7);
    retReg;
    constructor(block, ctx, fCtx, retR) {
        super(block, ctx, fCtx);
        this.retReg = retR;
    }
    toU32() {
        if (this.retReg) {
            return this.constructor.CODE | (this.retReg.getTypeId() << 20) | (this.retReg.i);
        } else {
            return this.constructor.CODE | 0xFFFFFF;
        }
    }
}
class B_DebugInstruct extends Instruct {
    static CODE = Instruct.CODE(8);
    constructor(block, ctx, fCtx, blockIdx) {
        super(block, ctx, fCtx);
        this.blockIdx = blockIdx;
    }
    toU32() {
        return this.constructor.CODE | this.blockIdx.toU32();
    }
}
class B_STMT_end extends Instruct {
    static CODE = Instruct.CODE(9);
    constructor(block, ctx, fCtx) {
        super(block, ctx, fCtx);
    }
    toU32() {
        return this.constructor.CODE;
    }
}
class B_CHSTT extends Instruct {
    static CODE = Instruct.CODE(10);
    str;
    constructor(block, ctx, fCtx, str) {
        super(block, ctx, fCtx);
        this.str = str;
    }

    toU32() {
        return this.constructor.CODE | this.str.toU32();
    }
}
class B_STVG extends Instruct {
    static CODE = Instruct.CODE(11);
    varIdx;
    valueReg;

    constructor(block, ctx, fCtx, varIdx, valueReg) {
        super(block, ctx, fCtx);
        this.varIdx = varIdx;
        this.valueReg = valueReg;
    }
    toU32() {
        return this.constructor.CODE | (this.valueReg.getTypeId() << 16) | (this.valueReg.i << 8) | (this.varIdx);
    }
}
class B_FSMVS extends Instruct {
    static CODE = Instruct.CODE(12);
    varIdx;
    valueReg;

    constructor(block, ctx, fCtx, varIdx, valueReg) {
        super(block, ctx, fCtx);
        this.varIdx = varIdx;
        this.valueReg = valueReg;
    }
    toU32() {
        return this.constructor.CODE | (this.valueReg.getTypeId() << 16) | (this.valueReg.i << 8) | (this.varIdx);
    }
}
class B_FSMVG extends Instruct {
    static CODE = Instruct.CODE(13);
    varIdx;
    valueReg;

    constructor(block, ctx, fCtx, varIdx, valueReg) {
        super(block, ctx, fCtx);
        this.varIdx = varIdx;
        this.valueReg = valueReg;
    }
    toU32() {
        return this.constructor.CODE | (this.valueReg.getTypeId() << 16) | (this.valueReg.i << 8) | (this.varIdx);
    }
}
class B_STVS extends Instruct {
    static CODE = Instruct.CODE(14);
    varIdx;
    valueReg;

    constructor(block, ctx, fCtx, varIdx, valueReg) {
        super(block, ctx, fCtx);
        this.varIdx = varIdx;
        this.valueReg = valueReg;
    }
    toU32() {
        return this.constructor.CODE | (this.valueReg.getTypeId() << 16) | (this.valueReg.i << 8) | (this.varIdx);
    }
}
class B_ValueMethodCall extends Instruct {
    static CODE = Instruct.CODE(15);
    MethodNameIdx;
    constructor(block, ctx, fCtx, MethodNameIdx) {
        super(block, ctx, fCtx);
        this.MethodNameIdx = MethodNameIdx;
    }
    toU32() {
        return this.constructor.CODE | this.MethodNameIdx.toU32();
    }
}
class B_ExtInfo extends Instruct {
    static CODE = Instruct.CODE(16);
    info;
    constructor(block, ctx, fCtx, info) {
        super(block, ctx, fCtx);
        this.info = info;
    }
    toU32() {
        return this.constructor.CODE | this.info.toU32();
    }

}
class B_CreateFSM extends Instruct {
    static CODE = Instruct.CODE(17);
    FSMTypeNameIdx;
    ReturnRegister;
    constructor(block, ctx, fCtx, stringIdx, returnRegister) {
        super(block, ctx, fCtx);
        this.FSMTypeNameIdx = stringIdx;
        this.ReturnRegister = returnRegister;
    }
    toU32() {
        return this.constructor.CODE | this.ReturnRegister.i << 16 | this.FSMTypeNameIdx.toU32();
    }
}
class B_FSMSendMsg extends Instruct {
    static CODE = Instruct.CODE(18);
    title; target; bodyExpr;
    constructor(block, ctx, fCtx, title, target, bodyExpr) {
        super(block, ctx, fCtx);
        this.title = title;
        this.target = target;
        this.bodyExpr = bodyExpr;
    }
    toU32() {
        if (this.bodyExpr) {
            return this.constructor.CODE |
                (this.target.i << 17) |
                (this.title.i << 10) |
                (this.bodyExpr.getTypeId() << 6)
                | this.bodyExpr.i;
        } else {
            return this.constructor.CODE |
                (this.target.i << 17) |
                (this.title.i << 10) |
                0x3ff;// 低位全1
        }
    }
}
class B_ReceivedMsg extends Instruct {
    static CODE = Instruct.CODE(19);
    register;
    constructor(block, ctx, fCtx, register) {
        super(block, ctx, fCtx);
        this.register = register;
    }
    toU32() {
        let typeId = (this.register.getTypeId() << 20)
        return this.constructor.CODE | typeId | this.register.i;
    }
}
// struct register idx,
// fieldValueRegister register idx,
// fieldType id(4bit) \__ field desc: B_Struct_Field_Desc
// field desc idx     /
class B_GetStructField extends Instruct {
    static CODE = Instruct.CODE(20);
    returnRegister; fieldRegister;
    constructor(block, ctx, fCtx, st, returnRegister, fieldRegister) {
        super(block, ctx, fCtx);
        this.st = st;
        this.returnRegister = returnRegister;
        this.fieldRegister = fieldRegister;
    }
    toU32() {
        return this.constructor.CODE | (this.st.i << 12) | this.returnRegister.i;
    }
}
class B_SetStructField extends Instruct {
    static CODE = Instruct.CODE(21);
    st; valueRegister;
    constructor(block, ctx, fCtx, st, valueRegister) {
        super(block, ctx, fCtx);
        this.st = st;
        this.valueRegister = valueRegister;
    }
    toU32() {
        return this.constructor.CODE | (this.st.i << 12) | this.valueRegister.i;
    }
}
class B_GZ0 extends Instruct {
    static CODE = Instruct.CODE(22);
    valueReg; resultReg;
    constructor(block, ctx, fCtx, valueReg, resultReg) {
        super(block, ctx, fCtx);
        if (resultReg.getTypeId() != 0) {
            throw Error('需要整数寄存器');
        }
        this.valueReg = valueReg;
        this.resultReg = resultReg;
    }
    toU32() {
        return this.constructor.CODE | (this.valueReg.getTypeId() << 20) | (this.valueReg.i << 10) | (this.resultReg.i);
    }
}
class B_BRIF extends Instruct {
    static CODE = Instruct.CODE(23);
    checkReg; targetOffset;
    constructor(block, ctx, fCtx) {
        super(block, ctx, fCtx);
    }
    setRegister(reg) {
        this.checkReg = reg;
    }
    setBRTarget(target) {
        this.targetOffset = target;
    }
    toU32() {
        return this.constructor.CODE | (this.checkReg.getTypeId() << 20) | (this.checkReg.i << 15) | (this.targetOffset & 0x3fff);
    }
}
class B_DEC extends Instruction {
    static CODE = Instruct.CODE(24);
    register;
    constructor(block, ctx, fCtx, reg) {
        super(block, ctx, fCtx);
        this.register = reg;
    }
    toU32() {
        return this.constructor.CODE | (this.register.getTypeId()) << 20 | this.register.i;
    }
}
class B_BR extends Instruction {
    static CODE = Instruct.CODE(25);
    targetOffset;

    constructor(block, ctx, fCtx, offset) {
        super(block, ctx, fCtx);
        this.targetOffset = offset;
    }
    toU32() {
        return this.constructor.CODE | (this.targetOffset & 0xffffff);
    }
}
class B_Reg2Var extends Instruction {
    static CODE = Instruct.CODE(26);
    reg; vari;
    constructor(block, ctx, fCtx, reg, vari) {
        super(block, ctx, fCtx);
        if (!vari) {
            throw Error();
        }
        if (!reg) {
            throw Error();
        }
        this.reg = reg;
        this.vari = vari;
    }
    toU32() {
        return this.constructor.CODE | (this.reg.getTypeId() << 20) | (this.reg.i << 10) | (this.vari.i);
    }
}
class B_Var2Reg extends Instruction {
    static CODE = Instruct.CODE(27);
    reg; vari;
    constructor(block, ctx, fCtx, vari, reg) {
        super(block, ctx, fCtx);
        if (!vari) {
            throw Error();
        }
        if (!reg) {
            throw Error();
        }
        this.reg = reg;
        this.vari = vari;
    }
    toU32() {
        return this.constructor.CODE | (this.reg.getTypeId() << 20) | (this.reg.i << 10) | (this.vari.i);
    }
}
class B_NOP extends Instruction {
    static CODE = Instruct.CODE(28);
    constructor(block, ctx, fCtx) {
        super(block, ctx, fCtx);
    }
    toU32() {
        return this.constructor.CODE;
    }
}
class B_BRIFN extends Instruct {
    static CODE = Instruct.CODE(29);
    checkReg; targetOffset;
    constructor(block, ctx, fCtx) {
        super(block, ctx, fCtx);
    }
    setRegister(reg) {
        this.checkReg = reg;
    }
    setBRTarget(target) {
        this.targetOffset = target;
    }
    toU32() {
        return this.constructor.CODE | (this.checkReg.getTypeId() << 20) | (this.checkReg.i << 15) | (this.targetOffset & 0x3fff);
    }
}
class B_I2F extends Instruct {
    static CODE = Instruct.CODE(30);
    intReg; floatReg;
    constructor(block, ctx, fCtx, intReg, floatReg) {
        super(block, ctx, fCtx);
        this.intReg = intReg;
        this.floatReg = floatReg;
    }
    toU32() {
        return this.constructor.CODE | (this.intReg.i << 12) | (this.floatReg.i);
    }
}
class B_Struct_Field_Desc extends Instruct {
    static CODE = Instruct.CODE(31);
    fieldTypeId;
    fieldDescIdx;
    constructor(block, ctx, fCtx,
        fieldTypeId,
        fieldDescIdx) {
        super(block, ctx, fCtx);
        this.fieldTypeId = fieldTypeId;
        this.fieldDescIdx = fieldDescIdx;
    }
    toU32() {
        return this.constructor.CODE | (this.fieldTypeId.getTypeId() << 20) | (this.fieldDescIdx.idx);
    }
}
class B_EQ extends Instruct {
    static CODE = Instruct.CODE(32);
    left; right; ret;
    constructor(block, ctx, fCtx, lr, rr, retR) {
        super(block, ctx, fCtx);
        this.left = lr;
        this.right = rr;
        this.ret = retR;
    }
    toU32() {
        return this.constructor.CODE |
            (this.left.getTypeId() << 20) |
            (this.left.i << 14) | (this.right.i << 7) | (this.ret.i);
    }
}
class B_NEQ extends Instruct {
    static CODE = Instruct.CODE(33);
    left; right; ret;
    constructor(block, ctx, fCtx, lr, rr, retR) {
        super(block, ctx, fCtx);
        this.left = lr;
        this.right = rr;
        this.ret = retR;
    }
    toU32() {
        return this.constructor.CODE |
            (this.left.getTypeId() << 20) |
            (this.left.i << 14) | (this.right.i << 7) | (this.ret.i);
    }
}
class B_LT extends Instruct {
    static CODE = Instruct.CODE(34);
    left; right; ret;
    constructor(block, ctx, fCtx, lr, rr, retR) {
        super(block, ctx, fCtx);
        this.left = lr;
        this.right = rr;
        this.ret = retR;
    }
    toU32() {
        return this.constructor.CODE |
            (this.left.getTypeId() << 20) |
            (this.left.i << 14) | (this.right.i << 7) | (this.ret.i);
    }
}
class B_LTE extends Instruct {
    static CODE = Instruct.CODE(35);
    left; right; ret;
    constructor(block, ctx, fCtx, lr, rr, retR) {
        super(block, ctx, fCtx);
        this.left = lr;
        this.right = rr;
        this.ret = retR;
    }
    toU32() {
        return this.constructor.CODE |
            (this.left.getTypeId() << 20) |
            (this.left.i << 14) | (this.right.i << 7) | (this.ret.i);
    }
}
class B_GT extends Instruct {
    static CODE = Instruct.CODE(36);
    left; right; ret;
    constructor(block, ctx, fCtx, lr, rr, retR) {
        super(block, ctx, fCtx);
        this.left = lr;
        this.right = rr;
        this.ret = retR;
    }
    toU32() {
        return this.constructor.CODE |
            (this.left.getTypeId() << 20) |
            (this.left.i << 14) | (this.right.i << 7) | (this.ret.i);
    }
}
class B_GTE extends Instruct {
    static CODE = Instruct.CODE(37);
    left; right; ret;
    constructor(block, ctx, fCtx, lr, rr, retR) {
        super(block, ctx, fCtx);
        this.left = lr;
        this.right = rr;
        this.ret = retR;
    }
    toU32() {
        return this.constructor.CODE |
            (this.left.getTypeId() << 20) |
            (this.left.i << 14) | (this.right.i << 7) | (this.ret.i);
    }
}
class B_SLF extends Instruct {
    static CODE = Instruct.CODE(38);
    retReg;
    constructor(block, ctx, fCtx, retR) {
        super(block, ctx, fCtx);
        this.retReg = retR;
    }
    toU32() {
        return this.constructor.CODE | (this.retReg.i);
    }
}
class B_ValueNativeCall extends Instruct {
    static CODE = Instruct.CODE(39);
    LibNameIdx;
    constructor(block, ctx, fCtx, libNameIdx) {
        super(block, ctx, fCtx);
        this.LibNameIdx = libNameIdx;
    }
    toU32() {
        return this.constructor.CODE | this.LibNameIdx.toU32();
    }
}
class B_DFSM extends Instruct {
    static CODE = Instruct.CODE(40);
    constructor(block, ctx, fCtx) {
        super(block, ctx, fCtx);
    }
    toU32() {
        return this.constructor.CODE;
    }
}

class B_FSMBroadcastMsg extends Instruct {
    static CODE = Instruct.CODE(41);
    title; bodyExpr;
    sendToSelf;
    constructor(block, ctx, fCtx, title, sendToSelf, bodyExpr) {
        super(block, ctx, fCtx);
        this.title = title;
        this.bodyExpr = bodyExpr;
        this.sendToSelf = sendToSelf ? 1 : 0;
    }
    toU32() {
        if (this.bodyExpr) {
            return this.constructor.CODE |
                (this.sendToSelf << 23) |
                (this.title.i << 10) |
                (this.bodyExpr.getTypeId() << 6)
                | this.bodyExpr.i;
        } else {
            return this.constructor.CODE |
                (this.sendToSelf << 23) |
                (this.title.i << 10) |
                0x3ff;// 低位全1
        }
    }
}
/**
 * 单元数操作
 */
class B_SGLF extends Instruct {
    static CODE = Instruct.CODE(42);
    value;
    opcode;
    constructor(block, ctx, fCtx, v, op) {
        super(block, ctx, fCtx);
        if (!(v.is('float') && v.is('float'))) {
            throw Error('must be float.')
        }
        this.value = v;
        this.opcode = op;
    }
    toU32() {
        return this.constructor.CODE | (this.opcode << 16) | this.value.i;
    }
}

class B_RAND extends Instruct {
    static CODE = Instruct.CODE(43);
    retReg;
    constructor(block, ctx, fCtx, retR) {
        super(block, ctx, fCtx);
        this.retReg = retR;
    }
    toU32() {
        return this.constructor.CODE | (this.retReg.i);
    }
}
class B_F2I extends Instruct {
    static CODE = Instruct.CODE(44);
    intReg; floatReg;
    constructor(block, ctx, fCtx, floatReg, intReg) {
        super(block, ctx, fCtx);
        this.intReg = intReg;
        this.floatReg = floatReg;
    }
    toU32() {
        return this.constructor.CODE | (this.intReg.i << 12) | (this.floatReg.i);
    }
}
class B_FSMSendMsgWait_Data extends Instruct {
    static CODE = Instruct.CODE(45);
    title; target; bodyExpr;
    constructor(block, ctx, fCtx, title, target, bodyExpr) {
        super(block, ctx, fCtx);
        this.title = title;
        this.target = target;
        this.bodyExpr = bodyExpr;
    }
    toU32() {
        if (this.bodyExpr) {
            return this.constructor.CODE |
                (this.target.i << 17) |
                (this.title.i << 10) |
                (this.bodyExpr.getTypeId() << 6)
                | this.bodyExpr.i;
        } else {
            return this.constructor.CODE |
                (this.target.i << 17) |
                (this.title.i << 10) |
                0x3ff;// 低位全1
        }
    }
}
class B_FSMSendMsgWait extends Instruct {
    static CODE = Instruct.CODE(46);
    waitSecond;
    constructor(block, ctx, fCtx, waitSecond) {
        super(block, ctx, fCtx);
        this.waitSecond = waitSecond;
    }
    toU32() {
        return this.constructor.CODE | (this.waitSecond.i << 17);
    }
}
class B_FSMBroadcastMsgWait extends Instruct {
    static CODE = Instruct.CODE(47);
    title; bodyExpr; waitSecond;
    sendToSelf;
    constructor(block, ctx, fCtx, title, sendToSelf, bodyExpr, waitSecond) {
        super(block, ctx, fCtx);
        this.title = title;
        this.bodyExpr = bodyExpr;
        this.sendToSelf = sendToSelf ? 1 : 0;
        this.waitSecond = waitSecond;
    }
    toU32() {
        if (this.bodyExpr) {
            return this.constructor.CODE |
                (this.sendToSelf << 23) |
                (this.waitSecond.i << 17) |
                (this.title.i << 10) |
                (this.bodyExpr.getTypeId() << 6)
                | this.bodyExpr.i;
        } else {
            return this.constructor.CODE |
                (this.sendToSelf << 23) |
                (this.waitSecond.i << 17) |
                (this.title.i << 10) |
                0x3ff;// 低位全1
        }
    }
}
class B_TextJoin extends Instruct {
    static CODE = Instruct.CODE(48);
    left; right; retReg;
    constructor(block, ctx, fCtx, left, right, retReg) {
        super(block, ctx, fCtx);
        this.left = left;
        this.right = right;
        this.retReg = retReg;
    }
    toU32() {
        return this.constructor.CODE | (this.left.i << 17) | (this.right.i << 9) | this.retReg.i;
    }
}
class B_ToString extends Instruct {
    static CODE = Instruct.CODE(49);
    input; retReg;
    constructor(block, ctx, fCtx, input, retReg) {
        super(block, ctx, fCtx);
        this.input = input;
        this.retReg = retReg;
    }
    toU32() {
        return this.constructor.CODE | (this.input.getTypeId() << 20) | (this.input.i << 10) | this.retReg.i;
    }
}
class B_Sender extends Instruct {
    static CODE = Instruct.CODE(50);
    retReg;
    constructor(block, ctx, fCtx, retReg) {
        super(block, ctx, fCtx);
        this.retReg = retReg;
    }
    toU32() {
        return this.constructor.CODE | this.retReg.i;
    }
}
/**
 * value of map by key
 */
class B_VOM extends Instruct {
    static CODE = Instruct.CODE(51);
    map; key; ret;
    constructor(block, ctx, fCtx, map, key, ret) {
        super(block, ctx, fCtx);
        this.map = map;
        this.key = key;
        this.ret = ret;
    }
    toU32() {
        if (this.key.rtype != 'string') {
            this.throwError("字符串映射取值的名称必须是字符串寄存器");
        }
        return this.constructor.CODE | (this.map.i << 18) | (this.key.i << 12) | (this.ret.i << 6) | this.ret.getTypeId();
    }
}
class B_SHL extends Instruct {
    static CODE = Instruct.CODE(52);
    value; bitCount;
    constructor(block, ctx, fCtx, value, bitCount) {
        super(block, ctx, fCtx);
        this.value = value;
        this.bitCount = bitCount;
    }
    toU32() {
        if (this.value.rtype != 'integer') {
            this.throwError("二进制左移操作数寄存器必须是整数寄存器");
        }
        if (this.bitCount.rtype != 'integer') {
            this.throwError("二进制左移位数寄存器必须是整数寄存器");
        }
        return this.constructor.CODE | (this.value.i << 12) | this.bitCount.i;
    }
}
class B_AND extends Instruct {
    static CODE = Instruct.CODE(53);
    a; b;
    constructor(block, ctx, fCtx, a, b) {
        super(block, ctx, fCtx);
        this.a = a;
        this.b = b;
    }
    toU32() {
        if (this.a.rtype != 'integer') {
            this.throwError("逻辑且A寄存器必须是整数寄存器");
        }
        if (this.b.rtype != 'integer') {
            this.throwError("逻辑且B寄存器必须是整数寄存器");
        }
        return this.constructor.CODE | (this.a.i << 12) | this.b.i;
    }
}
class B_FIX extends Instruct {
    static CODE = Instruct.CODE(54);
    argRegister;
    constructor(block, ctx, fCtx, r) {
        super(block, ctx, fCtx);
        this.argRegister = r;
    }
    toU32() {
        return this.constructor.CODE | (this.argRegister.getTypeId() << 20) | this.argRegister.i;
    }
}
class B_LAND extends Instruct {
    static CODE = Instruct.CODE(55);
    a; b;
    constructor(block, ctx, fCtx, a, b) {
        super(block, ctx, fCtx);
        this.a = a;
        this.b = b;
    }
    toU32() {
        if (this.a.rtype != 'integer') {
            this.throwError("逻辑且A寄存器必须是整数寄存器");
        }
        if (this.b.rtype != 'integer') {
            this.throwError("逻辑且B寄存器必须是整数寄存器");
        }
        return this.constructor.CODE | (this.a.i << 12) | this.b.i;
    }
}
class B_LOR extends Instruct {
    static CODE = Instruct.CODE(56);
    a; b;
    constructor(block, ctx, fCtx, a, b) {
        super(block, ctx, fCtx);
        this.a = a;
        this.b = b;
    }
    toU32() {
        if (this.a.rtype != 'integer') {
            this.throwError("逻辑或A寄存器必须是整数寄存器");
        }
        if (this.b.rtype != 'integer') {
            this.throwError("逻辑或B寄存器必须是整数寄存器");
        }
        return this.constructor.CODE | (this.a.i << 12) | this.b.i;
    }
}
class B_LNOT extends Instruct {
    static CODE = Instruct.CODE(57);
    a;
    constructor(block, ctx, fCtx, a) {
        super(block, ctx, fCtx);
        this.a = a;
    }
    toU32() {
        if (this.a.rtype != 'integer') {
            this.throwError("逻辑非寄存器必须是整数寄存器");
        }
        return this.constructor.CODE | this.a.i;
    }
}
class B_COND extends Instruct {
    static CODE = Instruct.CODE(58);
    if_; then_; else_;
    constructor(block, ctx, fCtx, if_, then_, else_) {
        super(block, ctx, fCtx);
        this.if_ = if_;
        this.then_ = then_;
        this.else_ = else_;
    }
    toU32() {
        if (this.else_.rtype != this.then_.rtype) {
            this.throwError("计算值类型不同");
        }
        return this.constructor.CODE | (this.if_.i << 18) | (this.then_.i << 12) | (this.else_.i << 6) | this.then_.getTypeId();
    }
}

class B_NEW extends Instruct {
    static CODE = Instruct.CODE(59);
    str;
    register;
    constructor(block, ctx, fCtx, str, r) {
        super(block, ctx, fCtx);
        if (!r.is('object')) {
            throw Error('must be object');
        }
        this.str = str;
        this.register = r;
    }
    toU32() {
        return this.constructor.CODE | (this.register.i << 18) | this.str.toU32();
    }
}
class B_CSTR extends Instruct {
    static CODE = Instruct.CODE(60);
    value; min; max; ret;
    constructor(block, ctx, fCtx, value, min, max, ret) {
        super(block, ctx, fCtx);
        this.value = value;
        this.min = min;
        this.max = max;
        this.ret = ret;
    }
    toU32() {
        return this.constructor.CODE | (this.ret.i << 18) | (this.value.i << 12) | (this.min.i << 6) | this.max.i;
    }
}
class B_LIST extends Instruct {
    static CODE = Instruct.CODE(61);
    constructor(block, ctx, fCtx, ret, typeIdx) {
        super(block, ctx, fCtx);
        this.ret = ret;
        this.typeIdx = typeIdx
    }
    toU32() {
        return this.constructor.CODE | (this.ret.i << 16) | this.typeIdx;
    }
}
class B_SMAP extends Instruct {
    static CODE = Instruct.CODE(62);
    constructor(block, ctx, fCtx, ret, typeIdx) {
        super(block, ctx, fCtx);
        this.ret = ret;
        this.typeIdx = typeIdx
    }
    toU32() {
        return this.constructor.CODE | (this.ret.i << 16) | this.typeIdx;
    }
}
class B_IMAP extends Instruct {
    static CODE = Instruct.CODE(63);
    constructor(block, ctx, fCtx, ret, typeIdx) {
        super(block, ctx, fCtx);
        this.ret = ret;
        this.typeIdx = typeIdx
    }
    toU32() {
        return this.constructor.CODE | (this.ret.i << 16) | this.typeIdx;
    }
}
class B_STKV extends Instruct {
    static CODE = Instruct.CODE(64);
    constructor(block, ctx, fCtx, map, key, value) {
        super(block, ctx, fCtx);
        this.map = map;
        this.key = key;
        this.value = value;
    }
    toU32() {
        return this.constructor.CODE | (this.map.i << 18) | (this.key.i << 12) | (this.value.i << 6) | this.value.getTypeId();
    }
}
class B_RKOM extends Instruct {
    static CODE = Instruct.CODE(65);
    constructor(block, ctx, fCtx, map, key) {
        super(block, ctx, fCtx);
        this.map = map;
        this.key = key;
    }
    toU32() {
        return this.constructor.CODE | (this.map.i << 16) | (this.key.i);
    }
}
/**
 * size of map by key
 */
class B_SOM extends Instruct {
    static CODE = Instruct.CODE(66);
    map; ret;
    constructor(block, ctx, fCtx, map, ret) {
        super(block, ctx, fCtx);
        this.map = map;
        this.ret = ret;
    }
    toU32() {
        return this.constructor.CODE | (this.map.i << 16) | (this.ret.i);
    }
}
class B_VOIM extends Instruct {
    static CODE = Instruct.CODE(67);
    map; key; ret;
    constructor(block, ctx, fCtx, map, key, ret) {
        super(block, ctx, fCtx);
        this.map = map;
        this.key = key;
        this.ret = ret;
    }
    toU32() {
        if (this.key.rtype != 'integer') {
            this.throwError("整数映射取值的key必须是整数");
        }
        return this.constructor.CODE | (this.map.i << 18) | (this.key.i << 12) | (this.ret.i << 6) | this.ret.getTypeId();
    }
}
class B_STIKV extends Instruct {
    static CODE = Instruct.CODE(68);
    constructor(block, ctx, fCtx, map, key, value) {
        super(block, ctx, fCtx);
        this.map = map;
        this.key = key;
        this.value = value;
    }
    toU32() {
        return this.constructor.CODE | (this.map.i << 18) | (this.key.i << 12) | (this.value.i << 6) | this.value.getTypeId();
    }
}
class B_RKOIM extends Instruct {
    static CODE = Instruct.CODE(69);
    constructor(block, ctx, fCtx, map, key) {
        super(block, ctx, fCtx);
        this.map = map;
        this.key = key;
    }
    toU32() {
        return this.constructor.CODE | (this.map.i << 16) | (this.key.i);
    }
}
/**
 * value at
 */
class B_VAT extends Instruct {
    static CODE = Instruct.CODE(70);
    list; idx; ret;
    constructor(block, ctx, fCtx, list, idx, ret) {
        super(block, ctx, fCtx);
        this.list = list;
        this.idx = idx;
        this.ret = ret;
    }
    toU32() {
        if (this.idx.rtype != 'integer') {
            this.throwError("列表索引必须是整数");
        }
        return this.constructor.CODE | (this.list.i << 18) | (this.idx.i << 12) | (this.ret.i << 6) | this.ret.getTypeId();
    }
}
class B_SVAT extends Instruct {
    static CODE = Instruct.CODE(71);
    constructor(block, ctx, fCtx, list, idx, value) {
        super(block, ctx, fCtx);
        this.list = list;
        this.idx = idx;
        this.value = value;
    }
    toU32() {
        return this.constructor.CODE | (this.list.i << 18) | (this.idx.i << 12) | (this.value.i << 6) | this.value.getTypeId();
    }
}
class B_IVAT extends Instruct {
    static CODE = Instruct.CODE(72);
    constructor(block, ctx, fCtx, list, idx, value) {
        super(block, ctx, fCtx);
        this.list = list;
        this.idx = idx;
        this.value = value;
    }
    toU32() {
        return this.constructor.CODE | (this.list.i << 18) | (this.idx.i << 12) | (this.value.i << 6) | this.value.getTypeId();
    }
}
class B_RVAT extends Instruct {
    static CODE = Instruct.CODE(73);
    constructor(block, ctx, fCtx, list, idx) {
        super(block, ctx, fCtx);
        this.list = list;
        this.idx = idx;
    }
    toU32() {
        return this.constructor.CODE | (this.list.i << 16) | (this.idx.i);
    }
}
class B_VAD extends Instruct {
    static CODE = Instruct.CODE(74);
    constructor(block, ctx, fCtx, valueReg, retReg) {
        super(block, ctx, fCtx);
        this.valueReg = valueReg;
        this.retReg = retReg;
    }
    toU32() {
        return this.constructor.CODE | (this.valueReg.getTypeId() << 20) | (this.valueReg.i << 10) | this.retReg.i;
    }
}
class B_PUSTT extends Instruct {
    static CODE = Instruct.CODE(75);
    str;
    constructor(block, ctx, fCtx, str) {
        super(block, ctx, fCtx);
        this.str = str;
    }

    toU32() {
        return this.constructor.CODE | this.str.toU32();
    }
}
class B_POPSTT extends Instruct {
    static CODE = Instruct.CODE(76);
    constructor(block, ctx, fCtx) {
        super(block, ctx, fCtx);
    }

    toU32() {
        return this.constructor.CODE;
    }
}
class B_DBI extends Instruct {
    static CODE = Instruct.CODE(77);
    blockIdIdx;
    constructor(block, ctx, fCtx, idx) {
        super(block, ctx, fCtx);
        this.blockIdIdx = idx;
    }
    toU32() {
        return this.constructor.CODE | this.blockIdIdx.toU32();
    }
}
class B_DBE extends Instruct {
    static CODE = Instruct.CODE(78);
    register;
    targetRegister;
    constructor(block, ctx, fCtx, idx) {
        super(block, ctx, fCtx);
        this.blockIdIdx = idx;
    }
    toU32() {
        return this.constructor.CODE | (this.register.getTypeId() << 20) | (this.register.i << 10) | (this.targetRegister.i << 0);
    }
}


class B_SME extends Instruct {
    static CODE = Instruct.CODE(79);
    map; key; ret;
    constructor(block, ctx, fCtx, map, key, ret) {
        super(block, ctx, fCtx);
        this.map = map;
        this.key = key;
        this.ret = ret;
    }
    toU32() {
        if (this.key.rtype != 'string') {
            this.throwError("字符串映射取值的名称必须是字符串寄存器");
        }
        return this.constructor.CODE | (this.map.i << 16) | (this.key.i << 8) | (this.ret.i);
    }
}
class B_IME extends Instruct {
    static CODE = Instruct.CODE(80);
    map; key; ret;
    constructor(block, ctx, fCtx, map, key, ret) {
        super(block, ctx, fCtx);
        this.map = map;
        this.key = key;
        this.ret = ret;
    }
    toU32() {
        if (this.key.rtype != 'integer') {
            this.throwError("整数映射取值的名称必须是整数寄存器");
        }
        return this.constructor.CODE | (this.map.i << 16) | (this.key.i << 8) | (this.ret.i);
    }
}
class B_IMA extends Instruct {
    static CODE = Instruct.CODE(81);
    map; ret;
    constructor(block, ctx, fCtx, map, ret) {
        super(block, ctx, fCtx);
        this.map = map;
        this.ret = ret;
    }
    toU32() {
        return this.constructor.CODE | (this.map.i << 12) | (this.ret.i);
    }
}
class B_SMA extends Instruct {
    static CODE = Instruct.CODE(82);
    map; ret;
    constructor(block, ctx, fCtx, map, ret) {
        super(block, ctx, fCtx);
        this.map = map;
        this.ret = ret;
    }
    toU32() {
        return this.constructor.CODE | (this.map.i << 12) | (this.ret.i);
    }
}
class B_CLONE extends Instruct {
    static CODE = Instruct.CODE(83);
    constructor(block, ctx, fCtx, st, ret) {
        super(block, ctx, fCtx);
        this.st = st;
        this.ret = ret;
    }
    toU32() {
        return this.constructor.CODE | (this.ret.getTypeId() << 20) | (this.st.i << 10) | (this.ret.i);
    }
}