/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

OpenBlock.nameToValueType = function (typeName) {
    switch (typeName) {
        case 'Integer':
        case 'Boolean':
        case 'Number':
        case 'Float':
        case 'Colour':
        case 'String':
            let sft = new StructFieldType();
            sft.setName(typeName);
            return sft;
        case 'integer_map':
            return new StructFieldTypeIntegerMap();
        case 'string_map':
            return new StructFieldTypeStringMap();
        case 'list':
            return new StructFieldTypeList();
        case 'FSM':
            let ast = new StructFieldTypeNative();
            ast.setName(typeName);
            return ast;
        default:
            let nativeType = OpenBlock.nativeTypes[typeName];
            if (nativeType) {
                let ast = new StructFieldTypeNative();
                ast.setName(typeName);
                return ast;
            } else {
                let ast = new StructFieldTypeStruct();
                ast.setName(typeName);
                return ast;
            }
    }
};
OpenBlock.textToValueType = function (typeName) {
    if ((!typeName) || typeName.length === 0 || typeName === 'void') {
        return null;
    }
    let l = typeName.indexOf('<');
    if (l > 0) {
        let r = typeName.lastIndexOf('>');
        let name = typeName.substr(0, l);
        let type = OpenBlock.nameToValueType(name);
        let elemTypeName = typeName.substring(l + 1, r);
        let elemType = OpenBlock.textToValueType(elemTypeName);
        type.setElementType(elemType);
        return type;
    } else {
        return OpenBlock.nameToValueType(typeName);
    }
}
OpenBlock.getTypeIdByName = function (name) {
    // 由于使用4bit表示寄存器类型，所以表示范围只能是 0~F 16种
    name = name.toLowerCase();

    switch (name) {
        case 'boolean':
        case 'integer':
        case 'colour':
            return 0;
        case 'number':
        case 'float':
            return 1;
        case 'string':
            return 2;
        case 'object':
            return 3;
        case 'fsm':
        case 'nobject':
            return 4;
        default:
            throw Error('Unknown type ' + name);
    }
}
OpenBlock.normalizeType = function (name) {
    let id = OpenBlock.getTypeIdByName(name);
    switch (id) {
        case 0:
            return 'integer';
        case 1:
            return 'float';
        case 2:
            return 'string';
        case 3:
            return 'object';
        case 4:
            return 'Nobject';
        default:
            throw Error('Unknown type id' + id + " " + name);
    }
}
class AST {
    name;
    blockId;
    setBlockId(bId) {
        if (typeof (bId) === 'string') {
            this.blockId = bId;
        } else {
            throw Error('wrong type of blockId . need string:' + typeof (bId));
        }
    }
    setName(name) {
        if (typeof (name) != 'string') {
            throw Error('name should be string');
        }
        this.name = name;
    }
}
class Expr extends AST {
}
class ErrorAST extends AST {
    constructor() {
        super();
        this.name = 'ErrorAST';
    }
}
Serializable(ErrorAST);

class Definition extends AST {
}
class ArchitectureDef extends Definition {
    name;
    addFunction(func) {
        if (!Array.isArray(this.functions)) {
            throw Error(this.__proto__.constructor.name + ' does not have a array of function.')
        }
        if (!(func instanceof FunctionDef)) {
            throw Error('not a function definition.')
        }

        this.functions.push(func);
    }
    addVariable(variableDeclaration) {
        if (!Array.isArray(this.variables)) {
            throw Error(this.__proto__.constructor.name + ' does not have a array of variable.')
        }
        if (!(variableDeclaration instanceof VariableDeclaration)) {
            throw Error('not a variable definition.')
        }

        this.variables.push(variableDeclaration);
    }
    addStruct(structDef) {
        if (!Array.isArray(this.structs)) {
            throw Error(this.__proto__.constructor.name + ' does not have a array of struct.')
        }
        if (!(structDef instanceof StructDef)) {
            throw Error('not a struct definition.')
        }
        structDef.setFullname(this.name + "." + structDef.name);
        this.structs.push(structDef);
    }
}
class Type extends Definition { }

// ++++++ struct +++++++
class StructDef extends ArchitectureDef {
    fields = [];
    fullname;
    registers = {
        float: [],
        integer: [],
        string: [],
        object: [],
        Nobject: []
    }
    setFullname(name) {
        if (typeof (name) === 'string') {
            this.fullname = name;
        } else {
            throw Error('全名必须是字符串');
        }
    }
    addField(f) {
        if (!(f instanceof StructField)) {
            throw Error('需要指定结构体字段');
        }
        let registerType = f.registerType();
        f.setRegisterIndex(this.registers[registerType].length);
        this.registers[registerType].push(f);
        this.fields.push(f);
    }
    registerSize() {
        return this.registers.float.length +
            this.registers.integer.length +
            this.registers.string.length +
            this.registers.object.length +
            this.registers.Nobject.length;
    }
    wrapError(e) {
        e.struct = this.name;
    }
}
Serializable(StructDef);
class StructField extends Definition {
    type;
    registerIndex;
    setType(type) {
        if (!(type instanceof StructFieldType)) {
            throw Error('需要指定类型');
        }
        this.type = type;
    }
    registerType() {
        return this.type.registerType();
    }
    setRegisterIndex(idx) {
        this.registerIndex = idx;
    }
    compile() {
        return this.type.compile();
    }
}
Serializable(StructField);
class StructFieldType extends Expr {
    registerType() {
        return OpenBlock.normalizeType(this.name);
    }
    isPrimity() {
        let typeName = this.registerType();
        switch (typeName) {
            case 'integer':
            case 'float':
            case 'string':
                return true;
            default:
                return false;
        }
    }
    isCollection() {
        return false;
    }
    toCodeText() {
        return this.name;
    }
    compile() {
        return 'S' + this.name + ';';// struct
    }
}
Serializable(StructFieldType);
class StructFieldTypeNative extends StructFieldType {
    registerType() {
        return 'Nobject';
    }
    toCodeText() {
        return this.name;
    }
}
Serializable(StructFieldTypeNative);
class StructFieldTypeStruct extends StructFieldType {
    registerType() {
        return 'object';
    }
    toCodeText() {
        return this.name;
    }
}
Serializable(StructFieldTypeStruct);
class StructFieldTypeList extends StructFieldTypeStruct {
    elementType;
    setElementType(type) {
        if (!(type instanceof StructFieldType)) {
            throw Error('需要指定元素类型');
        }
        this.elementType = type;
        this.name = this.toCodeText();
    }
    isCollection() {
        return true;
    }
    toCodeText() {
        return "list<" + this.elementType.toCodeText() + ">";
    }
    compile() {
        return 'L' + this.elementType.compile();// list
    }
}
Serializable(StructFieldTypeList);
class StructFieldTypeStringMap extends StructFieldTypeStruct {
    elementType;
    setElementType(type) {
        if (!(type instanceof StructFieldType)) {
            throw Error('需要指定元素类型');
        }
        this.elementType = type;
        this.name = this.toCodeText();
    }
    isCollection() {
        return true;
    }
    toCodeText() {
        return "string_map<" + this.elementType.toCodeText() + ">";
    }
    compile() {
        return 'N' + this.elementType.compile();// named
    }
}
Serializable(StructFieldTypeStringMap);
class StructFieldTypeIntegerMap extends StructFieldTypeStruct {
    elementType;
    setElementType(type) {
        if (!(type instanceof StructFieldType)) {
            throw Error('需要指定元素类型');
        }
        this.elementType = type;
        this.name = this.toCodeText();
    }
    isCollection() {
        return true;
    }
    toCodeText() {
        return "integer_map<" + this.elementType.toCodeText() + ">";
    }
    compile() {
        return 'I' + this.elementType.compile();// indexed
    }
}
Serializable(StructFieldTypeIntegerMap);
// -------- struct --------
// class T_Void extends Type {
// }
// Serializable(T_Void);
// class T_Integer extends Type {

// }
// Serializable(T_Integer);
// class T_Float extends Type {

// }
// Serializable(T_Float);
// class T_String extends Type {

// }
// Serializable(T_String);
// class T_Compound extends Type {
//     name;
// }
// Serializable(T_Compound);
// class T_Container extends Type{
//     elementType;
//     setElementType(type){
//         if( ! (type instanceof Type)){
//             throw Error('need a Type');
//         }
//         this.elementType = type;
//     }
// }
// Serializable(T_Container);

// class T_List extends T_Container {

// }
// Serializable(T_List);
// class T_StringMap extends T_Container {

// }
// Serializable(T_StringMap);
// class T_IntegerMap extends T_Container {

// }
// Serializable(T_IntegerMap);
class ArgDef extends Definition {
    type;
    setType(typeDef) {
        if (!(typeDef instanceof StructField)) {
            throw Error('ReturnType must be Type', typeDef);
        }
        this.type = typeDef;
    }
}
Serializable(ArgDef);

class StatementDef extends Definition {
    variables = [];
    instructions = [];
    addVarDecl(ast) {
        if (!(ast instanceof VariableDeclaration)) {
            throw Error('not a variable decl');
        }
        this.variables.push(ast);
    }
    addInstruction(ast) {
        if (!(ast instanceof Instruction)) {
            throw Error('not a instruction');
        }
        this.instructions.push(ast);
    }
}
Serializable(StatementDef);
class ValueExpr extends Expr { }
class StructExpr extends ValueExpr { }
class ListExpr extends StructExpr { }
class MapExpr extends StructExpr { }
class IMapExpr extends MapExpr { }
class SMapExpr extends MapExpr { }
class FSMExpr extends ValueExpr { }
class NumberExpr extends ValueExpr { }
class BooleanExpr extends ValueExpr { }
Serializable(NumberExpr);
class FloatExpr extends NumberExpr { }
Serializable(FloatExpr);
class Random extends FloatExpr { }
Serializable(Random);
class FloatConstExpr extends FloatExpr {
    number;
    /**
     * NaN,POSITIVE_INFINITY,NEGATIVE_INFINITY
     */
    special;
    constructor(n) {
        super();
        this.number = n;
    }
}
Serializable(FloatConstExpr);
class IntegerExpr extends NumberExpr { }
Serializable(IntegerExpr);
class IntegerConstExpr extends IntegerExpr {
    number;
    constructor(n) {
        super();
        this.number = n;
    }
}
Serializable(IntegerConstExpr);
class RandomInt extends IntegerExpr {
    /**
     * @type {FloatExpr}
     */
    From; To;
}
Serializable(RandomInt);
class TextExpr extends ValueExpr { }
class TextConstExpr extends TextExpr {
    text;
    constructor(text) {
        super();
        if (text) {
            this.setText(text);
        }
    }
    setText(text) {
        if (typeof (text) !== 'string') {
            throw Error('argument must be string', text);
        }
        this.text = text;
    }
}
Serializable(TextConstExpr);

class VariableDeclaration extends Definition {
    name;
    type;
    value;
    export;
    RegisterType;
    constructor(proto) {
        super();
        if (proto) {
            this.setName(proto.name);
            this.type = proto.type;
            this.export = proto.export;
        }
    }
    setRegisterType(t) {
        this.RegisterType = t;
    }
    makeSetLocalVariableValue() {
        let ast = new SetLocalVariableValue();
        ast.setName(this.name);
        let value = this.value;
        ast.setValue(value);
        ast.setBlockId(this.blockId);
        return ast;
    }
}
Serializable(VariableDeclaration);

class Instruction extends AST { }
class Dummy extends AST { }
class SubStatement extends Instruction { }
Serializable(Instruction);

class FunctionDef extends Definition {
    body;
    args = [];
    returnType = null;
    name;
    // 以下字段编译时生成
    signature;
    fullname;
    scope;
    setReturnType(typeDef) {
        if (!typeDef) {
            this.returnType = null;
            return;
        }
        if (!(typeDef instanceof StructFieldType)) {
            throw Error('ReturnType must be Type', typeDef);
        }
        this.returnType = typeDef;
    }
    addArg(f) {
        if (!(f instanceof StructField)) {
            throw Error('需要指定结构体字段');
        }
        if (this.args.find(a => a.name === f.name)) {
            throw Error('重复参数 ' + f.name);
        }
        // let registerType = f.registerType();
        // f.setRegisterIndex(this.registers[registerType].length);
        // this.registers[registerType].push(f);
        this.args.push(f);
    }
    setBody(body) {
        if (!(body instanceof StatementDef)) {
            throw Error(body);
        }
        this.body = body;
    }
    buildSignature() {
        let signature = this.fullname + '(' + this.args.map(a => { return a.type.compile() }).join() + ')' + (this.returnType ? this.returnType.compile() : "v");
        this.signature = signature;
        return signature;
    }
    genSignature(parent, ctx) {
        this.scope = parent.scopeName();
        let fullname = parent.fullname(ctx) + '.' + this.name;
        this.fullname = fullname;
        return this.buildSignature();
    }
}
Serializable(FunctionDef);

class EventHandlerDef extends FunctionDef {
    name;
    setEventName(name) {
        if (typeof (name) !== 'string') {
            throw Error('name must be string', name);
        }
        this.name = name;
    }
}
Serializable(EventHandlerDef);
class MessageHandlerDef extends FunctionDef {
    title;
    messageType = '';
    setTitle(title) {
        if (typeof (title) !== 'string') {
            throw Error('title must be string', title);
        }
        this.title = title;
        this.updateName();
    }
    setMessageType(typeName) {
        if (typeof (typeName) !== 'string') {
            throw Error('title must be string', typeName);
        }
        this.messageType = typeName;
        this.updateName();
    }
    updateName() {
        this.name = this.title + ":" + this.messageType;
    }
}
Serializable(MessageHandlerDef);

class StateDef extends ArchitectureDef {
    functions = [];
    eventHandlers = [];
    messageHandlers = [];
    variables = [];
    scopeName() {
        return 'state';
    }
    addEventHandler(eventHandlerDef) {
        if (!(eventHandlerDef instanceof EventHandlerDef)) {
            throw Error('not a event handler definition.')
        }

        this.eventHandlers.push(eventHandlerDef);
    }
    addMessageHandler(messageHandlerDef) {
        if (!(messageHandlerDef instanceof MessageHandlerDef)) {
            throw Error('not a message handler definition.')
        }
        this.messageHandlers.push(messageHandlerDef);
    }
    addVariable(variableDeclaration) {
        if (!Array.isArray(this.variables)) {
            throw Error(this.__proto__.constructor.name + ' does not have a array of variable.')
        }
        if (!(variableDeclaration instanceof VariableDeclaration)) {
            throw Error('not a variable definition.')
        }

        this.variables.push(variableDeclaration);
    }
    fullname(ctx) {
        return ctx.currentModule.name + '.' + ctx.currentFSM.name + '.' + this.name;
    }
    wrapError(e) {
        e.state = this.name;
    }
}
Serializable(StateDef);

class FSMDef extends ArchitectureDef {
    states = [];
    functions = [];
    variables = [];
    structs = [];
    constructor(proto) {
        super();
        if (proto) {
            this.setName(proto.name);
        }
    }
    scopeName() {
        return 'fsm';
    }
    addState(stateDef) {
        if (!(stateDef instanceof StateDef)) {
            throw Error('not a state definition.')
        }

        this.states.push(stateDef);
    }
    fullname(ctx) {
        return ctx.currentModule.name + '.' + this.name;
    }
    wrapError(e) {
        e.fsm = this.name;
    }
}
Serializable(FSMDef);

class ModuleDef extends ArchitectureDef {
    fsms = [];
    functions = [];
    structs = [];
    env = [];
    scopeName() {
        return 'global';
    }
    addFSM(fsmDef) {
        if (!(fsmDef instanceof FSMDef)) {
            throw Error('not a FSM definition.')
        }
        this.fsms.push(fsmDef);
    }
    fullname(ctx) {
        return this.name;
    }
    wrapError(e) {
        e.src = this.name;
    }
}
Serializable(ModuleDef);


class NOP extends Instruction { }
Serializable(NOP);
class Comment extends Instruction { };
Serializable(Comment);
class LOG extends Instruction {
    expr;
    setExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('not expr', expr);
        }
        this.expr = expr;
    }
}
Serializable(LOG);

class ARITH extends NumberExpr {
    left; right; op;
    setOP(op) {
        this.op = op;
    }
    setLeft(ast) {
        if (!(ast instanceof ValueExpr)) {
            throw Error('not expr', ast);
        }
        this.left = ast;
    }
    setRight(ast) {
        if (!(ast instanceof ValueExpr)) {
            throw Error('not expr', ast);
        }
        this.right = ast;
    }
}
Serializable(ARITH);
class MathSingle extends FloatExpr {
    value; op;
    setOP(op) {
        this.op = op;
    }
    setValue(ast) {
        if (!(ast instanceof ValueExpr)) {
            throw Error('not expr', ast);
        }
        this.value = ast;
    }
}
Serializable(MathSingle);
class I2F extends IntegerExpr {
    number;
    constructor(number) {
        super();
        if (number) {
            // if (!(number instanceof IntegerExpr)) {
            //     throw Error(number);
            // }
            this.number = number;
        }
    }
}
Serializable(I2F)
class F2I extends FloatExpr {
    number;
    constructor(number) {
        super();
        if (number) {
            // if (!(number instanceof NumberExpr)) {
            //     throw Error(number);
            // }
            this.number = number;
        }
    }
}
Serializable(F2I)
class Compare extends BooleanExpr {
    left; right; op;
    setOP(op) {
        this.op = op;
    }
    setLeft(ast) {
        if (!(ast instanceof ValueExpr)) {
            throw Error('not expr', ast);
        }
        this.left = ast;
    }
    setRight(ast) {
        if (!(ast instanceof ValueExpr)) {
            throw Error('not expr', ast);
        }
        this.right = ast;
    }
}
Serializable(Compare);

class FSMSendMessage extends Instruction {
    targetExpr;
    title;
    bodyExpr;
    setTargetExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.targetExpr = expr;
    }
    setTitle(t) {
        if (!(t instanceof TextConstExpr)) {
            throw Error('标题必须是字符串');
        }
        this.title = t;
    }
    setBodyExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.bodyExpr = expr;
    }
}
Serializable(FSMSendMessage);

class FSMSendDynamicMessage extends Instruction {
    targetExpr;
    title;
    bodyExpr;
    setTargetExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.targetExpr = expr;
    }
    setTitle(t) {
        if (!(t instanceof ValueExpr)) {
            throw Error('标题必须是字符串');
        }
        this.title = t;
    }
    setBodyExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.bodyExpr = expr;
    }
}
Serializable(FSMSendDynamicMessage);
class FSMSendMessageWait extends Instruction {
    targetExpr;
    title;
    bodyExpr;
    waitSecond;
    setTargetExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.targetExpr = expr;
    }
    setTitle(t) {
        if (!(t instanceof TextConstExpr)) {
            throw Error('标题必须是字符串');
        }
        this.title = t;
    }
    setBodyExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.bodyExpr = expr;
    }
    setWaitSecond(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.waitSecond = expr;
    }
}
Serializable(FSMSendMessageWait);

class FSMBroadcastMessage extends Instruction {
    title;
    sendToSelf;
    bodyExpr;
    setTitle(t) {
        if (!(t instanceof TextConstExpr)) {
            throw Error('标题必须是字符串');
        }
        this.title = t;
    }
    setBodyExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.bodyExpr = expr;
    }
}
Serializable(FSMBroadcastMessage);
class FSMBroadcastMessageWait extends Instruction {
    title;
    bodyExpr;
    sendToSelf;
    waitSecond;
    setTitle(t) {
        if (!(t instanceof TextConstExpr)) {
            throw Error('标题必须是字符串');
        }
        this.title = t;
    }
    setBodyExpr(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.bodyExpr = expr;
    }
    setWaitSecond(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('需要参数');
        }
        this.waitSecond = expr;
    }
}
Serializable(FSMBroadcastMessageWait);

class ChangeState extends Instruction {
    targetStateName;
    setTargetStateName(name) {
        if (typeof (name) != 'string') {
            throw Error('string wanted.');
        }
        this.targetStateName = name;
    }
}
Serializable(ChangeState);

class PushState extends Instruction {
    targetStateName;
    setTargetStateName(name) {
        if (typeof (name) != 'string') {
            throw Error('string wanted.');
        }
        this.targetStateName = name;
    }
}
Serializable(PushState);
class PopState extends Instruction {
}
Serializable(PopState);
class SetLocalVariableValue extends Instruction {
    value;
    setValue(v) {
        if (!(v instanceof ValueExpr)) {
            throw Error('not expr', v);
        }
        this.value = v;
    }
}
Serializable(SetLocalVariableValue);
class GetLocalVariableValue extends ValueExpr {
}
Serializable(GetLocalVariableValue);
class SetStateVariableValue extends Instruction {
    value;
    setValue(v) {
        if (!(v instanceof ValueExpr)) {
            throw Error('not expr', v);
        }
        this.value = v;
    }
}
Serializable(SetStateVariableValue);
class GetStateVariableValue extends ValueExpr {
}
Serializable(GetStateVariableValue);

class SetFSMVariableValue extends Instruction {
    value;
    setValue(v) {
        if (!(v instanceof ValueExpr)) {
            throw Error('not expr', v);
        }
        this.value = v;
    }
}
Serializable(SetFSMVariableValue);
class GetFSMVariableValue extends ValueExpr {
}
Serializable(GetFSMVariableValue);

class ValueNativeCall extends ValueExpr {
    func;
    args = [];
    setFunc(func) {
        if (!(func instanceof FunctionDef)) {
            throw Error("func must be FunctionDef", func);
        }
        if (typeof (func.libName) != 'string') {
            throw Error("func must be native.(1)");
        }
        if (typeof (func.libHash) != 'string') {
            throw Error("func must be native.(2)");
        }
        if (typeof (func.libIndex) != 'number') {
            throw Error("func must be native.(3)");
        }
        this.func = func;
    }
    setArg(name, expr) {
        if (!(typeof (name) === 'string')) {
            throw Error("名称必须是字符串");
        }
        if (!(expr instanceof ValueExpr)) {
            throw Error('参数不是值参数');
        }
        let arg = this.func.args.findIndex(a => a.name === name);
        if (arg < 0) {
            throw Error("没有找到参数 " + name);
        }
        this.args[arg] = expr;
    }
}
Serializable(ValueNativeCall);
class VoidNativeCall extends Instruction {
    func;
    args = [];
    setFunc(func) {
        ValueNativeCall.prototype.setFunc.call(this, func);
    }
    setArg(name, expr) {
        ValueNativeCall.prototype.setArg.call(this, name, expr);
    }
}
Serializable(VoidNativeCall);

class VoidMethodCall extends Instruction {
    /**
     * @type {String}
     */
    MethodName;
    ArgList = [];

    setMethodName(name) {
        if (typeof (name) !== 'string') {
            throw Error('name must be string');
        }
        this.MethodName = name;
    }
    addArg(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('not expr', expr);
        }
        this.ArgList.push(expr);
    }
}
Serializable(VoidMethodCall);
class ValueMethodCall extends ValueExpr {
    ArgList = [];
    /**
     * @type {String}
     */
    MethodName;
    returnType;
    setMethodName(name) {
        if (typeof (name) !== 'string') {
            throw Error('name must be string');
        }
        this.MethodName = name;
    }
    setReturnType(typeName) {
        if (typeof (typeName) !== 'string') {
            throw Error('type name must be string.');
        }
        this.returnType = typeName;
    }
    addArg(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('not expr', expr);
        }
        this.ArgList.push(expr);
    }
}
Serializable(ValueMethodCall);
class CreateFSM extends FSMExpr {
    fsmTypeName;
    constructor(typeName) {
        super();
        if (typeName) {
            this.setFSMTypeName(typeName);
        }
    }
    setFSMTypeName(typeName) {
        if (!(typeName instanceof TextConstExpr)) {
            throw Error('FSM type name must be string const.')
        }
        this.fsmTypeName = typeName;
    }
}
Serializable(CreateFSM);
class ReceivedMessage extends ValueExpr {
    type;
    constructor(type) {
        super();
        if (type) {
            if (typeof (type) !== 'string') {
                throw Error(type);
            }
            this.type = type;
        }
    }

}
Serializable(ReceivedMessage);
class Clone extends ValueExpr {
    value;
    type;
    constructor(value, type) {
        super();
        this.value = value;
        this.type = type;
    }
}
Serializable(Clone);
class GetStructField extends ValueExpr {
    value; type; fieldName; fieldType;
    constructor(value, type, fieldName, fieldType) {
        super();
        if (value) {
            if (!(value instanceof ValueExpr)) {
                throw Error('value should be Expr');
            }
            if (typeof (fieldName) != 'string') {
                throw Error('field should be string');
            }
            if (typeof (type) != 'string') {
                throw Error('type should be string');
            }
            if (typeof (fieldType) != 'string') {
                throw Error('type should be string');
            }
            this.value = value;
            this.type = type;
            this.fieldName = fieldName;
            this.fieldType = fieldType;
        }
    }
}
Serializable(GetStructField);
class SetStructField extends Instruction {
    stvalue; value; type; fieldName; fieldType;
    constructor(stvalue, type, fieldName, fieldType, value) {
        super();
        if (stvalue) {
            if (!(stvalue instanceof ValueExpr)) {
                throw Error('value should be ValueExpr');
            }
            if (!(value instanceof ValueExpr)) {
                throw Error('value should be ValueExpr');
            }
            if (typeof (fieldName) != 'string') {
                throw Error('field should be string');
            }
            if (typeof (type) != 'string') {
                throw Error('type should be string');
            }
            if (typeof (fieldType) != 'string') {
                throw Error('type should be string');
            }
            this.stvalue = stvalue;
            this.value = value;
            this.type = type;
            this.fieldName = fieldName;
            this.fieldType = fieldType;
        }
    }
}
Serializable(SetStructField);
class RepeatTimes extends SubStatement {
    timesExpr;
    stmt;
    constructor(timesExpr, stmt) {
        super();
        if (timesExpr) {
            this.timesExpr = timesExpr;
            this.stmt = stmt;
        }
    }
}
Serializable(RepeatTimes);
class WhileUntil extends SubStatement {
    mode; bool; statment;
    constructor(mode, bool, statment) {
        super();
        // if (typeof (mode) !== 'boolean') {
        //     throw Error();
        // }
        // if (!(bool instanceof IntegerExpr)) {
        //     throw Error();
        // }
        // if (!(statment instanceof StatementDef)) {
        //     throw Error();
        // }
        this.mode = mode;
        this.bool = bool;
        this.statment = statment;
    }
}
Serializable(WhileUntil);
class ForLoop extends SubStatement {
    varName; stmt; fromExpr; toExpr; byExpr;
    constructor() {
        super();
    }
    setVarName(varName) {
        if (typeof (varName) !== 'string') {
            throw Error('varName 需要字符串常量');
        }
        this.varName = varName;
    }
    setFromExpr(fromExpr) {
        this.fromExpr = fromExpr;
    }
    setToExpr(toExpr) {
        this.toExpr = toExpr;
    }
    setByExpr(byExpr) {
        this.byExpr = byExpr;
    }
    setStmt(stmt) {
        if (stmt instanceof StatementDef) {
            this.stmt = stmt;
        } else {
            throw Error('stmt 需要指令块');
        }
    }
}
Serializable(ForLoop);
class IfControl extends SubStatement {
    ifthenPairs = [];
    addPair(_if, _then) {
        if (!(_if instanceof Expr)) {
            throw Error('if条件需要参数');
        }
        if (!(_then instanceof StatementDef)) {
            throw Error('then需要语句块');
        }
        this.ifthenPairs.push([_if, _then]);
    }
}
Serializable(IfControl);
class Return extends Instruction {
    expr;
    setValue(expr) {
        if (expr) {
            if (!(expr instanceof ValueExpr)) {
                throw Error('必须提供参数');
            }
        }
        this.expr = expr;
    }
}
Serializable(Return);
class Self extends FSMExpr {

}
Serializable(Self);
class Break extends Instruction { }
Serializable(Break);
class Continue extends Instruction { }
Serializable(Continue);
class DFSM extends Instruction {

}
Serializable(DFSM);
class ConstrainNumber extends NumberExpr {
    value;
    max;
    min;
    setMax(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('必须提供参数');
        }
        this.max = expr;
    }
    setMin(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('必须提供参数');
        }
        this.min = expr;
    }
    setValue(expr) {
        if (!(expr instanceof ValueExpr)) {
            throw Error('必须提供参数');
        }
        this.value = expr;
    }
}
Serializable(ConstrainNumber);
class Modulo extends NumberExpr {
    dividend; divisor;
    constructor(d1, d2) {
        super();
        this.dividend = d1;
        this.divisor = d2;
    }
}
Serializable(Modulo);
class ToString extends TextExpr {
    valueExpr;
    constructor(e) {
        super();
        this.valueExpr = e;
    }
}
Serializable(ToString);
class TextJoin extends TextExpr {
    left; right;
    constructor(l, r) {
        super();
        this.left = l;
        this.right = r;
    }
}
Serializable(TextJoin);
class SenderOfReceivedMessage extends FSMExpr {
}
Serializable(SenderOfReceivedMessage);
class ValueOfMap extends ValueExpr {
    /**
     * @type {ValueExpr}
     */
    map; key;
    constructor(map, key) {
        super();
        this.map = map;
        this.key = key;
    }
}
Serializable(ValueOfMap);
class ValueAt extends ValueExpr {
    /**
     * @type {ValueExpr}
     */
    list; idx;
    constructor(list, idx) {
        super();
        this.list = list;
        this.idx = idx;
    }
}
Serializable(ValueAt);
class ValueOfIMap extends ValueExpr {
    /**
     * @type {ValueExpr}
     */
    map; key;
    constructor(map, key) {
        super();
        this.map = map;
        this.key = key;
    }
}
Serializable(ValueOfIMap);
/*
 * remove key of map
 */
class RKOM extends Instruction {
    /**
     * @type {ValueExpr}
     */
    map; key;
    constructor(map, key) {
        super();
        this.map = map;
        this.key = key;
    }
}
Serializable(RKOM);
class RKOIM extends Instruction {
    /**
     * @type {ValueExpr}
     */
    map; key;
    constructor(map, key) {
        super();
        this.map = map;
        this.key = key;
    }
}
Serializable(RKOIM);
class SizeOfMap extends IntegerExpr {
    /**
     * @type {ValueExpr}
     */
    map;
    constructor(map) {
        super();
        this.map = map;
    }
}
Serializable(SizeOfMap);
class STKV extends Instruction {
    /**
     * @type {ValueExpr}
     */
    map; key; value;
    constructor(map, key, value) {
        super();
        this.map = map;
        this.key = key;
        this.value = value;
    }
}
Serializable(STKV);
class SVAT extends Instruction {
    /**
     * @type {ValueExpr}
     */
    list; idx; value;
    constructor(list, idx, value) {
        super();
        this.list = list;
        this.idx = idx;
        this.value = value;
    }
}
Serializable(SVAT);
class RVAT extends Instruction {
    /**
     * @type {ValueExpr}
     */
    list; idx;
    constructor(list, idx, value) {
        super();
        this.list = list;
        this.idx = idx;
    }
}
Serializable(RVAT);
class IVAT extends Instruction {
    /**
     * @type {ValueExpr}
     */
    list; idx; value;
    constructor(list, idx, value) {
        super();
        this.list = list;
        this.idx = idx;
        this.value = value;
    }
}
Serializable(IVAT);
class STIKV extends Instruction {
    /**
     * @type {ValueExpr}
     */
    map; key; value;
    constructor(map, key, value) {
        super();
        this.map = map;
        this.key = key;
        this.value = value;
    }
}
Serializable(STIKV);
class SHL extends IntegerExpr {
    value; bitCount;
    constructor(value, bitCount) {
        super();
        this.value = value;
        this.bitCount = bitCount;
    }
}
Serializable(SHL);
class BitAnd extends IntegerExpr {
    a; b;
    constructor(a, b) {
        super();
        this.a = a;
        this.b = b;
    }
}
Serializable(BitAnd);
class LogicAnd extends BooleanExpr {
    A; B;
    constructor(A, B) {
        super();
        this.A = A;
        this.B = B;
    }
}
Serializable(LogicAnd);
class LogicOr extends BooleanExpr {
    A; B;
    constructor(A, B) {
        super();
        this.A = A;
        this.B = B;
    }
}
Serializable(LogicOr);
class LogicNot extends BooleanExpr {
    A;
    constructor(A) {
        super();
        this.A = A;
    }
}
Serializable(LogicNot);
class Conditional extends ValueExpr {
    IF; THEN; ELSE;
    constructor(I, T, E) {
        super();
        this.IF = I;
        this.THEN = T;
        this.ELSE = E;
    }
}
Serializable(Conditional);
/**
 * 临时固化寄存器内容
 * 用于将寄存器当做参数传入其他指令时，避免其他指令将该寄存器return
 * 必须跟 UnfixedRegister 成对出现，否则编译器对寄存器释放检查会报告异常
 */
class FixRegister extends ValueExpr {
    static id = 0;
    iid;
    value;
    unfixed = false;
    constructor(v) {
        super();
        if (v) {
            this.value = v;
            this.iid = FixRegister.id++;
        }
    }
    unfix() {
        if (this.unfixed) {
            throw Error();
        }
        this.unfixed = true;
        return new UnfixRegister(this.iid);
    }
}
Serializable(FixRegister);
/**
 * 取消固化寄存器内容
 * 与 FixRegister 配对出现
 * 此指令
 */
class UnfixRegister extends ValueExpr {
    fid;
    constructor(fid) {
        super();
        this.fid = fid;
    }
}
Serializable(UnfixRegister);
class NewStruct extends StructExpr {
    structType;
    constructor(t) {
        super();
        this.structType = t;
    }
}
Serializable(NewStruct);


class CreateList extends ListExpr {
    elementType;
    setElementType(t) {
        if (!t) {
            throw Error('element type is ' + t);
        }
        this.elementType = t;
    }
}
Serializable(CreateList);

class CreateStringMap extends SMapExpr {
    elementType;
    setElementType(t) {
        if (!t) {
            throw Error('element type is ' + t);
        }
        this.elementType = t;
    }
}
Serializable(CreateStringMap);

class CreateIntMap extends IMapExpr {
    elementType;
    setElementType(t) {
        if (!t) {
            throw Error('element type is ' + t);
        }
        this.elementType = t;
    }
}
Serializable(CreateIntMap);
/**
 * openblock变量必须初始化，此命令不再有意义
 */
class VarAssigned extends Expr {
    value;
    setValue(v) {
        if (!v) {
            throw Error('element type is ' + v);
        }
        if (v instanceof FloatConstExpr ||
            v instanceof TextConstExpr ||
            v instanceof IntegerConstExpr) {
            throw Error(OpenBlock.i('不可用常量表达式'));
        }
        this.value = v;
    }
}
Serializable(VarAssigned);
class SME extends BooleanExpr {
    map;
    key;
    constructor(map, key) {
        super();
        this.map = map;
        this.key = key;
    }
}
Serializable(SME);
class IME extends BooleanExpr {
    map;
    key;
    constructor(map, key) {
        super();
        this.map = map;
        this.key = key;
    }
}
Serializable(IME);
class SMA extends ListExpr {
    map;
    constructor(map) {
        super();
        this.map = map;
    }
}
Serializable(SMA);
class IMA extends ListExpr {
    map;
    constructor(map) {
        super();
        this.map = map;
    }
}
Serializable(IMA);
// ++++ struct def ++++
StructDef.prototype.compile = function (structsInfo) {
    let fullname = this.fullname;
    if (structsInfo[fullname]) {
        throw Error('重复定义的数据结构：' + fullname);
    }
    let info = {};
    info.floatCnt = this.registers.float.length;
    info.integerCnt = this.registers.integer.length;
    info.stringCnt = this.registers.string.length;
    info.NobjectCnt = this.registers.Nobject.length;
    info.objectCnt = this.registers.object.length;
    info.objectFields = [];
    this.registers.object.forEach(f => {
        info.objectFields.push(f.compile());
    });
    structsInfo[fullname] = info;
};