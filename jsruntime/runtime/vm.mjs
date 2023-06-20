/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
 "use strict"
 import * as util from './util.mjs'
 //const util = require('./util.mjs');
 
 class NativeUtil {
 
     static fieldSetter(target, fieldName, register) {
         return (builder, args) => {
             let getter = builder[register](args[1] & 0xfff);
             builder.PushAction((st, f, local, pos) => {
                 let v = getter(st, f, local);
                 target[fieldName] = v;
                 return 1 + pos;
             });
         };
     }
     static fieldGetter(target, fieldName, register) {
         return (builder, args) => {
             builder[register](args[0] & 0xfff, (st, f, local) => {
                 return target[fieldName];
             });
         };
     }
     static objFieldSetter(fieldName, fieldRegister) {
         return (builder, args) => {
             let obj = builder.NObjectRegister(args[1] & 0xfff);
             let setingV = builder[fieldRegister](args[2] & 0xfff);
             builder.PushAction((st, f, local, pos) => {
                 let o = obj(st, f, local);
                 if (o) {
                     let v = setingV(st, f, local);
                     o[fieldName] = v;
                 }
                 return 1 + pos;
             });
         };
     }
     static objFieldGetter(fieldName, fieldRegister, defaultValue) {
         return (builder, args) => {
             let obj = builder.NObjectRegister(args[1] & 0xfff);
             builder[fieldRegister](args[0] & 0xfff, (st, f, local) => {
                 let o = obj(st, f, local);
                 if (o) {
                     return o[fieldName];
                 } else {
                     return defaultValue;
                 }
             });
         };
     }
     static objMethodInvoke(type, methodName, valueRegister, argtype, defaultValue, addVMarg) {
         argtype.unshift('NObjectRegister');
         return (builder, args) => {
             let ret = args.shift() & 0xfff;
             let argGetters = argtype.map((rtype, idx) => {
                 let idx1 = args[idx] & 0xFFF;
                 let v = builder[rtype](idx1);
                 if (typeof (v) != 'function') {
                     debugger
                 }
                 return (st, f, local) => {
                     return v(st, f, local);
                 };
             });
             if (valueRegister) {
                 builder[valueRegister]((ret), (st, f, local) => {
                     let argVals = argGetters.map(g => g(st, f, local));
                     if (addVMarg) {
                         argVals.push(st);
                         argVals.push(f);
                         argVals.push(local);
                     }
                     let o = argVals.shift();
                     if (o instanceof type) {
                         return o[methodName].apply(o, argVals);
                     } else {
                         return defaultValue;
                     }
                 });
             } else {
                 builder.PushAction((st, f, local, pos) => {
                     let argVals = argGetters.map(g => g(st, f, local));
                     if (addVMarg) {
                         argVals.push(st);
                         argVals.push(f);
                         argVals.push(local);
                         argVals.push(pos);
                     }
                     let o = argVals.shift();
                     if (o instanceof type) {
                         o[methodName].apply(argVals);
                     }
                     return pos + 1;
                 });
             }
         };
     }
     /**
      *
      * @param {Function} func
      * @param {Number[]} argtype
      * @param {Boolean} addVMarg
      * @returns
      */
     static closureVoid(func, argtype, addVMarg) {
         /**
          *
          * @param {OBFunctionBuilder} builder
          * @param {Number[]} args
          * @returns
          */
         let f = (builder, args) => {
             args = args.slice(1);
             let argGetters = argtype.map((rtype, idx) => {
                 let idx1 = args[idx] & 0xFFF;
                 let v = builder[rtype](idx1);
                 if (typeof (v) != 'function') {
                     debugger
                 }
                 return (st, f, local) => {
                     return v(st, f, local);
                 };
             });
             builder.PushAction((st, f, local, pos) => {
                 let argVals = argGetters.map(g => g(st, f, local));
                 if (addVMarg) {
                     argVals.push(st);
                     argVals.push(f);
                     argVals.push(local);
                     argVals.push(pos);
                 }
                 func.apply(null, argVals);
                 return pos + 1;
             });
         };
         return f;
     }
     /**
      *
      * @param {Function} func
      * @param {Number[]} argtype
      * @returns
      */
     static closureReturnValue(func, retRegisterType, argtype, addVMarg) {
         /**
          *
          * @param {OBFunctionBuilder} builder
          * @param {Number[]} args
          * @returns
          */
         let f = (builder, args) => {
             let retRegIdx = args[0];
             let retType = (retRegIdx & 0xF000) >> 12;
             retRegIdx = retRegIdx & 0xFFF;
             args = args.slice(1);
             let argGetters = argtype.map((rtype, idx) => {
                 let idx1 = args[idx] & 0xFFF;
                 let v = builder[rtype](idx1);
                 return (st, f, local) => {
                     return v(st, f, local);
                 };
             });
             builder[retRegisterType](retRegIdx, (st, f, local) => {
                 let argVals = argGetters.map(g => g(st, f, local));
                 if (addVMarg) {
                     argVals.push(st);
                     argVals.push(f);
                     argVals.push(local);
                 }
                 return func.apply(null, argVals);
             });
         };
         return f;
     }
 }
 class OBScript {
     constructor() {
 
         this.NativeLibHash = {}; // libname->hash
         this.InstalledLibs = {};
         this.NativeUtil = NativeUtil;
         /**
          * @type {Object.<string,StructData>}
          */
         this.StructData = {}; //typename->StructData
         /**
          * @type {Object.<string,OBStructDef>}
          */
         this.StructDef = {}; // typename-> def
         this.loadedFunctions; //= {};//function sign->function
         this.FullNameFSMData = {}; //FullName->OBFSM
     }
     /**
      * @callback FuncInstaller
      * @param {OBFunctionBuilder} funcBuilder
      * @param {number[]}  registersConfig
      */
     /**
      * 安装本地库
      * @param {string} libName
      * @param {string} jsmd5 md5 of js generated config
      * @param {FuncInstaller[]} funcInstallers array of funcInstaller
      */
     InstallLib(libName, jsmd5, funcInstallers) {
         if (this.InstalledLibs[libName]) {
             throw Error("重复导入 " + libName);
         }
         this.InstalledLibs[libName] = funcInstallers;
         this.NativeLibHash[libName] = jsmd5;
     }
     /**
          *
          * @param {string} libname
          * @param {number} funcIdx
          */
     getNativeFunc(libname, funcIdx) {
         if (funcIdx < 0) {
             throw Error("funcIdx:" + funcIdx);
         }
         // Action < UFunctionBuilder, int[] > [] lib;
         let lib = this.InstalledLibs[libname];
         if (lib) {
             if (funcIdx < lib.length) {
                 return lib[funcIdx];
             } else {
                 throw Error("funcIdx:" + funcIdx + " of lib " + libname + " out of range " + lib.length);
             }
         } else {
             throw Error("Native lib " + libname + " not found");
         }
     }
 }
 class OBStructDef {
     constructor() {
 
         this.Name; //string
         this.StructCnt; // int
         this.StringCnt; // int
         this.IntegerCnt; // int
         this.FloatCnt; // int
         this.NobjectCnt; // int
         this.StructFields; // OBStructDef[]
     }
     /**
      * 
      * @param {Uint8Array} uint8arr 
      * @returns OBStructValue
      */
     decode(uint8arr, st, uf, local) {
         let s = new OBStructValue(this);
         let dataView = new DataView(uint8arr.buffer);
         let read = uint8arr.byteOffset;
         // let int32arr = new Int32Array(uint8arr.buffer, uint8arr.byteOffset, uint8arr.byteLength);
         for (let i = 0; i < this.IntegerCnt; i++) {
             s.registers.LongRegister[i] = dataView.getInt32(read + i * 4);
         }
         read += this.IntegerCnt * 4;
         // let f32arr = new Float32Array(uint8arr.buffer, uint8arr.byteOffset + this.IntegerCnt * 4, uint8arr.byteLength - this.IntegerCnt * 4);
         for (let i = 0; i < this.FloatCnt; i++) {
             s.registers.DoubleRegister[i] = dataView.getFloat32(read + i * 4);
         }
         let decoder = new util.TextDecoder();
         read += this.FloatCnt * 4;
         for (let i = 0; i < this.StringCnt; i++) {
             let byteLength = dataView.getUint32(read);
             read += 4;
             let stru8 = uint8arr.subarray(read - uint8arr.byteOffset, read + byteLength - uint8arr.byteOffset);
             read += byteLength;
             let str = decoder.decode(stru8);
             s.registers.StringRegister[i] = str;
         }
         for (let i = 0; i < this.StructCnt; i++) {
             let byteLength = dataView.getUint32(read);
             read += 4;
             let stru8 = uint8arr.subarray(read - uint8arr.byteOffset, read + byteLength - uint8arr.byteOffset);
             read += byteLength;
             let structData = this.StructFields.decode(stru8);
             s.registers.StructRegister[i] = structData;
         }
         return s;
     }
     /**
      * 
      * @param {OBStructValue} s 
      * @returns Uint8Array
      */
     encode(s, st, uf, local, circleDetection) {
         if (circleDetection && circleDetection.indexOf(this) >= 0) {
             console.error('circular data: ' + this.Name);
             throw VM.makeError('circular data', st, uf, local);
         }
         let int32arr = new ArrayBuffer(this.IntegerCnt * 4);
         let int32DataView = new DataView(int32arr);
         for (let i = 0; i < this.IntegerCnt; i++) {
             int32DataView.setInt32(i * 4, s.registers.LongRegister[i]);
         }
         let f32arr = new ArrayBuffer(this.FloatCnt * 4);
         let f2DataView = new DataView(f32arr);
         for (let i = 0; i < this.FloatCnt; i++) {
             f2DataView.setFloat32(i * 4, s.registers.DoubleRegister[i]);
         }
         let strbuf_length = 0;
         let strbufs = [];
         let encoder = new util.TextEncoder();
         for (let i = 0; i < this.StringCnt; i++) {
             strbufs[i] = encoder.encode(s.registers.StringRegister[i], st, uf, local);
             strbuf_length += strbufs[i].byteLength;
         }
         let struct_buf_length = 0;
         let struct_bufs = [];
         if (this.StructCnt > 0) {
             if (!circleDetection) {
                 circleDetection = [];
             }
             circleDetection.push(this);
         }
         for (let i = 0; i < this.StructCnt; i++) {
             struct_bufs[i] = this.StructFields.encode(s.registers.StructRegister[i]);
             struct_buf_length += struct_bufs[i].byteLength;
         }
         let buffer = new ArrayBuffer(
             this.IntegerCnt * 4
             + this.FloatCnt * 4
             + strbuf_length + this.StringCnt * 4
             + struct_buf_length + this.StructCnt * 4);
         let dataView = new DataView(buffer);
         let uint8arr = new Uint8Array(buffer);
         uint8arr.set(new Uint8Array(int32arr));
         let written = this.IntegerCnt * 4;
         uint8arr.set(new Uint8Array(f32arr), written);
         written += this.FloatCnt * 4;
         strbufs.forEach(buf => {
             dataView.setUint32(written, buf.byteLength);
             written += 4;
             uint8arr.set(buf, written);
             written += buf.byteLength;
         });
         struct_bufs.forEach(buf => {
             dataView.setUint32(written, buf.byteLength);
             written += 4;
             uint8arr.set(buf, written);
             written += buf.byteLength;
         });
         return uint8arr;
     }
 }
 class OBStructValueData {
     // /**
     //  * @type {OBArrayBufferReader}
     //  */
     // Data; //arraybuffer
     // FullName;
     // Offset;
     // Length;
     // StructCount;
 }
 class OBVariableInfo {
     // typeIdx;
     // count;
 
     constructor(typeIdx, count) {
         this.typeIdx = typeIdx;
         this.count = count;
     }
 }
 class OBState {
     // /**
     //  *  @type {OBVariableInfo[]}
     //  */
     // Variables;
     // /**
     //  *  @type {string}
     //  */
     // Name;
     // MessageHandlers;
     // EventHandlers;
 }
 class OBCodeSegment {
     // name;
     // functions;
     // fsms;
 }
 class OBFunction {
     // /**
     //  *  @type {OBVariableInfo[]}
     //  */
     // Variables;
     // instructions;
     // /**
     //  * @type {String}
     //  */
     // Signure;
     // Statements;
 }
 class OBFSM {
     // /**
     //  * @type {string}
     //  */
     // Name;
     // /**
     //  * @type {Object.<string,OBState>}
     //  */
     // States; //string->state
     // /**
     //  * @type {OBState}
     //  */
     // Entry; //state
     // /**
     //  * @type {OBVariableInfo[]}
     //  */
     // Variables;
     // /**
     //  * @type {string}
     //  */
     // FullName;
     // /**
     //  * @type {string}
     //  */
     // ModuleName;
 }
 class OBMessageHandler {
     // Name;
     // Func;
     // ArgTypeName;
 }
 class OBEventHandler {
     // Name;
     // Func;
 }
 class OBInstruction {
     // Position;
     /**
      *
      * @param {number} code
      * @param {OBFunctionBuilder} builder
      * @param {OBInstruction[]} instructions
      * @param {number} i
      */
     init(code, builder, instructions, i) {
 
     }
     /**
          *
          * @param {OBFunctionBuilder} funcbuilder
          * @param {OBInstruction[]} instructions
          * @param {number} i
          */
     link(funcbuilder, instructions, i) {
 
     }
     getRegisterByRegTypeId(typeId, builder) {
         switch (typeId) {
             case 0:
                 return builder.LongRegister;
             case 1:
                 return builder.DoubleRegister;
             case 2:
                 return builder.StringRegister;
             case 3:
                 return builder.StructRegister;
             case 4:
                 return builder.NObjectRegister;
             default:
                 throw Error("不支持类型：" + this.ArgTypeId);
         }
     }
 }
 class OBByteCodes {
     static createInstruction(cmd) {
         switch (cmd) {
             //case 0:
             //    break;
             case 1:
                 return new PRT();
             case 2:
                 return new ARITHI();
             case 3:
                 return new ARITHF();
             case 4:
                 return new LDSTR();
             case 5:
                 return new LDI();
             case 6:
                 return new LDF();
             case 7:
                 return new RET();
             case 8:
                 throw Error("Unknown byte code command:" + cmd);
             case 9:
                 throw Error("Unknown byte code command:" + cmd);
             case 10:
                 return new CHSTT();
             case 11:
                 return new STVG();
             case 12:
                 return new FSMVS();
             case 13:
                 return new FSMVG();
             case 14:
                 return new STVS();
             case 15:
                 return new MethodCall();
             case 16:
                 return new ExtInfo();
             case 17:
                 return new CreateFSM();
             case 18:
                 return new FSMSendMsg();
             case 19:
                 return new ReceivedMessage();
             case 20:
                 return new GetStructField();
             case 21:
                 return new SetStructField();
             case 22:
                 return new GZ0();
             case 23:
                 return new BRIF();
             case 24:
                 return new DEC();
             case 25:
                 return new BR();
             case 26:
                 return new Reg2Var();
             case 27:
                 return new Var2Reg();
             case 28:
                 return new NOP();
             case 29:
                 return new BRIFN();
             case 30:
                 return new I2F();
             case 31:
                 return new StructFieldDesc();
             case 32:
                 return new EQ();
             case 33:
                 return new NEQ();
             case 34:
                 return new LT();
             case 35:
                 return new LTE();
             case 36:
                 return new GT();
             case 37:
                 return new GTE();
             case 38:
                 return new SLF();
             case 39:
                 return new NativeMethodCall();
             case 40:
                 return new DestroyFSM();
             case 41:
                 return new FSMBroadcastMsg();
             case 42:
                 return new SGLF();
             case 43:
                 return new RAND();
             case 44:
                 return new F2I();
             case 45:
                 return new FSMSendMsgWait_Data();
             case 46:
                 return new FSMSendMsgWait();
             case 47:
                 return new FSMBroadcastMsgWait();
             case 48:
                 return new TextJoin();
             case 49:
                 return new ToString();
             case 50:
                 return new Sender();
             case 51:
                 return new VOM();
             case 52:
                 return new SHL();
             case 53:
                 return new AND();
             case 54:
                 return new FIX();
             case 55:
                 return new LAND();
             case 56:
                 return new LOR();
             case 57:
                 return new LNOT();
             case 58:
                 return new COND();
             case 59:
                 return new NEW();
             case 60:
                 return new CSTR();
             case 61:
                 return new LIST();
             case 62:
                 return new IMAP();
             case 63:
                 return new SMAP();
             case 64:
                 return new STKV();
             case 65:
                 return new RKOM();
             case 66:
                 return new SOM();
             case 67:
                 return new VOIM();
             case 68:
                 return new STIKV();
             case 69:
                 return new RKOIM();
             case 70:
                 return new VAT();
             case 71:
                 return new SVAT();
             case 72:
                 return new IVAT();
             case 73:
                 return new RVAT();
             case 74:
                 return new VAD();
             case 75:
                 return new PUSTT();
             case 76:
                 return new POPSTT();
             case 77:
                 return new DBI();
             case 78:
                 return new DBE();
             case 79:
                 return new SME();
             case 80:
                 return new IME();
             case 81:
                 return new IMA();
             case 82:
                 return new SMA();
             case 83:
                 return new CLONE();
             default:
                 throw Error("Unknown byte code command:" + cmd);
         }
         // return new OBInstruction(cmd);
     }
 }
 class PositionUpdatePair {
     // targetOffset;
     // callback;
 }
 class OBFunctionBuilder {
     // loader; //ScriptLoader
     // StatementLength; //integer
     // BuildingFunc; //OBFunction
     // PositionUpdatePairList;
     // currentInstructPosition; //integer
     // RootStatementContext = new OBStatementContext(); //[StatementContext]
 
     // /**
     //  *  @callback LongRegister
     //  * @param {OBVMState}
     //  * @param {OBFunctionBuilder}
     //  * @param {OBInstruction[]}
     //  * @returns {number}
     //  */
     // /**
     //  * @type LongRegister[]
     //  */
     // LongRegister;
     // /**
     //  *  @callback DoubleRegister
     //  * @param {OBVMState}
     //  * @param {OBFunctionBuilder}
     //  * @param {OBInstruction[]}
     //  * @returns {number}
     //  */
     // /**
     //  * @type DoubleRegister[]
     //  */
     // DoubleRegister;
     // /**
     //  *  @callback StringRegister
     //  * @param {OBVMState}
     //  * @param {OBFunctionBuilder}
     //  * @param {OBInstruction[]}
     //  * @returns {string}
     //  */
     // /**
     //  * @type StringRegister[]
     //  */
     // StringRegister;
     // /*@
     //  *  @callback StringRegister
     //  * @param {OBVMState}
     //  * @param {OBFunctionBuilder}
     //  * @param {OBInstruction[]}
     //  * @returns {OBStructValue}
     //  */
     // /**
     //  * @type  {Array} StructRegister[]
     //  */
     // StructRegister;
     // /*@
     //  *  @callback StringRegister
     //  * @param {OBVMState}
     //  * @param {OBFunctionBuilder}
     //  * @param {OBInstruction[]}
     //  * @returns {object}
     //  */
     // /**
     //  * @type {Array} NObjectRegister[]
     //  */
     // NObjectRegister;
 
     constructor(loader) {
         this.loader = loader;
         this.RootStatementContext = new OBStatementContext(); //[StatementContext]
         this.options = loader.options;
     }
 
     loadFunctionHeader(reader) {
         let data = this.loader.data;
         let BuildingFunc = new OBFunction();
         this.BuildingFunc = BuildingFunc;
 
         let header = reader.ReadUInt32();
         let pos = reader.pos;
         // this.StatementLength = header * 4 - pos;
         reader.pos = header * 4;
         let nameIdx = reader.ReadUInt32();
         BuildingFunc.Signure = data.GetString(nameIdx);
         this._LongRegister = [];
         this._LongRegister.length = reader.ReadUInt32();
         this._DoubleRegister = [];
         this._DoubleRegister.length = reader.ReadUInt32();
         this._StringRegister = [];
         this._StringRegister.length = reader.ReadUInt32();
         this._StructRegister = [];
         this._StructRegister.length = reader.ReadUInt32();
         this._NObjectRegister = [];
         this._NObjectRegister.length = reader.ReadUInt32();
         let varInfo = [];
         for (let i = 0; i < 5; i++) {
             let info = new OBVariableInfo();
             info.typeIdx = i;
             info.count = reader.ReadUInt32();
             varInfo[i] = info;
         }
         this.StatementLength = reader.ReadUInt32();
         BuildingFunc.Variables = varInfo;
         reader.pos = pos;
     }
     LongRegister(idx, callback) {
         if (callback) {
             this._LongRegister[idx] = callback;
         }
         let r = this._LongRegister[idx];
         if (!r) {
             debugger
         }
         return r;
     }
     DoubleRegister(idx, callback) {
         if (callback) {
             this._DoubleRegister[idx] = callback;
         }
         let r = this._DoubleRegister[idx];
         if (!r) {
             debugger
         }
         return r;
     }
     StringRegister(idx, callback) {
         if (callback) {
             this._StringRegister[idx] = callback;
         }
         let r = this._StringRegister[idx];
         if (!r) {
             debugger
         }
         return r;
     }
     StructRegister(idx, callback) {
         if (callback) {
             this._StructRegister[idx] = callback;
         }
         let r = this._StructRegister[idx];
         if (!r) {
             debugger
         }
         return r;
     }
     NObjectRegister(idx, callback) {
         if (callback) {
             this._NObjectRegister[idx] = callback;
         }
         let r = this._NObjectRegister[idx];
         if (!r) {
             debugger
         }
         return r;
     }
     loadStatement(reader) {
         let length = this.StatementLength;
         this.BuildingFunc.instructions = [];
         this.PositionUpdatePairList = []; //[PositionUpdatePair]
         for (let i = 0; i < length; i++) {
             let instPos = reader.pos;
             let code = reader.ReadUInt32();
             let cmd = (code >> 24);
             let inst = OBByteCodes.createInstruction(cmd);
             inst.Position = instPos;
             inst.init(code, this, this.BuildingFunc.instructions, i);
             this.BuildingFunc.instructions[i] = inst;
         }
     }
 
     link() {
         let instructions = this.BuildingFunc.instructions;
         for (let i = 0; i < instructions.length; i++) {
             let inst = instructions[i];
             this.currentInstructPosition = inst.Position;
             inst.link(this, instructions, i);
         }
         this.PositionUpdatePairList = null;
         this.BuildingFunc.Statements = this.RootStatementContext;
     }
 
     build() {
         return this.BuildingFunc;
     }
 
     PositionUpdate(targetOffset, callback) {
         if (this.PositionUpdatePairList == null) {
             throw Error("异常状态");
         }
         let p = new PositionUpdatePair();
         p.targetOffset = targetOffset;
         p.callback = callback;
         this.PositionUpdatePairList.push(p);
     }
 
     PushAction(Instruction) {
         let stmt = this.RootStatementContext;
         let newPos = stmt.Actions.length;
         if (this.options.instructionWrap) {
             Instruction = this.options.instructionWrap(Instruction);
         }
         if (this.options.debugger) {
             Instruction = this.options.debugger.instructionWrap(Instruction);
         }
         stmt.PushAction(Instruction);
         this.PositionUpdatePairList.forEach((p) => {
             if (p.targetOffset === this.currentInstructPosition) {
                 p.callback(newPos);
             }
         });
     }
 }
 
 class OBBuildInFunctions {
     /**
      *
      * @param {OBScript} script
      */
     static install(script) {
         script.InstallLib("", "", [
             OBBuildInFunctions.FSM_FindFsmByTypeInstaller,
             OBBuildInFunctions.Struct_countInDatasetInstaller,
             OBBuildInFunctions.Structs_LoadStructFromDatasetInstaller,
             // OBBuildInFunctions.FSM_TargetInstaller,
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_Length, 'LongRegister', ['StringRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_IsEmpty, 'LongRegister', ['StringRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_IndexOf, 'LongRegister', ['StringRegister', 'StringRegister', 'LongRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_CharAt, 'StringRegister', ['StringRegister', 'LongRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_GetSubstring, 'StringRegister', ['StringRegister', 'LongRegister', 'LongRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_ToUpperCase, 'StringRegister', ['StringRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_ToLowerCase, 'StringRegister', ['StringRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_ToTitleCase, 'StringRegister', ['StringRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_Count, 'LongRegister', ['StringRegister', 'StringRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_Replace, 'StringRegister', ['StringRegister', 'StringRegister', 'StringRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.Text_Reverse, 'StringRegister', ['StringRegister']),
             script.NativeUtil.closureVoid(OBBuildInFunctions.SYS_LOG, ['StringRegister', 'LongRegister'], true),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.math_text_to_integer, 'LongRegister', ['StringRegister']),
             script.NativeUtil.closureReturnValue(OBBuildInFunctions.math_text_to_number, 'DoubleRegister', ['StringRegister']),
         ]);
     }
     static math_text_to_integer(text) {
         let v = parseInt(text);
         if (Number.isInteger(v)) {
             return v;
         } else {
             return 0;
         }
     }
     static math_text_to_number(text) {
         let v = parseFloat(text);
         if (Number.isNaN(v)) {
             return 0;
         } else {
             return v;
         }
     }
     static SYS_LOG(msg, level, st, ofunc) {
         if (st.fsm.VM.logLevel <= level) {
             st.fsm.VM.Log(msg, 'usr', level, st, ofunc);
         }
     }
     /**
      *
      * @param {String} str
      * @returns
      */
     static Text_Reverse(str) {
         if (str) {
             return str.split('').reverse().join('');
         } else {
             return "";
         }
     }
     static Text_Replace(haystack, needle, replacement) {
         needle = needle.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1")
             .replace(/\x08/g, "\\x08");
         return haystack.replace(new RegExp(needle, 'g'), replacement);
     }
     static Text_Count(haystack, needle) {
         if (needle.length === 0) {
             return haystack.length + 1;
         } else {
             return haystack.split(needle).length - 1;
         }
     }
     /**
      *
      * @param {String} str
      * @returns
      */
     static Text_ToTitleCase(str) {
         return str.replace(
             /\w\S*/g,
             function (txt) {
                 return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
             }
         );
     }
     /**
      *
      * @param {String} str
      * @returns
      */
     static Text_ToLowerCase(str) {
         if (str) {
             return str.toLowerCase();
         }
         return "";
     }
     /**
      *
      * @param {String} str
      * @returns
      */
     static Text_ToUpperCase(str) {
         if (str) {
             return str.toUpperCase();
         }
         return "";
     }
     static Text_GetSubstring(str, from, to) {
         let start = from;
         if (start < 0) {
             start = str.length + start;
         } else {
             start -= 1;
         }
         let end = to;
         if (end < 0) {
             end = str.length + to;
         } else {
             end -= 1;
         }
         if (start > end) {
             let t = start;
             start = end;
             end = t;
         }
         return str.substring(start, end + 1);
     }
     static Text_CharAt(str, index) {
         if (index === 0) {
             return "";
         }
         if (index > 0) {
             return str[index - 1] || "";
         }
         if (index < 0) {
             return str[str.length + index];
         }
     }
     static Text_IndexOf(str, sub, forward) {
         if (forward === 1) {
             return str.indexOf(sub) + 1;
         } else {
             return str.lastIndexOf(sub) + 1;
         }
     }
     static Text_IsEmpty(str) {
         return str.length === 0 ? 1 : 0;
     }
     static Text_Length(str) {
         return str.length;
     }
     static FSM_FindFsmByTypeInstaller(builder, args) {
         let returnRegisterIdx = args[0] & 0xFFF;
         let argIdx = args[1] & 0xFFF;
         let a1 = builder.StringRegister(argIdx);
         builder.StructRegister(returnRegisterIdx, (state, func, locals) => {
             let r = state.fsm.VM.FindRunningFSMByType(a1(state, func, locals));
             return r;
         });
     }
     static Struct_countInDatasetInstaller(builder, args) {
         let returnRegisterIdx = args[0] & 0xFFF;
         let typeIdx = args[1] & 0xFFF;
         let a2 = builder.StringRegister(typeIdx);
         let StructData = builder.loader.script.StructData;
         builder.LongRegister(returnRegisterIdx, (state, func, locals) => {
             let typename = a2(state, func, locals);
             let r = StructData.Count(typename);
             return r;
         });
     }
     static Structs_LoadStructFromDatasetInstaller(builder, args) {
         let returnRegisterIdx = args[0] & 0xFFF;
         let idIdx = args[2] & 0xFFF;
         let a1 = builder.LongRegister(idIdx);
         let typeIdx = args[1] & 0xFFF;
         let a2 = builder.StringRegister(typeIdx);
         let StructData = builder.loader.script.StructData;
         builder.StructRegister(returnRegisterIdx, (state, func, locals) => {
             let typename = a2(state, func, locals);
             let id = a1(state, func, locals);
             let r = StructData.Get(typename, id);
             if (!r) {
                 throw VM.makeError(`Can't find ${typename} which id is ${id}`, state, func, locals);
             }
             return r;
         });
     }
     static FSM_TargetInstaller(builder, args) {
         let returnRegisterIdx = args[0] & 0xFFF;
         builder.NObjectRegister(returnRegisterIdx, (state, func, locals) => {
             return state.fsm.Target;
         });
     }
 }
 class OBStructValue {
     // /**
     //  * @type {OBStructDef}
     //  */
     // Def;
     // /**
     //  * @type {OBTypedVariableGroup}
     //  */
     // registers;
 
     // {OBStructValue} root;
     // bool readOnly
     constructor(Def) {
         this.Def = Def;
         let registers = new OBTypedVariableGroup(null);
         if (Def.IntegerCnt > 0) {
             registers.LongRegister = [];
             registers.LongRegister.length = Def.IntegerCnt;
             registers.LongRegister.fill(0, 0, Def.IntegerCnt);
         }
         if (Def.FloatCnt > 0) {
             registers.DoubleRegister = [];
             registers.DoubleRegister.length = Def.FloatCnt;
             registers.DoubleRegister.fill(0, 0, Def.FloatCnt);
         }
         if (Def.StringCnt > 0) {
             registers.StringRegister = [];
             registers.StringRegister.length = Def.StringCnt;
             registers.StringRegister.fill('', 0, Def.StringCnt);
         }
         if (Def.StructCnt > 0) {
             registers.StructRegister = [];
             registers.StructRegister.length = Def.StructCnt;
         }
         if (Def.NobjectCnt > 0) {
             registers.NObjectRegister = [];
             registers.NObjectRegister.length = Def.NobjectCnt;
         }
         this.registers = registers;
     }
 
     toString() {
         return "Struct." + this.Def.Name;
     }
     deepClone(readOnly, circleDetection) {
         if (circleDetection.indexOf(this) >= 0) {
             throw Error('循环引用');
         }
         circleDetection.push(this);
         let s = new OBStructValue(this.Def);
         s.registers.copyFrom(this.registers, readOnly, circleDetection);
         s.readOnly = readOnly;
         return s;
     }
     isReadOnly() {
         return this.readOnly;
     }
 }
 class StructData {
     // /**
     //  * @type {Object.<string,OBStructDef>}
     //  */
     // StructDef;
     // /**
     //  * @type {Object.<string,OBStructValueData>}
     //  */
     // Groups;
     // /**
     //  * @type {OBArrayBufferReader}
     //  */
     // DataSegment;
 
     constructor(structDataGroups, data) {
         this.Groups = structDataGroups;
         this.DataSegment = data;
     }
     Count(type) {
         if (type.startsWith("S") && type.endsWith(";")) {
             type = type.substr(1, type.length - 2);
         }
         let group = this.Groups[type];
         if (!group) {
             throw `There is no preset data of the type ${type}`;
         }
         return group.StructCount;
     }
     /**
          *
          * @param {string} type fullname of type
          * @1param {integer} id id of data
          * @param {?Object.<string,OBStructValue>}
          * @returns {OBStructValue}
          */
     Get(type, id, loading) {
         if (type.startsWith("S") && type.endsWith(";")) {
             type = type.substr(1, type.length - 2);
         }
         if (loading == null) {
             loading = {};
         } else {
             let loaded = loading[id + "@" + type];
             if (loaded) {
                 return loaded;
             }
         }
         let def = this.StructDef[type];
         let group = this.Groups[type];
         if (!group) {
             throw `There is no preset data of the type ${type}`;
         }
         let reader = group.Data;
         let itemStart = 0;
         for (let i = 0; i < group.StructCount; i++) {
             reader.pos = itemStart;
             let length = reader.ReadInt32();
             let itemid = reader.ReadUInt32();
             if (itemid === id) {
                 reader.pos -= 4;
                 let s = new OBStructValue(def);
                 loading[id + "@" + type] = s;
                 for (let j = 0; j < def.IntegerCnt; j++) {
                     s.registers.LongRegister[j] = reader.ReadInt32(); //VariableValueSet(j, reader.ReadInt32());
                 }
                 for (let j = 0; j < def.StringCnt; j++) {
                     let idx = reader.ReadUInt32();
                     let str = this.DataSegment.GetString(idx);
                     s.registers.StringRegister[j] = str; //VariableValueSet(j, str);
                 }
                 for (let j = 0; j < def.FloatCnt; j++) {
                     s.registers.DoubleRegister[j] = reader.ReadSingle(); //VariableValueSet(j, reader.ReadSingle());
                 }
                 for (let j = 0; j < def.StructCnt; j++) {
                     let fieldDef = def.StructFields[j];
                     if (fieldDef.startsWith("S")) {
                         let subId = reader.ReadUInt32();
                         let subStruct = this.Get(def.StructFields[j], subId, loading);
                         s.registers.StructRegister[j] = subStruct; //VariableValueSet(j, subStruct);
                     } else if (fieldDef.startsWith("I")) {
                         // TODO
                     } else if (fieldDef.startsWith("N")) {
                         let elementTypeName = fieldDef.substr(1);
                         let structCnt = reader.ReadUInt32();
                         let map = new OBSMap();
                         for (let k = 0; k < structCnt; k++) {
                             let keyIdx = reader.ReadUInt32();
                             let keyStr = this.DataSegment.GetString(keyIdx);
                             let structId = reader.ReadInt32();
                             let st = this.Get(elementTypeName, structId, loading);
                             map.c.set(keyStr, st);
                         }
                         s.registers.StructRegister[j] = map;
                     }
                 }
                 return s;
             } else {
                 itemStart += length * 4 + 4;
             }
         }
         throw Error("找不到 ID为" + id + "的" + type);
     }
 }
 
 class OBStructDataReader {
     /**
      *
      * @param {OBArrayBufferReader} reader
      * @returns {StructData}
      */
     readStream(reader) {
         let dataLength = reader.ReadUInt32();
         let data = reader.readSub(dataLength);
         return this.readStructData(reader, data);
     }
     /**
      *
      * @param {OBArrayBufferReader} reader
      * @param {OBArrayBufferReader} data
      * @returns {StructData}
      */
     readStructData(reader, data) {
         let _length = reader.ReadInt32();
         let structs = {};
 
         let groupCnt = reader.ReadUInt32();
         for (let i = 0; i < groupCnt; i++) {
             let offset = reader.pos;
             let strIdx = reader.ReadUInt32();
             let FullName = data.GetString(strIdx);
             let structCnt = reader.ReadInt32();
             let length = reader.ReadInt32();
             // arraybuffer
             let bin = reader.readSub(length * 4);
             let info = new OBStructValueData(); //
             info.Data = bin;
             info.FullName = FullName;
             info.Offset = offset;
             info.Length = length;
             info.StructCount = structCnt;
             structs[FullName] = info;
         }
         return new StructData(structs, data);
     }
 }
 class Relocation {
     constructor() {
         /**
          * @type {Object.<string,{idx:Number,inited:bool}>}
          */
         this.string = {};
         /**
          * @type {Object.<string,{idx:Number,inited:bool}>}
          */
         this.integer = {};
         /**
          * @type {Object.<string,{idx:Number,inited:bool}>}
          */
         this.float = {};
         /**
          * @type {Object.<string,{idx:Number,inited:bool}>}
          */
         this.bin = {};
         /**
          * @type {Object.<string,{idx:Number,inited:bool}>}
          */
         this.structFieldIndex = {};
     }
 
     addRelocationString(str) {
         if ((typeof str) !== 'string') {
             throw Error('不是字符串');
         }
         if (!this.string.hasOwnProperty(str)) {
             this.string[str] = {
                 idx: 0,
                 inited: false
             }
         }
     }
 }
 class ScriptLoader {
     constructor() {
         // /**
         //  * @type {OBArrayBufferReader}
         //  */
         // reader; //OBArrayBufferReader
         // /**
         //  * @type {OBArrayBufferReader}
         //  */
         // data; //OBArrayBufferReader
         this.loadingFunctions = {}; //[OBFunctionBuilder]
         this.Linkings = []; //Linkable
     }
 
     /**
      * @callback NativeLibInstaller
      * @param {OBScript} script
      */
     /**
      *
      * @param {ArrayBuffer} arraybuffer of byte code
      * @param {NativeLibInstaller} nativeLibs
      * @param {Object} options
      * @returns
      */
     static loadScript(arraybuffer, nativeLibs, options) {
         let script = new OBScript();
         OBBuildInFunctions.install(script);
         let l = new ScriptLoader();
         l.options = options || {};
         // if (!l.options.debugger) {
         // l.options.debugger = new Debugger();
         // }
         // let nativeLibs = OBNative.functions;
         if (nativeLibs) {
             if (Array.isArray(nativeLibs)) {
                 nativeLibs.forEach(installer => {
                     installer(script);
                 });
             } else {
                 nativeLibs(script);
             }
         }
         l.load(script, arraybuffer);
         return script;
     }
     load(script, buf) {
         this.script = script;
         this.reader = new OBArrayBufferReader(buf);
         this.readXE();
     }
 
     readXE() {
         let MAG = this.reader.ReadInt32(); //'\u007fUEX';
         if (MAG != 0x5845557F) {
             throw Error("Unknown MAG:" + MAG);
         }
         let version = this.reader.ReadUInt32();
         if (version != 1) {
             throw Error("Unsupported version." + version);
         }
 
         let SegmentCnt = this.reader.ReadUInt32();
         let headerEnd = this.reader.pos + SegmentCnt * 2 * 4;
 
         let codes = [];
 
         for (let i = 0; i < SegmentCnt; i++) {
             let type = this.reader.ReadUInt32();
             let startIn4Bytes = this.reader.ReadUInt32();
             let start = headerEnd + startIn4Bytes * 4;
             let pos = this.reader.pos;
             switch (type) {
                 case 0:
                     this.reader.seek(start);
                     this.data = this.loadDataSegment();
                     break;
                 case 1:
                     this.reader.seek(start);
                     let code = this.loadCodeSegment(); // data应该是第一个段，所以此时data已经存在
                     codes.push(code);
                     break;
                 case 2:
                     this.reader.seek(start);
                     this.script.StructData = this.loadStructDataSegment();
                     this.script.StructData.StructDef = this.script.StructDef;
                     break;
                 case 3:
                     this.reader.seek(start);
                     this.script.StructDef = this.loadStructDefDataSegment();
                     break;
                 case 4:
                     this.reader.seek(start);
                     this.loadPackageInfo();
                     break;
                 default:
                     throw Error("Unknown Segment type:" + type);
             }
             this.reader.seek(pos);
         }
         this.script.loadedFunctions = this.loadingFunctions;
         this.Linkings.forEach(l => {
             l.link();
         });
         codes.forEach(codeSeg => {
             codeSeg.fsms.forEach(fsm => {
                 fsm.FullName = codeSeg.name + "." + fsm.Name;
                 this.script.FullNameFSMData[fsm.FullName] = fsm;
             });
         });
     }
 
     loadCodeSegment() {
         let reader = this.reader;
         let data = this.data;
 
         let start = reader.pos;
         let SegmentReader = reader.getSub(start);
         let length = SegmentReader.ReadUInt32();
         let header = SegmentReader.ReadUInt32() * 4;
         SegmentReader.pos = header;
         let segment = new OBCodeSegment();
         let nameStringIdx = SegmentReader.ReadInt32();
         let name = data.GetString(nameStringIdx);
         let ufunctions = this.readFunctions(SegmentReader);
         let fsms = this.readFSMs(SegmentReader, name);
         // 字段赋值
         segment.name = name;
         segment.functions = ufunctions;
         segment.fsms = fsms;
         return segment;
     }
 
     readFSMs(reader, moduleName) {
         let cnt = reader.ReadInt32();
         let f = []; // [OBFSM]
         for (let i = 0; i < cnt; i++) {
             let s = reader.ReadUInt32() * 4;
             let pos = reader.pos;
             reader.pos = s;
             let fsm = this.readFSM(reader);
             fsm.ModuleName = moduleName;
             fsm.FullName = moduleName + "." + fsm.Name;
             reader.pos = pos;
             f[i] = fsm;
         }
         return f;
     }
 
     readFSM(reader) {
         let data = this.data;
         let nameIdx = reader.ReadUInt32();
         let name = data.GetString(nameIdx);
         let variables = this.readVariables(reader);
         let fucCnt = reader.ReadUInt32();
         // TODO
         let states = this.readStates(reader);
         let entryStateNameIdx = reader.ReadUInt32();
         let entryStateName = data.GetString(entryStateNameIdx);
         let entryState = null;
 
         // Dictionary<string, UState> stateDict = new Dictionary<string, UState>();
         let stateDict = {};
         for (let i = 0; i < states.length; i++) {
             let s = states[i];
             stateDict[s.Name] = s;
             if (entryStateName === s.Name) {
                 entryState = s;
             }
         }
         if (entryState == null) {
             throw Error("Can't find state named " + entryStateName + " FSM " + name);
         }
         let fsm = new OBFSM();
         fsm.Name = name;
         fsm.States = stateDict;
         fsm.Entry = entryState;
         fsm.Variables = variables;
         return fsm;
     }
 
     readStates(reader) {
         let cnt = reader.ReadInt32();
         let r = []; //[OBState]
         for (let i = 0; i < cnt; i++) {
             let s = reader.ReadUInt32() * 4;
             let p = reader.pos;
             reader.pos = s;
             r.push(this.readState(reader));
             reader.pos = p;
         }
         return r;
     }
 
     readState(reader) {
         let data = this.data;
         let nameIdx = reader.ReadUInt32();
         let name = data.GetString(nameIdx);
         let variables = this.readVariables(reader);
         // 读取函数
         this.readFunctions(reader);
         // UMessageHandler[]
         let handlers = this.readHandlers(reader);
         // UEventHandler[]
         let ehandlers = this.readEHandlers(reader);
         // Dictionary<string, List<UMessageHandler>> Mh = new Dictionary<string, List<UMessageHandler>>();
         let Mh = {};
         for (let i = 0; i < handlers.length; i++) {
             let h = handlers[i];
             let hl = Mh[h.Name];
             if (hl) {
             } else {
                 hl = []; //new List<UMessageHandler>();
                 Mh[h.Name] = hl;
             }
             hl.push(h);
         }
         // Dictionary<string, UEventHandler> eh = new Dictionary<string, UEventHandler>();
         let eh = {};
         for (let i = 0; i < ehandlers.length; i++) {
             let h = ehandlers[i];
             eh[h.Name] = h;
         }
         let r = new OBState();
         r.Variables = variables;
         r.Name = name;
         r.MessageHandlers = Mh;
         r.EventHandlers = eh;
         return r;
     }
 
     readEHandlers(reader) {
         let cnt = reader.ReadInt32();
         // UEventHandler[] f = new UEventHandler[cnt];
         let f = [];
         for (let i = 0; i < cnt; i++) {
             let start = reader.ReadUInt32() * 4;
             let h = this.readEHandler(reader, start);
             f[i] = h;
         }
         return f;
     }
 
     readEHandler(reader, start) {
         let pos = reader.pos;
         reader.pos = start;
         let func = this.readFunction(reader);
         let h = new OBEventHandler();
         h.Name = func.Signure;
         h.Func = func;
         reader.pos = pos;
         return h;
     }
 
     readHandlers(reader) {
         let cnt = reader.ReadUInt32();
         // UMessageHandler[] f = new UMessageHandler[cnt];
         let f = [];
         for (let i = 0; i < cnt; i++) {
             let start = reader.ReadUInt32() * 4;
             let h = this.readHandler(reader, start);
             f[i] = h;
         }
         return f;
     }
 
     readHandler(reader, start) {
         let pos = reader.pos;
         reader.pos = start;
         let func = this.readFunction(reader);
         let h = new OBMessageHandler();
         let pair = func.Signure.split(':');
         h.Name = pair[0];
         h.Func = func;
         h.ArgTypeName = pair[1];
         reader.pos = pos;
         return h;
     }
 
     readVariables(reader) {
         let data = this.data;
         let varCnt = reader.ReadUInt32();
         // List<UVariableInfo> d = new List<UVariableInfo>();
         let d = [];
         for (let i = 0; i < varCnt; i++) {
             let v = this.readVariable(reader);
             d.push(v);
         }
         return d;
     }
 
     readVariable(reader) {
         // let typeIdx = reader.ReadUInt32();
         // let count = reader.ReadInt32();
         let vari = reader.ReadUInt32();
         let count = vari & 0xFFFFFFF;
         let typeIdx = vari >> 28;
         let v = new OBVariableInfo(typeIdx, count);
         return v;
     }
 
     readFunctions(reader) {
         let cnt = reader.ReadInt32();
         let f = [];
         for (let i = 0; i < cnt; i++) {
             let start = reader.ReadUInt32() * 4;
             let pos = reader.pos;
             reader.pos = start;
             let _f = this.readFunction(reader);
             f[i] = _f;
             this.loadingFunctions[_f.Signure] = _f;
             reader.pos = pos;
         }
         return f;
     }
 
     readFunction(reader) {
         let builder = new OBFunctionBuilder(this);
         builder.loadFunctionHeader(reader);
         builder.loadStatement(reader);
         this.addLinking(builder);
         let f = builder.build();
         return f;
     }
 
     addLinking(l) {
         this.Linkings.push(l);
     }
 
     loadStructDataSegment() {
         let reader = this.reader;
         let data = this.data;
         return new OBStructDataReader().readStructData(reader, data);
     }
     /**
          *
          * @returns {Object.<string,OBStructValueData>}
          */
     loadStructDefDataSegment() {
         let reader = this.reader;
         let data = this.data;
         let length = reader.ReadUInt32();
         let d = {};
         let cnt = reader.ReadUInt32();
         for (let i = 0; i < cnt; i++) {
             let nameIdx = reader.ReadUInt32();
             let name = data.GetString(nameIdx);
             let typeCnt = reader.ReadUInt32();
             let structCnt = (typeCnt & 0x7F);
             let stringCnt = ((typeCnt >> 7) & 0x7F);
             let integerCnt = ((typeCnt >> 14) & 0x7F);
             let floatCnt = ((typeCnt >> 21) & 0x7F);
             let NobjectCnt = ((typeCnt >> 28));
             // string[] fields = new string[structCnt];
             let fields = [];
             for (let j = 0; j < structCnt; j++) {
                 let fnameIdx = reader.ReadUInt32();
                 let fname = data.GetString(fnameIdx);
                 fields[j] = fname;
             }
             let s = new OBStructDef();
             s.Name = name;
             s.StructCnt = structCnt;
             s.StringCnt = stringCnt;
             s.IntegerCnt = integerCnt;
             s.FloatCnt = floatCnt;
             s.NobjectCnt = NobjectCnt;
             s.StructFields = fields;
             d[name] = s;
         }
         return d;
     }
 
     loadDataSegment() {
         let length = this.reader.ReadUInt32();
         return this.reader.readSub(length * 4);
     }
 
     loadPackageInfo() {
         let reader = this.reader;
         let data = this.data;
         let depCnt = reader.ReadUInt32();
         let err = [];
         for (let i = 0; i < depCnt; i++) {
             let nameIdx = reader.ReadUInt32();
             let name = data.GetString(nameIdx);
             let hashIdx = reader.ReadUInt32();
             let hash = data.GetString(hashIdx);
             let lhash = this.script.NativeLibHash[name];
             if (!lhash) {
                 err.push("No native lib named " + name);
             } else if (lhash != hash) {
                 err.push("Native lib hash mismatching." + name + " require " + hash + ", provide " + lhash);
             }
         }
         if (err.length > 0) {
             // throw err;
             console.error(err);
         }
     }
 }
 
 class OBArrayBufferReader {
     // /**
     //  * @type {Number} integer of position
     //  */
     // pos; // int
     // /**
     //  * @type {Number} integer of start
     //  */
     // start; // int
     // /**
     //  * @type {ArrayBuffer}
     //  */
     // buf; // ArrayBuffer
     // /**
     //  * @type DataView
     //  */
     // view; // DataView
     // /**
     //  * @type {Object.<Number,String>}
     //  */
     // stringCache = {};
 
     constructor(buf) {
         this.buf = buf;
         this.pos = 0;
         this.start = 0;
         this.view = new DataView(buf);
         this.stringCache = {};
     }
 
     ReadInt32() {
         let v = this.getInt32(this.pos);
         this.pos += 4;
         return v;
     }
 
     getInt32(p) {
         let v = this.view.getInt32(this.start + p, true);
         // let v = this.view.getInt32(p, true);
         return v;
     }
 
     ReadUInt32() {
         let v = this.getUint32(this.pos);
         this.pos += 4;
         return v;
     }
 
     getUint32(p) {
         let v = this.view.getUint32(this.start + p, true);
         // let v = this.view.getUint32(p, true);
         return v;
     }
 
     ReadSingle() {
         let v = this.getFloat(this.pos);
         this.pos += 4;
         return v;
     }
 
     getFloat(p) {
         let v = this.view.getFloat32(this.start + p, true);
         // let v = this.view.getFloat32(p, true);
         return v;
     }
 
     GetString(stringIdx) {
         let str = this.stringCache[stringIdx];
         if (str) {
             return str;
         }
         let start = stringIdx * 8; // 字符串是8字节对齐
         let length = this.view.getUint32(this.start + start, true);
         if (length === 0) {
             return "";
         }
         start = this.start + start + 4;
         // start = start + 4;
         let ab = this.buf.slice(start, start + length);
         let ui8 = new Uint8Array(ab);
         let utf8decoder = new util.TextDecoder("utf-8", {
             fatal: true
         });
         try {
             str = utf8decoder.decode(ui8);
         } catch (e) {
             console.warn(e);
             str = "";
         }
         if (str === null) {
             throw Error('no string value of idx:' + stringIdx);
         }
         this.stringCache[stringIdx] = str;
         return str;
     }
 
     readSub(length) {
         let v = this.getSub(this.pos, length);
         this.pos += length;
         return v;
     }
 
     getSub(pos, length) {
         // let buf;
         // if (typeof (length) === "undefined") {
         //     buf = this.buf.slice(pos);
         // } else {
         //     buf = this.buf.slice(pos, pos + length);
         // }
         // let reader = new OBArrayBufferReader(buf);
         // reader.start = this.start + pos;
         // return reader;
         let reader = new OBArrayBufferReader(this.buf);
         reader.start = this.start + pos;
         return reader;
     }
 
     seek(pos) {
         if (typeof (pos) === "number") {
             this.pos = pos;
         }
         return this.pos;
     }
     /**
          *
          * @param {Number} startIdx
          * @returns {number[]}
          */
     GetInt32FromBin(startIdx) {
         let start = startIdx * 8; // 8字节对齐
         let p = this.pos;
         this.pos = start;
         let byteLength = this.ReadUInt32();
         let length = byteLength / 4;
         let r = [];
         for (let i = 0; i < length; i++) {
             r.push(this.ReadInt32());
         }
         this.pos = p;
         return r;
     }
 }
 
 
 class OBStatementContext {
     constructor() {
         // this.InstPos;
         this.Actions = [];
     }
     PushAction(Instruction) {
         this.Actions.push(Instruction);
     }
 }
 // 虚拟机
 
 class VMInterruptException {
 }
 class ChangeStateException extends VMInterruptException {
 }
 class FSMDestroyException extends VMInterruptException {
 }
 class VMDestroyException {
 
 }
 class VMPausedException {
     constructor(msg) {
         this.message = msg;
         this.stack = [];
     }
 }
 class VM {
     // /**
     //  * @type {function(any)}
     //  */
     // Output;
     // setTimeout;
     // /**
     //  * typeName->[VMFSM]
     //  * @type {Object.<string,OBVMFSM[]>}
     //  */
     // Running = {};
     // /**
     //  * @type OBScript
     //  */
     // script;
     // /**
     //  * @type {OBVMFSM}
     //  */
     // Pending = [];
     /**
      *
      * @param {OBScript} script
      * @param {Object} config
      */
     constructor(script, config) {
         this.logLevel = 5;
         this.paused = null;
         this.pausing = false;
         this.Running = {};
         this.RunningByID = {};
         this.Pending = [];
         if (!script) {
             throw Error("Script is null");
         }
         this.script = script;
         if (config) {
             Object.assign(this, config);
         }
         if (!this.setTimeout) {
             this.setTimeout = setTimeout.bind(window);
         }
     }
     static stackInfo(st, uf) {
         if (!(st)) {
             return {};
         }
         let fsmType = st.fsm.data.FullName;
         let args = {
             fsmType,
             fsm: st.fsm.toString(),
             state: st.data.Name,
             func: uf ? uf.data.Signure : null,
             module: fsmType.substring(0, fsmType.indexOf('.')),
             blockId: st.fsm.VM.debugger ? st.fsm.VM.debugger.currentBlockId : null
         };
         return args;
     }
     static makeError(title, st, uf, local, moreinfo) {
         let e = new VMPausedException(title);
         e.block = VM.stackInfo(st, uf);
         e.info = moreinfo;
         return e;
     }
     pause() {
         this.pausing = true;
     }
     resume() {
         // TODO
     }
     isRunning() {
         return !this.paused;
     }
     CreateFSM(name, st, ofun) {
         if (name == null) {
             return null;
         }
         if (this.script == null) {
             throw Error("Script is null");
         }
         let fsmdata = this.script.FullNameFSMData[name];
         if (!fsmdata) {
             if (this.logLevel <= 6)
                 this.Log('No FSM named ' + name, 'sys', 6)
             return null;
         }
         let uBFSM = new OBVMFSM(this, fsmdata);
         uBFSM.PostPrioritizedMessage(new EventMessage("Start", "", null, null));
         let list = this.Running[name];
         if (!list) {
             list = [];
             this.Running[name] = list;
         }
         list.push(uBFSM);
         this.RunningByID[uBFSM.id] = uBFSM;
         if (this.debugger) {
             let args = {
                 type: name,
                 fsmName: uBFSM.toString()
             };
             this.debugger.debugEvent('FSM created', VM.stackInfo(uBFSM.CurrentState), args, 2);
         }
         return uBFSM;
     }
     getFsmByID(fsmID) {
         return this.RunningByID[fsmID];
     }
     update() {
         if (!this.isRunning()) {
             return false;
         }
         try {
             this._HandleOnePendingFSM();
         } catch (e) {
             if (e instanceof VMPausedException) {
                 this.paused = e;
                 if (this.debugger) {
                     this.debugger.debugEvent('Error', e.block, e.info ? e.info : { title: e.message }, 10, e.stack);
                 }
                 throw e;
             } else if (e instanceof VMDestroyException) {
                 // this.Pending = null;
                 // this.Running = null;
                 if (this.debugger) {
                     this.debugger.debugEvent('VM destroy', {
                         message: e.message
                     }, 9);
                 }
             }
             throw e;
         }
         // let timestamp = Date.now();
         // JS不需要在VM中处理计划任务
         // this._HandleSchedulingTask(timestamp);
         // this._InvokeScheduledTask(timestamp);
         return true;
     }
 
     _HandleOnePendingFSM() {
         while (this.Pending.length > 0) {
             let fsm = this.Pending.shift();
             if (fsm) {
                 fsm.HandleAllMessages();
             }
         }
     }
     /**
          *
          * @param {OBVMFSM} fsm
          */
     _AddPendingFSM(fsm) {
         if (!this.Pending.includes(fsm)) {
             this.Pending.push(fsm);
         }
     }
 
     Log(v, type, level, state, ofunc) {
         if (level < this.logLevel) {
             return;
         }
         let spath;
         if (state) {
             spath = state.fsm.toString() + "/" + state.data.Name;
             if (ofunc) {
                 spath += "-" + ofunc.data.Signure;
             }
         } else {
             spath = "";
         }
         if (this.Output) {
             if (this.debugger) {
                 this.Output(v, type, level, spath, VM.stackInfo(state, ofunc));
             } else {
                 this.Output(v, type, level, spath);
             }
         }
     }
     /**
          *
          * @param {OBVMFSM} fsm
          */
     DestroyFSM(fsm) {
         let name = fsm.data.FullName;
         delete this.RunningByID[fsm.id];
         let list = this.Running[name];
         if (list) {
             let idx = list.findIndex((f) => f === fsm);
             if (idx > -1) {
                 list.splice(idx, 1);
             }
         }
     }
     /**
          *
          * @param {UserMessage} userMessage
          */
     BroadcastMessage(userMessage, sendToSelf) {
         Object.values(this.Running).forEach(l => {
             for (let i = 0; i < l.length; i++) {
                 let f = l[i];
                 if (f && (sendToSelf || f != userMessage.sender)) {
                     f.PostMessage(userMessage);
                 }
             }
         });
     }
     /**
          *
          * @param {number} millisecond wait time
          * @param {*} callback
          */
     Schedule(millisecond, callback) {
         this.setTimeout(callback, millisecond, this);
     }
 
     FindRunningFSMByType(typeFullName) {
         return this.Running[typeFullName] || [];
     }
 
     /**
      * 
      * @param {String} type
      * @return {Number} 
      */
     typeToRegType(type) {
         if (type === "") {
             return -1;
         }
         switch (type) {
             case "Integer":
                 return 0;
             case "Number":
                 return 1;
             case "String":
                 return 2;
         }
         if (this.script.StructDef && this.script.StructDef[type]) {
             return 3;
         } else {
             return 4;
         }
     }
     /**
      * @param {StructData} structData
      */
     encodeStructData(structData, st, uf, local) {
         /**
          * @type {StructDef}
          */
         let def = structData.Def
         let name = def.Name;
         let encoder = new util.TextEncoder();
         let name_buf = encoder.encode(name);
         /**
          * @type {Uint8Array}
          */
         let data = def.encode(structData, st, uf, local);
         let buffer = new ArrayBuffer(
             1 // length of name_buf
             + name_buf.length // name_buf
             + 4 // length of data
             + data.byteLength
         );
         let arr = new Uint8Array(buffer);
         let dataView = new DataView(buffer);
         arr[0] = name_buf.byteLength;
         arr.set(new Uint8Array(name_buf.buffer), 1);
         dataView.setUint32(1 + name_buf.length, data.byteLength);
         arr.set(data, 5 + name_buf.byteLength);
         return arr;
     }
     decodeStructData(arrayBuffer) {
         let uint8arr = new Uint8Array(arrayBuffer);
         let dataView = new DataView(arrayBuffer);
         let decoder = new util.TextDecoder();
         let name_buf_length = uint8arr[0];
         let name_buf = uint8arr.subarray(1, 1 + name_buf_length);
         let name = decoder.decode(name_buf);
         let def = this.script.StructDef[name];
         let data_byte_length = dataView.getUint32(1 + name_buf_length);
         let data = uint8arr.subarray(5 + name_buf_length, 5 + name_buf_length + data_byte_length);
         let structData = def.decode(data);
         return structData;
     }
     /**
      * 
      * @param {UserMessage} msg 
      * @return {Uint8Array[]}
      */
     messageToBuffer(msg, st, uf, local) {
         //
         let senderID = msg.sender ? msg.sender.id : 0;
         //
         let name = msg.name;
         let encoder = new util.TextEncoder();
         //
         let name_buf = encoder.encode(name);
         //
         let argRegType = this.typeToRegType(msg.GetArgType())
         //
         let argBuffer;
         switch (argRegType) {
             case -1:
                 argBuffer = new ArrayBuffer();
                 break;
             case 0:
                 let ib = Int32Array.of(msg.arg);
                 argBuffer = ib.buffer;
                 break;
             case 1:
                 let fb = Float32Array.of(msg.arg);
                 argBuffer = fb.buffer;
                 break;
             case 2:
                 let sb = encoder.encode(msg.arg);
                 argBuffer = sb.buffer;
                 break;
             case 3:
                 let stcB = this.encodeStructData(msg.arg, st, uf, local);
                 argBuffer = stcB.buffer;
                 break;
             case 4:
                 throw new Error('不能发送本地类型');
                 break;
             case 5:
                 throw new Error('寄存器类型错误 ' + argRegType);
                 break;
         }
         let buffer = new ArrayBuffer(
             4 // senderID
             + 1//name_buf.length
             + name_buf.length//name_buf
             + 1//argRegType
             + 4//argBuffer.length
             + argBuffer.byteLength//argBuffer
         );
         let arr = new Uint8Array(buffer);
         let dataView = new DataView(buffer);
         dataView.setUint32(0, senderID);
         dataView.setUint8(4, name_buf.length);
         arr.set(new Uint8Array(name_buf.buffer), 5);
         dataView.setUint8(5 + name_buf.length, argRegType);
         dataView.setUint32(6 + name_buf.length, argBuffer.byteLength);
         arr.set(new Uint8Array(argBuffer), 10 + name_buf.length);
         return arr;
     }
     /**
      * 
      * @param {Uint8Array} uint8arr 
      * @return {UserMessage}
      */
     u8arrayToMessage(uint8arr, fsmBuilder) {
         let dataView = new DataView(
             uint8arr.buffer.slice(uint8arr.byteOffset,
                 uint8arr.byteOffset + uint8arr.byteLength)
         );
         let sender;
         let senderID = dataView.getUint32(0);
         if (senderID > 0) {
             sender = fsmBuilder(senderID);
         }
         let name_byte_length = dataView.getUint8(4);
         let name_buf = uint8arr.subarray(5, 5 + name_byte_length);
         let decoder = new util.TextDecoder();
         let name = decoder.decode(name_buf);
         let argRegType = dataView.getUint8(5 + name_byte_length);
         let arg_length = dataView.getUint32(6 + name_byte_length);
         let argbuf = uint8arr.slice(10 + name_byte_length, 10 + name_byte_length + arg_length).buffer;
         let typename;
         let body;
         switch (argRegType) {
             case -1:
             case 255:
                 typename = "";
                 body = null;
                 break;
             case 0:
                 typename = 'Integer';
                 let uint32Arr = new Uint32Array(argbuf);
                 body = uint32Arr[0];
                 break;
             case 1:
                 typename = 'Number';
                 let float32Arr = new Float32Array(argbuf);
                 body = float32Arr[0];
                 break;
             case 2:
                 typename = 'String';
                 body = decoder.decode(argbuf);
                 break;
             case 3:
                 body = this.decodeStructData(argbuf);
                 typename = body.Def.Name;
                 break;
             case 4:
                 throw new Error('不支持本地对象反序列化');
             default:
                 throw new Error('寄存器类型错误 ' + argRegType);
         }
         let msg = new UserMessage(name, typename, body, sender);
         return msg;
     }
 }
 let ID_GEN = 1;
 class OBVMFSM {
     // /**
     //  * @type {any}
     //  */
     // Target;
     // /**
     //  * @type {OBFSM}
     //  */
     // data;
     // id;
     // /**
     //  * @type {OBVMState}
     //  */
     // CurrentState;
     // /**
     //  * @type {OBVMState[]}
     //  */
     // StateStack = [];
     // /**
     //  * @type {VM}
     //  */
     // VM;
     // Inbox = [];
     // PrioritizedInbox = [];
     // VariableGroup;
     /**
      *
      * @param {VM} vm
      * @param {OBFSM} data
      */
     constructor(vm, data) {
         this.Running = true;
         this.OnDestroyedCallbacks = [];
         this.StateStack = [];
         this.Inbox = [];
         this.PrioritizedInbox = [];
         this.data = data;
         this.id = ++ID_GEN;
         this.VM = vm;
         this.VariableGroup = new OBTypedVariableGroup(data.Variables);
         this.CurrentState = new OBVMState(data.Entry, this);
     }
     /**
          * 推送高优先级消息
          * @param {Message} msg
          */
     PostPrioritizedMessage(msg) {
         if (this.PrioritizedInbox == null) {
             return;
         }
         this.PrioritizedInbox.push(msg);
         this.VM._AddPendingFSM(this);
     }
     /**
          * 推送消息
          * @param {Message} msg
          */
     PostMessage(msg) {
         if (!this.Running) {
             return;
         }
         if (this.Inbox == null) {
             return;
         }
         this.Inbox.push(msg);
         this.VM._AddPendingFSM(this);
     }
 
     HandleAllMessages() {
         if (!this.CurrentState) {
             return;
         }
         let msg;
         while (msg = this.PrioritizedInbox.shift()) {
             msg.Handle(this.CurrentState);
         }
         while (msg = this.Inbox.shift()) {
             msg.Handle(this.CurrentState);
             while (msg = this.PrioritizedInbox.shift()) {
                 msg.Handle(this.CurrentState);
             }
         }
     }
 
     OnDestroyed(f) {
         this.OnDestroyedCallbacks.push(f);
     }
     OffDestroyed(f) {
         let idx = this.OnDestroyedCallbacks.indexOf(f);
         if (idx >= 0) {
             this.OnDestroyedCallbacks.slice(idx, 1);
         }
     }
     Destroy() {
         this.VariableGroup = null;
         this.CurrentState = null;
         this.Inbox.length = 0;
         this.StateStack.length = 0;
         this.PrioritizedInbox.length = 0;
         this.VM.DestroyFSM(this);
         this.Running = false;
         this.OnDestroyedCallbacks.forEach(f => {
             f(this);
         });
     }
     /**
          *
          * @param {string} title
          * @returns bool
          */
     IsListeningEvent(title) {
         return this.CurrentState.IsListeningEvent(title);
     }
 
     toString() {
         return "FSM:" + this.data.FullName + '#' + this.id;
     }
 
     ChangeState(name, ofun) {
         if (this.VM == null) {
             return;
         }
         if (this.data.States[name]) {
             let lastState = this.CurrentState;
             this.CurrentState = new OBVMState(this.data.States[name], this);
             this.PostPrioritizedMessage(new EventMessage("Start", null, null, this));
             if (this.VM.debugger) {
                 let args = {
                     lastState: lastState.data.Name,
                     currentState: name
                 }
                 this.VM.debugger.debugEvent('State changed', VM.stackInfo(lastState, ofun), args, 1)
             }
         } else {
             throw Error("No state named " + name + " of FSM " + this.data.Name);
         }
     }
 
     PushState(nextStateName, f) {
         this.StateStack.push(this.CurrentState);
         this.ChangeState(nextStateName, f);
     }
 
     PopState(f) {
         let lastState = this.CurrentState;
         this.CurrentState = this.StateStack.pop();
         this.PostPrioritizedMessage(new EventMessage("Restore", null, null, this));
         if (this.VM.debugger) {
             let args = {
                 lastState: lastState.data.Name,
                 currentName: this.CurrentState.data.Name
             }
             this.VM.debugger.debugEvent('State changed', VM.stackInfo(lastState, f), args, 1)
         }
     }
 }
 class OBTypedVariableGroup {
     // LongRegister;
     // DoubleRegister;
     // StringRegister;
     // StructRegister;
     // NObjectRegister;
     /**
      *
      * @param {OBVariableInfo[]} variables
      */
     constructor(variables) {
         if (!variables) {
             return;
         }
         variables.forEach(v => {
             if (v.count == 0) {
                 return;
             }
             switch (v.typeIdx) {
                 case 0:
                     if (this.LongRegister != null) {
                         throw Error("duplicated type " + v.typeIdx);
                     }
                     this.LongRegister = [];
                     this.LongRegister.length = v.count;
                     this.LongRegister.fill(0);
                     break;
                 case 1:
                     if (this.DoubleRegister != null) {
                         throw Error("duplicated type " + v.typeIdx);
                     }
                     this.DoubleRegister = [];
                     this.DoubleRegister.length = v.count;
                     this.DoubleRegister.fill(0);
                     break;
                 case 2:
                     if (this.StringRegister != null) {
                         throw Error("duplicated type " + v.typeIdx);
                     }
                     this.StringRegister = [];
                     this.StringRegister.length = v.count;
                     this.StringRegister.fill("");
                     break;
 
                 case 3:
                     if (this.StructRegister != null) {
                         throw Error("duplicated type " + v.typeIdx);
                     }
                     this.StructRegister = [];
                     this.StructRegister.length = v.count;
                     break;
                 case 4:
                     if (this.NObjectRegister != null) {
                         throw Error("duplicated type " + v.typeIdx);
                     }
                     this.NObjectRegister = [];
                     this.NObjectRegister.length = v.count;
                     break;
                 default:
                     throw Error("Unknown type " + v.typeIdx);
             }
         });
     }
     /**
      * 
      * @param {OBTypedVariableGroup} another 
      */
     copyFrom(another, readOnly, circleDetection) {
         if (!circleDetection) {
             circleDetection = [another];
         } else if (circleDetection.indexOf(another) >= 0) {
             throw Error('循环引用');
         }
         if (another.DoubleRegister)
             this.DoubleRegister = Array.from(another.DoubleRegister);
         if (another.LongRegister)
             this.LongRegister = Array.from(another.LongRegister);
         if (another.StringRegister)
             this.StringRegister = Array.from(another.StringRegister);
         if (another.StructRegister) {
             let structRegister = [];
             OBTypedVariableGroup.copyStructTo(another.StructRegister, structRegister, readOnly, circleDetection);
             this.StructRegister = structRegister;
         }
         if (another.NObjectRegister)
             this.NObjectRegister = Array.from(another.NObjectRegister);
     }
     static copyStructTo(_from, _to, readOnly, circleDetection) {
         _from.forEach((v, i) => {
             _to[i] = v.deepClone(readOnly, circleDetection);
         });
     }
 }
 class OBVMState {
     // /**
     //  * @type {OBState}
     //  */
     // data;
     // /**
     //  * @type {OBVMFSM}
     //  */
     // fsm;
     // /**
     //  * @type {OBTypedVariableGroup}
     //  */
     // VariableGroup;
     // /**
     //  * @type {Message}
     //  */
     // currentMessage;
 
     /**
      * 
      * @param {OBState} data 
      * @param {OBVMFSM} fsm 
      */
     constructor(data, fsm) {
         this.data = data;
         this.VariableGroup = new OBTypedVariableGroup(data.Variables);
         this.fsm = fsm;
     }
     /**
          *
          * @param {Message} msg
          */
     HandleEvent(msg) {
         try {
             let h = this.data.EventHandlers[msg.name];
             if (h) {
                 if (this.fsm.VM.debugger) {
                     this.fsm.VM.debugger.debugEvent('Event received', {
                         fsmType: this.fsm.data.FullName,
                         module: this.fsm.data.ModuleName,
                         state: this.data.Name,
                         fsm: this.fsm.toString()
                     }, {
                         fsm: this.fsm.toString(),
                         msg: msg.name,
                         sender: msg.sender ? msg.sender.toString() : null
                     }, 0);
                 }
                 this.currentMessage = msg;
                 new OBVMFunction(h.Func).Call(this);
             }
         } finally {
             this.currentMessage = null;
         }
     }
 
     HandleMessage(m) {
         this.currentMessage = m;
         try {
             let typeName = null;
             if (m.arg != null) {
                 typeName = m.GetArgType();
             }
             let hl = this.data.MessageHandlers[m.name];
             if (hl) {
                 if (this.fsm.VM.debugger) {
                     this.fsm.VM.debugger.debugEvent('Message received', {
                         fsmType: this.fsm.data.FullName,
                         module: this.fsm.data.ModuleName,
                         state: this.data.Name,
                         fsm: this.fsm.toString()
                     }, {
                         fsm: this.fsm.toString(),
                         msg: m.name,
                         sender: m.sender ? m.sender.toString() : null
                     }, 0);
                 }
                 hl.forEach(h => {
                     if (h.ArgTypeName === "" || h.ArgTypeName === typeName) {
                         new OBVMFunction(h.Func).Call(this);
                     }
                 });
             }
         } finally {
             this.currentMessage = null;
         }
     }
     /**
          *
          * @param {string} title
          * @returns bool
          */
     IsListeningEvent(title) {
         return !!this.data.EventHandlers[title];
     }
 
     ReceivedMessage() {
         if (this.currentMessage) {
             return this.currentMessage.arg;
         } else {
             throw Error("当前上下文没有消息可用");
         }
     }
 
     CurrentMessageSender() {
         if (this.currentMessage) {
             return this.currentMessage.sender;
         } else {
             throw Error("当前上下文没有消息可用");
         }
     }
 }
 class OBVMFunction {
     // /**
     //  * @type {OBFunction}
     //  */
     // data;
     // /**
     //  * @type {OBTypedVariableGroup}
     //  */
     // LocalVar;
     // returnType = -1;
     // returnValue;
     // LongRegister;
     // DoubleRegister;
     // StringRegister;
     // StructRegister;
     // NObjectRegister;
     /**
      *
      * @param {OBFunction} obfunc
      */
     constructor(obfunc, builder, args) {
         this.returnType = -1;
         this.data = obfunc;
         let LocalVar = new OBTypedVariableGroup(obfunc.Variables);
         this.LocalVar = LocalVar;
         if (builder) {
             /**
              * @type {List<Func<UBState, UBFunction, TypedVariableGroup, long>>();}
              */
             let LongRegister_ = null;//[];
             let DoubleRegister_ = null;//[];// new List<Func<UBState, UBFunction, TypedVariableGroup, double>>();
             let StringRegister_ = null;//[];// new List<Func<UBState, UBFunction, TypedVariableGroup, string>>();
             let StructRegister_ = null;//[];// new List<Func<UBState, UBFunction, TypedVariableGroup, AStruct>>();
             let NObjectRegister_ = null;//[];//new List<Func<UBState, UBFunction, TypedVariableGroup, object>>();
 
             for (let i = 1; i < args.length; i++) {
                 let arg = args[i];
                 let Register = arg & 0xFFF;
                 let RegisterType = (arg >> 12) & 0xF;
 
                 switch (RegisterType) {
                     case 0:
                         if (!LongRegister_) {
                             LongRegister_ = [];
                         }
                         LongRegister_.push(builder.LongRegister(Register));
                         break;
                     case 1:
                         if (!DoubleRegister_) {
                             DoubleRegister_ = [];
                         }
                         DoubleRegister_.push(builder.DoubleRegister(Register));
                         break;
                     case 2:
                         if (!StringRegister_) {
                             StringRegister_ = [];
                         }
                         StringRegister_.push(builder.StringRegister(Register));
                         break;
                     case 3:
                         if (!StructRegister_) {
                             StructRegister_ = [];
                         }
                         StructRegister_.push(builder.StructRegister(Register));
                         break;
                     case 4:
                         if (!NObjectRegister_) {
                             NObjectRegister_ = [];
                         }
                         NObjectRegister_.push(builder.NObjectRegister(Register));
                         break;
                     default:
                         throw Error("Unknown type " + RegisterType);
                 }
             }
             if (LongRegister_) {
                 this.LongRegister = LongRegister_;
             }
             if (DoubleRegister_) {
                 this.DoubleRegister = DoubleRegister_;
             }
             if (StringRegister_) {
                 this.StringRegister = StringRegister_;
             }
             if (StructRegister_) {
                 this.StructRegister = StructRegister_;
             }
             if (NObjectRegister_) {
                 this.NObjectRegister = NObjectRegister_;
             }
         }
     }
     /**
          *
          * @param {OBVMState} state
          */
     Call(state, uBFunction, localVars) {
         if (uBFunction) {
             if (this.LongRegister != null) {
                 for (let i = 0; i < this.LongRegister.length; i++) {
                     this.LocalVar.LongRegister[i] = this.LongRegister[i](state, uBFunction, localVars);
                 }
             }
             if (this.DoubleRegister != null) {
                 for (let i = 0; i < this.DoubleRegister.length; i++) {
                     this.LocalVar.DoubleRegister[i] = this.DoubleRegister[i](state, uBFunction, localVars);
                 }
             }
             if (this.StringRegister != null) {
                 for (let i = 0; i < this.StringRegister.length; i++) {
                     this.LocalVar.StringRegister[i] = this.StringRegister[i](state, uBFunction, localVars);
                 }
             }
             if (this.StructRegister != null) {
                 for (let i = 0; i < this.StructRegister.length; i++) {
                     this.LocalVar.StructRegister[i] = this.StructRegister[i](state, uBFunction, localVars);
                 }
             }
             if (this.NObjectRegister != null) {
                 for (let i = 0; i < this.NObjectRegister.length; i++) {
                     this.LocalVar.NObjectRegister[i] = this.NObjectRegister[i](state, uBFunction, localVars);
                 }
             }
         }
         this._run(state, uBFunction, localVars, 0);
     }
     _run(state, uBFunction, localVars, pos) {
         let Actions = this.data.Statements.Actions;
         for (let i = pos; i < Actions.length && i >= 0;) {
             let action = Actions[i];
             try {
                 i = action(state, this, this.LocalVar, i);
             } catch (e) {
                 if (e instanceof VMInterruptException) {
                     throw e;
                 } else if (e instanceof VMPausedException) {
                     e.stack.unshift({
                         func: this,
                         pos: i,
                         state: state,
                         OBFunction: uBFunction,
                         localVars,
                         blockId: state.fsm.VM.debugger ? state.fsm.VM.debugger.currentBlockId : null
                     });
                     e.block = VM.stackInfo(state, this);
                     throw e;
                 } else {
                     throw VM.makeError(e.message, state, uBFunction, localVars, e);
                 }
             }
         }
     }
 
     SetReturnLong(v) {
         this.returnType = 1;
         this.returnValue = v;
     }
 
     Long() {
         if (this.returnType === 1) {
             return this.returnValue;
         }
         else {
             throw Error(this.data.Signure + " 没有返回 long 类型:" + this.returnType);
         }
     }
 
     SetReturnDouble(v) {
         this.returnType = 2;
         this.returnValue = v;
     }
 
     Double() {
         if (this.returnType === 2) {
             return this.returnValue;
         }
         else {
             throw Error(this.data.Signure + " 没有返回 double 类型:" + this.returnType);
         }
     }
 
     SetReturnString(v) {
         this.returnType = 3;
         this.returnValue = v;
     }
 
     String() {
         if (this.returnType === 3) {
             return this.returnValue;
         }
         else {
             throw Error(this.data.Signure + " 没有返回 string 类型:" + this.returnType);
         }
     }
 
     SetReturnStruct(v) {
         this.returnType = 4;
         this.returnValue = v;
     }
 
     Struct() {
         if (this.returnType === 4) {
             return this.returnValue;
         }
         else {
             throw Error(this.data.Signure + " 没有返回 Struct 类型:" + this.returnType);
         }
     }
 
     SetReturnNObject(v) {
         this.returnType = 5;
         this.returnValue = v;
     }
 
     NObject() {
         if (this.returnType === 5) {
             return this.returnValue;
         }
         else {
             throw Error(this.data.Signure + " 没有返回 NObject 类型:" + this.returnType);
         }
     }
 }
 class Message {
     // name;
     // arg;
     // argType;
     // sender;
     /**
      *
      * @param {string} name
      * @param {string} argType
      * @param {any} arg
      * @param {?OBVMFSM} sender
      */
     constructor(name, argType, arg, sender) {
         this.name = name;
         this.argType = argType;
         this.sender = sender;
         if (arg instanceof OBStructValue && !arg.isReadOnly()) {
             this.arg = arg.deepClone(true, []);
         } else {
             this.arg = arg;
         }
     }
 
     GetArgType() {
         return this.argType;
     }
 
     static ArgTypeOf(typeId, arg) {
         switch (typeId) {
             case 0xf:
                 return "";
             case 0:
                 return "Integer";
             case 1:
                 return "Number";
             case 2:
                 return "String";
             case 3:
                 return arg.Def.Name;
             case 4:
                 // return "NObject";
                 if (arg.constructor === OBVMFSM) {
                     return "FSM";
                 } else {
                     if (arg.constructor) {
                         return arg.constructor.name;
                     } else {
                         throw Error('Can not get type name of native type');
                     }
                 }
             // case 4:
             //     console.warn("should not get type name of native type");
             //     if (arg.constructor) {
             //         return arg.constructor.name;
             //     }else{
             //         throw Error('Can not get type name of native type');
             //     }
             default:
                 throw Error("Unknown type:" + typeId);
         }
     }
 }
 class EventMessage extends Message {
     /**
      *
      * @param {OBVMState} state
      */
     Handle(state) {
         try {
             state.HandleEvent(this);
         }
         catch (err) {
             if (!(err instanceof VMInterruptException)) {
                 throw err;
             }
         }
     }
 }
 class UserMessage extends Message {
 
     /**
      *
      * @param {OBVMState} state
      */
     Handle(state) {
         try {
             state.HandleMessage(this);
         } catch (err) {
             if (!(err instanceof VMInterruptException)) {
                 console.error(err);
                 throw err;
             }
         }
     }
 }
 // 字节码
 class LDSTR extends OBInstruction {
     // Value;
     // Register;
 
     init(code, builder, instructions, i) {
         let stridx = code & 0xFFFF;
         this.Value = builder.loader.data.GetString(stridx);
         this.Register = (code & 0xFF0000) >> 16;
     }
 
     link(builder, instructions, idx) {
         builder.StringRegister(this.Register, this.getValue.bind(this));
     }
 
     getValue(UBState, obvmfunction, TypedRegisters) {
         return this.Value;
     }
 }
 class PRT extends OBInstruction {
     // RegisterType;
     // RegisterIdx;
 
     init(code, builder, instructions, i) {
         this.RegisterType = (code & 0xF00000) >> 20;
         this.RegisterIdx = code & 0xFFFFF;
     }
 
     link(builder, instructions, idx) {
         let v;
         function toString(key, value) {
             if (typeof (value.toString) === 'function') {
                 return value.toString();
             } else {
                 return value;
             }
         }
         switch (this.RegisterType) {
             case 0:
                 v = builder.LongRegister(this.RegisterIdx);
                 break;
             case 1:
                 v = builder.DoubleRegister(this.RegisterIdx);
                 break;
             case 2:
                 v = builder.StringRegister(this.RegisterIdx);
                 break;
             case 3:
                 let gets = builder.StructRegister(this.RegisterIdx);
                 v = (s, f, l) => {
                     let struct = gets(s, f, l);
                     if (!struct) {
                         return ""
                     }
                     return JSON.stringify(struct, toString);
                 };
                 break;
             case 4:
                 let getn = builder.NObjectRegister(this.RegisterIdx);
                 v = (s, f, l) => {
                     let struct = getn(s, f, l);
                     if (!struct) {
                         return ""
                     }
                     return JSON.stringify(struct, toString);
                 };
                 break;
             default:
                 throw Error("Unknown type:" + this.RegisterType);
         }
         builder.PushAction((st, uf, locals, pos) => {
             //Console.WriteLine(n(st, uf));
             let vm = st.fsm.VM;
             if (vm.logLevel <= 4) {
                 let val = v(st, uf, locals);
                 vm.Log(val, 'usr', 4, st, uf);
             }
             return ++pos;
         });
     }
 }
 class ReceivedMessage extends OBInstruction {
     // typeId;
     // Register;
 
     init(code, builder, instructions, i) {
         this.typeId = (code >> 20) & 0xf;
         this.Register = code & 0xfffff;
     }
 
     link(builder, instructions, idx) {
         let Register = this.Register;
         switch (this.typeId) {
             case 0:
                 builder.LongRegister(Register, (st, uf, locals) => {
                     return st.ReceivedMessage();
                 });
                 break;
             case 1:
                 builder.DoubleRegister(Register, (st, uf, locals) => {
                     return st.ReceivedMessage();
                 });
                 break;
             case 2:
                 builder.StringRegister(Register, (st, uf, locals) => {
                     return st.ReceivedMessage();
                 });
                 break;
             case 3:
                 builder.StructRegister(Register, (st, uf, locals) => {
                     return st.ReceivedMessage();
                 });
                 break;
             case 4:
                 builder.NObjectRegister(Register, (st, uf, locals) => {
                     return st.ReceivedMessage();
                 });
                 break;
             default:
                 throw Error("Unknown type " + this.typeId);
         }
     }
 }
 class STVS extends OBInstruction {
     // Register;
     // VarIdx;
     // RegisterType;
 
     init(code, builder, instructions, i) {
         this.Register = (code & 0xFF00) >> 8;
         this.RegisterType = (code & 0xFF0000) >> 16;
         this.VarIdx = code & 0xFF;
     }
 
     link(builder, instructions, idx) {
         let Register = this.Register;
         let VarIdx = this.VarIdx;
         let RegisterType = this.RegisterType;
         switch (RegisterType) {
             case 0:
                 let fl = builder.LongRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     st.VariableGroup.LongRegister[VarIdx] = fl(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 1:
                 let fd = builder.DoubleRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     st.VariableGroup.DoubleRegister[VarIdx] = fd(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 2:
                 let fs = builder.StringRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     st.VariableGroup.StringRegister[VarIdx] = fs(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 3:
                 let fst = builder.StructRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     let stt = fst(st, uf, locals);
                     if (!stt) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     st.VariableGroup.StructRegister[VarIdx] = stt;
                     return ++pos;
                 });
                 break;
             case 4:
                 let fo = builder.NObjectRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     st.VariableGroup.NObjectRegister[VarIdx] = fo(st, uf, locals);
                     return ++pos;
                 });
                 break;
             default:
                 throw Error("Unknown type " + RegisterType);
         }
     }
 }
 class STVG extends OBInstruction {
     // Register;
     // VarIdx;
     // RegisterType;
 
     init(code, builder, instructions, i) {
         this.Register = (code & 0xFF00) >> 8;
         this.RegisterType = (code & 0xFF0000) >> 16;
         this.VarIdx = code & 0xFF;
     }
 
     link(builder, instructions, idx) {
         let Register = this.Register;
         let VarIdx = this.VarIdx;
         switch (this.RegisterType) {
             case 0:
                 builder.LongRegister(Register, (st, uf, locals) => {
                     return st.VariableGroup.LongRegister[VarIdx];
                 });
                 break;
             case 1:
                 builder.DoubleRegister(Register, (st, uf, locals) => {
                     return st.VariableGroup.DoubleRegister[VarIdx];
                 });
                 break;
             case 2:
                 builder.StringRegister(Register, (st, uf, locals) => {
                     return st.VariableGroup.StringRegister[VarIdx];
                 });
                 break;
             case 3:
                 builder.StructRegister(Register, (st, uf, locals) => {
                     let v = st.VariableGroup.StructRegister[VarIdx];
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return v;
                 });
                 break;
             case 4:
                 builder.NObjectRegister(Register, (st, uf, locals) => {
                     return st.VariableGroup.NObjectRegister[VarIdx];
                 });
                 break;
             default:
                 throw Error("Unknown type " + this.RegisterType);
         }
     }
 }
 class StructFieldDesc extends OBInstruction {
     // fieldTypeId;
     // fieldDescIdx;
 
     init(code, builder, instructions, i) {
         this.fieldDescIdx = code & 0xfffff;
         this.fieldTypeId = (code >> 20) & 0xf;
     }
 }
 class GetStructField extends OBInstruction {
     // structIdx;
     // Register;
     // typeId;
     // fieldIdx;
 
     init(code, builder, instructions, i) {
         let desc = instructions[i - 1];
         if (!(desc instanceof StructFieldDesc)) {
             throw Error("last cmd is not StructFieldDesc");
         }
         this.structIdx = (code >> 12) & 0xfff;
         this.Register = (code) & 0xfff;
         this.typeId = desc.fieldTypeId;
         this.fieldIdx = desc.fieldDescIdx;
     }
 
     link(builder, instructions, idx) {
         let Register = this.Register;
         let fieldIdx = this.fieldIdx;
         let getStruct = builder.StructRegister(this.structIdx);
         switch (this.typeId) {
 
             case 0:
                 builder.LongRegister(Register, (st, uf, locals) => {
                     let stt = getStruct(st, uf, locals);
                     if (!stt) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return stt.registers.LongRegister[fieldIdx];
                 });
                 break;
             case 1:
                 builder.DoubleRegister(Register, (st, uf, locals) => {
                     let stt = getStruct(st, uf, locals);
                     if (!stt) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return stt.registers.DoubleRegister[fieldIdx];
                 });
                 break;
             case 2:
                 builder.StringRegister(Register, (st, uf, locals) => {
                     let stt = getStruct(st, uf, locals);
                     if (!stt) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return stt.registers.StringRegister[fieldIdx];
                 });
                 break;
             case 3:
                 builder.StructRegister(Register, (st, uf, locals) => {
                     let stt = getStruct(st, uf, locals);
                     if (!stt) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     let v = stt.registers.StructRegister[fieldIdx];
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return v;
                 });
                 break;
             case 4:
                 builder.NObjectRegister(Register, (st, uf, locals) => {
                     let stt = getStruct(st, uf, locals);
                     if (!stt) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return stt.registers.NObjectRegister[fieldIdx];
                 });
                 break;
             default:
                 throw Error("Unknown type " + this.typeId);
         }
 
     }
 }
 class SetStructField extends OBInstruction {
     // structIdx;
     // Register;
     // typeId;
     // fieldIdx;
 
     init(code, builder, instructions, i) {
         let desc = instructions[i - 1];
         if (!(desc instanceof StructFieldDesc)) {
             throw Error("last cmd is not StructFieldDesc");
         }
         this.structIdx = (code >> 12) & 0xfff;
         this.Register = (code) & 0xfff;
         this.typeId = desc.fieldTypeId;
         this.fieldIdx = desc.fieldDescIdx;
     }
 
     link(builder, instructions, idx) {
         let Register = this.Register;
         let fieldIdx = this.fieldIdx;
         let getStruct = builder.StructRegister(this.structIdx);
         switch (this.typeId) {
             case 0:
                 let getLong = builder.LongRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     let struct = getStruct(st, uf, locals);
                     if (struct.readOnly) {
                         throw VM.makeError('read only struct', st, uf, locals);
                     }
                     struct.registers.LongRegister[fieldIdx] = getLong(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 1:
                 let getDouble = builder.DoubleRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     let struct = getStruct(st, uf, locals);
                     if (struct.readOnly) {
                         throw VM.makeError('read only struct', st, uf, locals);
                     }
                     struct.registers.DoubleRegister[fieldIdx] = getDouble(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 2:
                 let GetString = builder.StringRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     let struct = getStruct(st, uf, locals);
                     if (struct.readOnly) {
                         throw VM.makeError('read only struct', st, uf, locals);
                     }
                     struct.registers.StringRegister[fieldIdx] = GetString(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 3:
                 let getStruct1 = builder.StructRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     let s1 = getStruct1(st, uf, locals);
                     if (!s1) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     let struct = getStruct(st, uf, locals);
                     if (struct.readOnly) {
                         throw VM.makeError('read only struct', st, uf, locals);
                     }
                     struct.registers.StructRegister[fieldIdx] = s1;
                     return ++pos;
                 });
                 break;
             case 4:
                 let getNObject = builder.NObjectRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     let struct = getStruct(st, uf, locals);
                     if (struct.readOnly) {
                         throw VM.makeError('read only struct', st, uf, locals);
                     }
                     struct.registers.NObjectRegister[fieldIdx] = getNObject(st, uf, locals);
                     return ++pos;
                 });
                 break;
             default:
                 throw Error("Unknown type " + this.typeId);
         }
 
     }
 }
 class CHSTT extends OBInstruction {
     // StateName;
 
     init(code, builder, instructions, i) {
         let strIdx = (code & 0xFFFFFF);
         let str = builder.loader.data.GetString(strIdx);
         this.StateName = str;
     }
 
     link(builder, instructions, idx) {
         builder.PushAction((state, uf, locals, pos) => {
             state.fsm.ChangeState(this.StateName, uf);
             throw new ChangeStateException();
             //return ++pos;
         });
     }
 }
 class PUSTT extends OBInstruction {
     // StateName;
 
     init(code, builder, instructions, i) {
         let strIdx = (code & 0xFFFFFF);
         let str = builder.loader.data.GetString(strIdx);
         this.StateName = str;
     }
 
     link(builder, instructions, idx) {
         builder.PushAction((state, uf, locals, pos) => {
             state.fsm.PushState(this.StateName, uf);
             throw new ChangeStateException();
             //return ++pos;
         });
     }
 }
 class POPSTT extends OBInstruction {
     // StateName;
 
     init(code, builder, instructions, i) {
     }
 
     link(builder, instructions, idx) {
         builder.PushAction((state, uf, locals, pos) => {
             state.fsm.PopState(uf);
             throw new ChangeStateException();
             //return ++pos;
         });
     }
 }
 class DBI extends OBInstruction {
 
     init(code, builder, instructions, i) {
         let stridx = code & 0xFFFF;
         this.BlockId = builder.loader.data.GetString(stridx);
     }
 
     link(builder, instructions, idx) {
         builder.PushAction((st, uf, locals, pos) => {
             if (st.fsm.VM.debugger) {
                 st.fsm.VM.debugger.setCurrentBlock(this.BlockId);
             }
             return ++pos;
         });
     }
 }
 class DBE extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.valueReg = (code >> 10) & 0x3ff;
         this.valueTargetReg = (code >> 0) & 0x3ff;
         this.valueRegType = (code >> 20) & 0x7;
         /**
          * @type {ExtInfo}
          */
         let anchor = instructions[i - 1];
         if (!(anchor instanceof ExtInfo)) {
             throw Error("last cmd is not ExtInfo");
         }
         let stridx = anchor.info;
         this.BlockId = builder.loader.data.GetString(stridx);
     }
 
     link(builder, instructions, idx) {
 
         let Register = this.valueReg;
         let getter;
         let that = this;
         let f =
             // function () { return
             (st, uf, locals) => {
                 if (st.fsm.VM.debugger) {
                     st.fsm.VM.debugger.setCurrentBlock(that.BlockId);
                 }
                 let v = getter(st, uf, locals);
                 if (st.fsm.VM.debugger) {
                     st.fsm.VM.debugger.setLastResult(that.valueRegType, v);
                 }
                 return v;
             };
         // };
         switch (this.valueRegType) {
             case 0:
                 getter = builder.LongRegister(this.valueTargetReg);
                 if (!getter) { debugger }
                 builder.LongRegister(Register, f);
                 break;
             case 1:
                 getter = builder.DoubleRegister(this.valueTargetReg);
                 if (!getter) { debugger }
                 builder.DoubleRegister(Register, f);
                 break;
             case 2:
                 getter = builder.StringRegister(this.valueTargetReg);
                 if (!getter) { debugger }
                 builder.StringRegister(Register, f);
                 break;
             case 3:
                 getter = builder.StructRegister(this.valueTargetReg);
                 if (!getter) { debugger }
                 builder.StructRegister(Register, f);
                 break;
             case 4:
                 getter = builder.NObjectRegister(this.valueTargetReg);
                 if (!getter) { debugger }
                 builder.NObjectRegister(Register, f);
                 break;
             default:
                 throw Error("Unknown type " + this.typeId);
         }
     }
 }
 class ExtInfo extends OBInstruction {
     // RegisterInfoIdx;
 
     init(code, builder, instructions, i) {
         this.info = code & 0xFFFF;
     }
 }
 class NativeMethodCall extends OBInstruction {
     // LibNameIdx;
 
     init(code, builder, instructions, i) {
         this.LibNameIdx = code & 0xFFFFFF;
     }
 
     link(builder, instructions, idx) {
         let LibName = builder.loader.data.GetString(this.LibNameIdx);
         let anchor = instructions[idx - 1];
         if (!(anchor instanceof ExtInfo)) {
             throw Error("last cmd is not ExtInfo");
         }
         let RegisterInfoIdx = anchor.info;
         let args = builder.loader.data.GetInt32FromBin(RegisterInfoIdx);
         let funcIdx = args[0];
         let _args = args.slice(1);
         let installer = builder.loader.script.getNativeFunc(LibName, funcIdx);
         installer(builder, _args);
     }
 }
 class FSMVS extends OBInstruction {
     // Register;
     // VarIdx;
     // RegisterType;
 
     init(code, builder, instructions, i) {
         this.Register = (code & 0xFF00) >> 8;
         this.RegisterType = (code & 0xFF0000) >> 16;
         this.VarIdx = code & 0xFF;
     }
 
     link(builder, instructions, idx) {
         let Register = this.Register;
         let VarIdx = this.VarIdx;
         let RegisterType = this.RegisterType;
         switch (RegisterType) {
             case 0:
                 let fl = builder.LongRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     st.fsm.VariableGroup.LongRegister[VarIdx] = fl(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 1:
                 let fd = builder.DoubleRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     st.fsm.VariableGroup.DoubleRegister[VarIdx] = fd(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 2:
                 let fs = builder.StringRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     st.fsm.VariableGroup.StringRegister[VarIdx] = fs(st, uf, locals);
                     return ++pos;
                 });
                 break;
             case 3:
                 let fst = builder.StructRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     let v = fst(st, uf, locals);
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     st.fsm.VariableGroup.StructRegister[VarIdx] = v;
                     return ++pos;
                 });
                 break;
             case 4:
                 let fo = builder.NObjectRegister(Register);
                 builder.PushAction((st, uf, locals, pos) => {
                     st.fsm.VariableGroup.NObjectRegister[VarIdx] = fo(st, uf, locals);
                     return ++pos;
                 });
                 break;
             default:
                 throw Error("Unknown type " + RegisterType);
         }
     }
 }
 class SLF extends OBInstruction {
     // RegisterIdx;
 
     init(code, builder, instructions, i) {
         this.RegisterIdx = code & 0xffffff;
     }
 
     link(builder, instructions, idx) {
         builder.NObjectRegister(this.RegisterIdx, (s, f, l) => {
             return s.fsm;
         });
     }
 }
 class MethodCall extends OBInstruction {
     // MethodNameIdx;
 
     init(code, builder, instructions, i) {
         this.MethodNameIdx = code & 0xFFFFFF;
     }
 
     link(builder, instructions, idx) {
         let MethodName = builder.loader.data.GetString(this.MethodNameIdx);
         let anchor = instructions[idx - 1];
         if (!(anchor instanceof ExtInfo)) {
             throw Error("last cmd is not ExtInfo");
         }
         let RegisterInfoIdx = anchor.info;
         let args = builder.loader.data.GetInt32FromBin(RegisterInfoIdx);
 
         let uf1 = builder.loader.script.loadedFunctions[MethodName];
         if (uf1 != null) {
             // 参数
             let f = new OBVMFunction(uf1, builder, args);
             let returnRegister = args[0];
             if (returnRegister === -1) {
                 builder.PushAction((state, uf, localVars, pos) => {
                     f.Call(state, f, localVars);
                     return ++pos;
                 });
             } else {
                 let Register = returnRegister & 0xFFF;
                 let registerType = (returnRegister >> 12) & 0xF;
                 // 处理有返回值的情况
                 switch (registerType) {
                     case 0:
                         builder.LongRegister(Register, (st, uf, l) => {
                             f.Call(st, uf, l);
                             return f.Long();
                         });
                         break;
                     case 1:
                         builder.DoubleRegister(Register, (st, uf, l) => {
                             f.Call(st, uf, l);
                             return f.Double();
                         });
                         break;
                     case 2:
                         builder.StringRegister(Register, (st, uf, l) => {
                             f.Call(st, uf, l);
                             return f.String();
                         });
                         break;
                     case 3:
                         builder.StructRegister(Register, (st, uf, l) => {
                             f.Call(st, uf, l);
                             let v = f.Struct();
                             if (!v) {
                                 throw VM.makeError('Read uninitialized field', st, uf, l);
                             }
                             return v;
                         });
                         break;
                     case 4:
                         builder.NObjectRegister(Register, (st, uf, l) => {
                             f.Call(st, uf, l);
                             return f.NObject();
                         });
                         break;
                     default:
                         throw Error("Unknown type " + registerType);
                 }
             }
         } else {
             throw Error("未找到函数 " + MethodName);
         }
     }
 }
 class BRIFN extends OBInstruction {
     // checkRegType;
     // checkRegIdx;
     // targetOffset;
     // targetOffsetBak;
 
     init(code, builder, instructions, i) {
         this.checkRegType = ((code >> 20) & 0xf);
         this.checkRegIdx = ((code >> 15) & 0x1f);
         this.targetOffset = ((code) & 0x3fff);//(((code & 0x1fff) << 19) >> 19); //;// ((code) & 0x1fff);
         this.targetOffsetBak = this.targetOffset;
         builder.PositionUpdate(this.targetOffset * 4, (newPos) => {
             this.targetOffset = newPos;
         });
     }
 
     link(builder, instructions, idx) {
         let checkRegType = this.checkRegType;
         let checkRegIdx = this.checkRegIdx;
         switch (checkRegType) {
             case 0:
                 let LongReg = builder.LongRegister(checkRegIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     if (LongReg(st, uf, locals) === 0) {
                         return this.targetOffset;
                     } else {
                         return ++pos;
                     }
                 });
                 break;
             case 1:
                 let DoubleReg = builder.DoubleRegister(checkRegIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     if (DoubleReg(st, uf, locals) === 0) {
                         return this.targetOffset;
                     } else {
                         return ++pos;
                     }
                 });
                 break;
             case 2:
                 let StringReg = builder.StringRegister(checkRegIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     let str = StringReg(st, uf, locals);
                     if (str == null || ("" === (str))) {
                         return this.targetOffset;
                     } else {
                         return ++pos;
                     }
                 });
                 break;
             // 数据结构不参与布尔运算
             // case 3:
             //     let StructReg = builder.StructRegister(checkRegIdx);
             //     builder.PushAction((st, uf, locals, pos) => {
             //         if (StructReg(st, uf, locals) == null) {
             //             return this.targetOffset;
             //         } else {
             //             return ++pos;
             //         }
             //     });
             //     break;
             case 4:
                 let NObjectReg = builder.NObjectRegister(checkRegIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     if (NObjectReg(st, uf, locals) == null) {
                         return this.targetOffset;
                     } else {
                         return ++pos;
                     }
                 });
                 break;
             default:
                 throw Error("Unknown type " + checkRegType);
         }
     }
 }
 class BR extends OBInstruction {
     // Offset;
 
     init(code, builder, instructions, i) {
         this.Offset = ((code << 8) >> 8);
         builder.PositionUpdate(this.Offset * 4, (newPos) => {
             this.Offset = newPos;
         });
     }
 
     link(builder, instructions, idx) {
         builder.PushAction((ub, uf, locals, pos) => {
             return this.Offset;
         });
     }
 }
 class NOP extends OBInstruction {
     link(builder, instructions, idx) {
         builder.PushAction((st, uf, locals, pos) => {
             return pos + 1;
         });
     }
 }
 class ARITHF extends OBInstruction {
     // Opcode;
     // LeftRegister;
     // RightRegister;
 
     init(code, builder, instructions, i) {
         this.LeftRegister = (code >> 10) & 0x3FF;
         this.RightRegister = (code & 0x3FF);
         this.Opcode = (code >> 20) & 0xf;
     }
 
     link(builder, instructions, idx) {
         let left = builder.DoubleRegister(this.LeftRegister);
         let right = builder.DoubleRegister(this.RightRegister);
         if (left == null) {
             throw Error("left is null");
         }
         if (right == null) {
             throw Error("right is null");
         }
         let o;
         switch (this.Opcode) {
             case 0:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l + r;
                 }
                 break;
             case 1:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l - r;
                 }
                 break;
             case 2:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l * r;
                 }
                 break;
             case 3:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l / r;
                 }
                 break;
             case 4:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return Math.pow(l, r);
                 }
                 break;
             case 5:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l % r;
                 }
                 break;
             case 6:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return Math.atan2(l, r);
                 }
                 break;
             default:
                 throw Error("未知操作符 " + this.Opcode);
         }
         builder.DoubleRegister(this.LeftRegister, o);
     }
 }
 
 class ARITHI extends OBInstruction {
     // Opcode;
     // LeftRegister;
     // RightRegister;
 
     init(code, builder, instructions, i) {
         this.LeftRegister = (code >> 10) & 0x3FF;
         this.RightRegister = (code & 0x3FF);
         this.Opcode = (code >> 20) & 0xf;
     }
 
     link(builder, instructions, idx) {
         let left = builder.LongRegister(this.LeftRegister);
         let right = builder.LongRegister(this.RightRegister);
         if (left == null) {
             throw Error("left is null");
         }
         if (right == null) {
             throw Error("right is null");
         }
         let o;
         switch (this.Opcode) {
             case 0:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l + r;
                 }
                 break;
             case 1:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l - r;
                 }
                 break;
             case 2:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l * r;
                 }
                 break;
             case 3:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return Math.floor(l / r);
                 }
                 break;
             case 4:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return Math.floor(Math.pow(l, r));
                 }
                 break;
             case 5:
                 o = (st, f, locals) => {
                     var l = left(st, f, locals);
                     var r = right(st, f, locals);
                     return l % r;
                 }
                 break;
             default:
                 throw Error("未知操作符 " + this.Opcode);
         }
         builder.LongRegister(this.LeftRegister, o);
     }
 }
 class LDI extends OBInstruction {
     // Register;
     // Value;
 
     init(code, builder, instructions, i) {
         let pos = code & 0xFFF;
         this.Value = builder.loader.data.getInt32(pos * 4); // 4字节对齐
         this.Register = ((code & 0xFF0000) >> 16);
     }
 
     link(builder, instructions, idx) {
         builder.LongRegister(this.Register, () => {
             return this.Value;
         });
     }
 }
 class LDF extends OBInstruction {
     // Register;
     // Value;
 
     init(code, builder, instructions, i) {
         let specal = code & 0xFFFF;
         switch (specal) {
             case 0xFFFE:
                 this.Value = Number.POSITIVE_INFINITY;
                 break;
             case 0xFFFD:
                 this.Value = Number.NEGATIVE_INFINITY;
                 break;
             case 0xFFFF:
                 this.Value = Number.NaN;
                 break;
             default:
                 this.Value = builder.loader.data.getFloat(specal * 4);
                 break;
         }
         this.Register = ((code & 0xFF0000) >> 16);
     }
 
     link(builder, instructions, idx) {
         builder.DoubleRegister(this.Register, () => {
             return this.Value;
         });
     }
 }
 class RET extends OBInstruction {
     // RegisterType;
     // RegisterIdx;
 
     init(code, builder, instructions, i) {
         this.RegisterType = ((code & 0xF00000) >> 20);
         this.RegisterIdx = (code & 0xFFFFF);
     }
 
     link(builder, instructions, idx) {
         switch (this.RegisterType) {
             case 0:
                 let l = builder.LongRegister(this.RegisterIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     let v = l(st, uf, locals);
                     uf.SetReturnLong(v);
                     return -1;
                 });
                 break;
             case 1:
                 let f = builder.DoubleRegister(this.RegisterIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     let v = f(st, uf, locals);
                     uf.SetReturnDouble(v);
                     return -1;
                 });
                 break;
             case 2:
                 let s = builder.StringRegister(this.RegisterIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     //Console.WriteLine(s(st, uf));
                     let v = s(st, uf, locals);
                     uf.SetReturnString(v);
                     return -1;
                 });
                 break;
             case 3:
                 let u = builder.StructRegister(this.RegisterIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     //Console.WriteLine(u(st, uf));
                     let v = u(st, uf, locals);
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     uf.SetReturnStruct(v);
                     return -1;
                 });
                 break;
             case 4:
                 let n = builder.NObjectRegister(this.RegisterIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     //Console.WriteLine(n(st, uf));
                     let v = n(st, uf, locals);
                     uf.SetReturnNObject(v);
                     return -1;
                 });
                 break;
             case 0xf:
                 builder.PushAction((st, uf, locals, pos) => {
                     return -1;
                 });
                 break;
             default:
                 throw Error("Unknown type:" + this.RegisterType);
         }
     }
 }
 class DebugInstruct extends OBInstruction {
     init(code, builder, instructions, i) {
         let _blockId = code & 0xFFFF;
 
         this.blockId = builder.loader.data.GetString(_blockId);
     }
 }
 class FSMVG extends OBInstruction {
     // Register;
     // VarIdx;
     // RegisterType;
 
     init(code, builder, instructions, i) {
         this.Register = (code & 0xFF00) >> 8;
         this.RegisterType = (code & 0xFF0000) >> 16;
         this.VarIdx = code & 0xFF;
     }
 
     link(builder, instructions, idx) {
         let VarIdx = this.VarIdx;
         let Register = this.Register;
         switch (this.RegisterType) {
             case 0:
                 builder.LongRegister(Register, (st, uf, l) => {
                     return st.fsm.VariableGroup.LongRegister[VarIdx];
                 });
                 break;
             case 1:
                 builder.DoubleRegister(Register, (st, uf, l) => {
                     return st.fsm.VariableGroup.DoubleRegister[VarIdx];
                 });
                 break;
             case 2:
                 builder.StringRegister(Register, (st, uf, l) => {
                     return st.fsm.VariableGroup.StringRegister[VarIdx];
                 });
                 break;
             case 3:
                 builder.StructRegister(Register, (st, uf, l) => {
                     let v = st.fsm.VariableGroup.StructRegister[VarIdx];
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, l);
                     }
                     return v;
                 });
                 break;
             case 4:
                 builder.NObjectRegister(Register, (st, uf, l) => {
                     return st.fsm.VariableGroup.NObjectRegister[VarIdx];
                 });
                 break;
             default:
                 throw Error("Unknown type " + this.RegisterType);
         }
     }
 }
 class CreateFSM extends OBInstruction {
     // FSMTypeName;
     // ReturnRegister;
 
     init(code, builder, instructions, i) {
         let FSMTypeNameIdx = code & 0xFFFF;
         this.FSMTypeName = builder.loader.data.GetString(FSMTypeNameIdx);
         this.ReturnRegister = (code & 0xFF0000) >> 16;
     }
 
     link(builder, instructions, idx) {
         builder.NObjectRegister(this.ReturnRegister, (st, fun, l) => {
             let fsm = st.fsm.VM.CreateFSM(this.FSMTypeName, st, fun);
             if (!fsm) {
                 throw VM.makeError('Can not find FSM type', st, uf, locals, { fsmType: this.FSMTypeName });
             } else {
                 fsm.Target = st.fsm.Target;
                 if (st.fsm.VM.debugger) {
                     let args = {
                         newFsm: fsm.toString()
                     }
                     st.fsm.VM.debugger.debugEvent('FSM created by', VM.stackInfo(st, fun), args, 1)
                 }
             }
             return fsm;
         });
     }
 }
 class FSMSendMsg extends OBInstruction {
     // TitleIdx;
     // TargetIdx;
     // BodyTypeID;
     // BodyRegisterIdx;
 
     init(code, builder, instructions, i) {
         this.TargetIdx = ((code >> 17) & 0x7F);
         this.TitleIdx = ((code >> 10) & 0x7F);
         this.BodyTypeID = ((code >> 6) & 0xF);
 
         this.BodyRegisterIdx = (code & 0x3F);
         if (this.BodyTypeID == 4) {
             let typedata = instructions[i - 1];
             if (!(typedata instanceof ExtInfo)) {
                 throw Error("last cmd is not ExtInfo");
             }
             this.TypeName = builder.loader.data.GetString(typedata.info);
         }
     }
     /**
          *
          * @param {OBFunctionBuilder} builder
          * @param {*} instructions
          * @param {*} idx
          */
     link(builder, instructions, idx) {
         let f_title = builder.StringRegister(this.TitleIdx);
         let f_body = this.makeBody(builder);
         let f_fsm = builder.NObjectRegister(this.TargetIdx);
         builder.PushAction((st, uf, locals, pos) => {
             let fsm = f_fsm(st, uf, locals);
             if (fsm) {
                 let title = f_title(st, uf, locals);
                 let body = f_body(st, uf, locals);
                 let typename;
                 if (this.BodyTypeID == 4) {
                     typename = this.TypeName;
                 } else {
                     typename = Message.ArgTypeOf(this.BodyTypeID, body);
                 }
                 fsm.PostMessage(new UserMessage(title, typename, body, st.fsm));
             }
             return ++pos;
         });
     }
     /**
          *
          * @param {OBFunctionBuilder} builder
          * @returns
          */
     makeBody(builder) {
         let BodyRegisterIdx = this.BodyRegisterIdx;
         switch (this.BodyTypeID) {
             case 0xF:
                 return (st, uf, locals) => null;
             case 0:
                 var l = builder.LongRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return l(st, uf, locals);
                 };
             case 1:
                 var d = builder.DoubleRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return d(st, uf, locals);
                 };
             case 2:
                 var s = builder.StringRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return s(st, uf, locals);
                 };
             case 3:
                 var s1 = builder.StructRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     let v = s1(st, uf, locals);
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return v;
                 };
             case 4:
                 var n = builder.NObjectRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return n(st, uf, locals);
                 };
             default:
                 throw Error("Unknown type " + this.BodyTypeID);
         }
     }
 }
 class GZ0 extends OBInstruction {
     // VarType;
     // VarIdx;
     // ResultIdx;
 
     init(code, builder, instructions, i) {
         this.VarType = ((code >> 20) & 0xf);
         this.VarIdx = ((code >> 10) & 0x3ff);
         this.ResultIdx = (code & 0x3ff);
     }
 
     link(builder, instructions, idx) {
         let ResultIdx = this.ResultIdx;
         let VarIdx = this.VarIdx;
         switch (this.VarType) {
             case 0:
                 let getLong = builder.LongRegister(VarIdx);
                 builder.LongRegister(ResultIdx, (st, uf, locals) => {
                     let lv = getLong(st, uf, locals);
                     return lv > 0 ? 1 : 0;
                 });
                 break;
             case 1:
                 let getDouble = builder.DoubleRegister(VarIdx);
                 builder.LongRegister(ResultIdx, (st, uf, locals) => {
                     return getDouble(st, uf, locals) > 0 ? 1 : 0;
                 });
                 break;
             case 2:
                 let GetString = builder.StringRegister(VarIdx);
                 builder.LongRegister(ResultIdx, (st, uf, locals) => {
                     return GetString(st, uf, locals) != null ? 1 : 0;
                 });
                 break;
             // 数据结构使用之前必须初始化，初始化之后不会为null
             // case 3:
             //     let getStruct = builder.StructRegister(VarIdx);
             //     builder.LongRegister(ResultIdx, (st, uf, locals) => {
             //         return getStruct(st, uf, locals) != null ? 1 : 0;
             //     });
             //     break;
             case 4:
                 let getNObject = builder.NObjectRegister(VarIdx);
                 builder.LongRegister(ResultIdx, (st, uf, locals) => {
                     return getNObject(st, uf, locals) == null ? 1 : 0;
                 });
                 break;
             default:
                 throw Error("Unknown type " + this.VarType);
         }
     }
 }
 
 class BRIF extends OBInstruction {
     // checkRegType;
     // checkRegIdx;
     // targetOffset;
 
     init(code, builder, instructions, i) {
         this.checkRegType = ((code >> 20) & 0xf);
         this.checkRegIdx = ((code >> 15) & 0x1f);
         this.targetOffset = ((code) & 0x3fff); //;// ((code) & 0x1fff);
         builder.PositionUpdate(this.targetOffset * 4, (newPos) => {
             this.targetOffset = newPos;
         });
     }
 
     link(builder, instructions, idx) {
         let checkRegType = this.checkRegType;
         let checkRegIdx = this.checkRegIdx;
         switch (checkRegType) {
             case 0:
                 let LongReg = builder.LongRegister(checkRegIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     if (LongReg(st, uf, locals) != 0) {
                         return this.targetOffset;
                     } else {
                         return ++pos;
                     }
                 });
                 break;
             case 1:
                 let DoubleReg = builder.DoubleRegister(checkRegIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     if (DoubleReg(st, uf, locals) != 0) {
                         return this.targetOffset;
                     } else {
                         return ++pos;
                     }
                 });
                 break;
             case 2:
                 let StringReg = builder.StringRegister(checkRegIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     let str = StringReg(st, uf, locals);
                     if (str != null && !("" === (str))) {
                         return this.targetOffset;
                     } else {
                         return ++pos;
                     }
                 });
                 break;
             // 数据结构初始化后不为空
             // case 3:
             //     let StructReg = builder.StructRegister(checkRegIdx);
             //     builder.PushAction((st, uf, locals, pos) => {
             //         if (StructReg(st, uf, locals) != null) {
             //             return this.targetOffset;
             //         } else {
             //             return ++pos;
             //         }
             //     });
             //     break;
             case 4:
                 let NObjectReg = builder.NObjectRegister(checkRegIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     if (NObjectReg(st, uf, locals) != null) {
                         return this.targetOffset;
                     } else {
                         return ++pos;
                     }
                 });
                 break;
             default:
                 throw Error("Unknown type " + this.checkRegType);
         }
     }
 }
 class DEC extends OBInstruction {
     // regType;
     // regIdx;
 
     init(code, builder, instructions, i) {
         this.regType = ((code >> 20) & 0xf);
         this.regIdx = ((code) & 0xfffff);
     }
 
     link(builder, instructions, idx) {
         let regIdx = this.regIdx;
         switch (this.regType) {
             case 0:
                 let LongReg = builder.LongRegister(regIdx);
                 builder.LongRegister(regIdx, (st, uf, locals) => {
                     let v = LongReg(st, uf, locals);
                     return v - 1;
                 });
                 break;
             case 1:
                 let DoubleReg = builder.DoubleRegister(regIdx);
                 builder.DoubleRegister(regIdx, (st, uf, locals) => {
                     let v = DoubleReg(st, uf, locals);
                     return v - 1;
                 });
                 break;
             case 2:
             case 3:
             case 4:
             default:
                 throw Error("Unsupport type " + this.regType);
         }
     }
 }
 class Reg2Var extends OBInstruction {
     // type;
     // varIdx;
     // regIdx;
 
     init(code, builder, instructions, i) {
         this.type = ((code >> 20) & 0xf);
         this.regIdx = ((code >> 10) & 0x3ff);
         this.varIdx = ((code) & 0x3ff);
     }
 
     link(builder, instructions, idx) {
         let varIdx = this.varIdx;
         let regIdx = this.regIdx;
         switch (this.type) {
             case 0:
                 let getLong = builder.LongRegister(regIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     locals.LongRegister[varIdx] = getLong(st, uf, locals);
                     return 1 + pos;
                 });
                 break;
             case 1:
                 let getDouble = builder.DoubleRegister(regIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     locals.DoubleRegister[varIdx] = getDouble(st, uf, locals);
                     return 1 + pos;
                 });
                 break;
             case 2:
                 let GetString = builder.StringRegister(regIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     locals.StringRegister[varIdx] = GetString(st, uf, locals);
                     return 1 + pos;
                 });
                 break;
             case 3:
                 let getStruct = builder.StructRegister(regIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     let v = getStruct(st, uf, locals);
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     locals.StructRegister[varIdx] = v;
                     return 1 + pos;
                 });
                 break;
             case 4:
                 let getNObject = builder.NObjectRegister(regIdx);
                 builder.PushAction((st, uf, locals, pos) => {
                     locals.NObjectRegister[varIdx] = getNObject(st, uf, locals);
                     return 1 + pos;
                 });
                 break;
             default:
                 throw Error("Unsupport type:" + this.type);
         }
     }
 }
 class Var2Reg extends OBInstruction {
     // type;
     // varIdx;
     // regIdx;
 
     init(code, builder, instructions, i) {
         this.type = ((code >> 20) & 0xf);
         this.regIdx = ((code >> 10) & 0x3ff);
         this.varIdx = ((code) & 0x3ff);
     }
 
     link(builder, instructions, idx) {
         let varIdx = this.varIdx;
         let regIdx = this.regIdx;
         switch (this.type) {
             case 0:
                 builder.LongRegister(regIdx, (st, uf, locals) => {
                     return locals.LongRegister[varIdx];
                 });
                 break;
             case 1:
                 builder.DoubleRegister(regIdx, (st, uf, locals) => {
                     return locals.DoubleRegister[varIdx];
                 });
                 break;
             case 2:
                 builder.StringRegister(regIdx, (st, uf, locals) => {
                     return locals.StringRegister[varIdx];
                 });
                 break;
             case 3:
                 builder.StructRegister(regIdx, (st, uf, locals) => {
                     let v = locals.StructRegister[varIdx];
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return v;
                 });
                 break;
             case 4:
                 builder.NObjectRegister(regIdx, (st, uf, locals) => {
                     return locals.NObjectRegister[varIdx];
                 });
                 break;
             default:
                 throw Error("Unsupport type:" + this.type);
         }
     }
 }
 class I2F extends OBInstruction {
     // intRegIdx;
     // floatRegIdx;
 
     init(code, builder, instructions, i) {
         this.intRegIdx = ((code) >> 12) & 0xFFF;
         this.floatRegIdx = ((code) & 0xFFF);
     }
 
     link(builder, instructions, idx) {
         let getLong = builder.LongRegister(this.intRegIdx);
         builder.DoubleRegister(this.floatRegIdx, (st, uf, locals) => {
             return getLong(st, uf, locals);
         });
     }
 }
 class EQ extends OBInstruction {
     // ArgTypeId;
     // LeftIdx;
     // RightIdx;
     // RetIdx;
 
     init(code, builder, instructions, i) {
         this.ArgTypeId = (code >> 20) & 0xF;
         this.LeftIdx = (code >> 14) & 0x3f;
         this.RightIdx = (code >> 7) & 0x7f;
         this.RetIdx = code & 0x7f;
     }
     /**
          *
          * @param {OBFunctionBuilder} builder
          * @param {*} instructions
          * @param {*} idx
          */
     link(builder, instructions, idx) {
         let LeftReg;
         let RightReg;
         switch (this.ArgTypeId) {
             case 0:
                 LeftReg = builder.LongRegister(this.LeftIdx);
                 RightReg = builder.LongRegister(this.RightIdx);
                 break;
             case 1:
                 LeftReg = builder.DoubleRegister(this.LeftIdx);
                 RightReg = builder.DoubleRegister(this.RightIdx);
                 break;
             case 2:
                 LeftReg = builder.StringRegister(this.LeftIdx);
                 RightReg = builder.StringRegister(this.RightIdx);
                 break;
             case 3:
                 LeftReg = builder.StructRegister(this.LeftIdx);
                 RightReg = builder.StructRegister(this.RightIdx);
                 break;
             case 4:
                 LeftReg = builder.NObjectRegister(this.LeftIdx);
                 RightReg = builder.NObjectRegister(this.RightIdx);
                 break;
             default:
                 throw Error("不支持类型：" + this.ArgTypeId);
         }
         builder.LongRegister(this.RetIdx, (st, uf, locals) => {
             return LeftReg(st, uf, locals) === RightReg(st, uf, locals) ? 1 : 0;
         });
     }
 }
 class NEQ extends OBInstruction {
     // ArgTypeId;
     // LeftIdx;
     // RightIdx;
     // RetIdx;
 
     init(code, builder, instructions, i) {
         this.ArgTypeId = (code >> 20) & 0xF;
         this.LeftIdx = (code >> 14) & 0x3f;
         this.RightIdx = (code >> 7) & 0x7f;
         this.RetIdx = code & 0x7f;
     }
     /**
          *
          * @param {OBFunctionBuilder} builder
          * @param {*} instructions
          * @param {*} idx
          */
     link(builder, instructions, idx) {
         let LeftReg;
         let RightReg;
         switch (this.ArgTypeId) {
             case 0:
                 LeftReg = builder.LongRegister(this.LeftIdx);
                 RightReg = builder.LongRegister(this.RightIdx);
                 break;
             case 1:
                 LeftReg = builder.DoubleRegister(this.LeftIdx);
                 RightReg = builder.DoubleRegister(this.RightIdx);
                 break;
             case 2:
                 LeftReg = builder.StringRegister(this.LeftIdx);
                 RightReg = builder.StringRegister(this.RightIdx);
                 break;
             case 3:
                 LeftReg = builder.StructRegister(this.LeftIdx);
                 RightReg = builder.StructRegister(this.RightIdx);
                 break;
             case 4:
                 LeftReg = builder.NObjectRegister(this.LeftIdx);
                 RightReg = builder.NObjectRegister(this.RightIdx);
                 break;
             default:
                 throw Error("不支持类型：" + this.ArgTypeId);
         }
         builder.LongRegister(this.RetIdx, (st, uf, locals) => {
             return LeftReg(st, uf, locals) != RightReg(st, uf, locals) ? 1 : 0;
         });
     }
 }
 class LT extends OBInstruction {
     // ArgTypeId;
     // LeftIdx;
     // RightIdx;
     // RetIdx;
 
     init(code, builder, instructions, i) {
         this.ArgTypeId = (code >> 20) & 0xF;
         this.LeftIdx = (code >> 14) & 0x3f;
         this.RightIdx = (code >> 7) & 0x7f;
         this.RetIdx = code & 0x7f;
     }
 
     link(builder, instructions, idx) {
         let LeftReg;
         let RightReg;
         switch (this.ArgTypeId) {
             case 0:
                 LeftReg = builder.LongRegister(this.LeftIdx);
                 RightReg = builder.LongRegister(this.RightIdx);
                 break;
             case 1:
                 LeftReg = builder.DoubleRegister(this.LeftIdx);
                 RightReg = builder.DoubleRegister(this.RightIdx);
                 break;
             case 2:
                 LeftReg = builder.StringRegister(this.LeftIdx);
                 RightReg = builder.StringRegister(this.RightIdx);
                 break;
             default:
                 throw Error("不支持类型：" + this.ArgTypeId);
         }
         builder.LongRegister(this.RetIdx, (st, uf, locals) => {
             return LeftReg(st, uf, locals) < RightReg(st, uf, locals) ? 1 : 0;
         });
     }
 }
 class LTE extends OBInstruction {
     // ArgTypeId;
     // LeftIdx;
     // RightIdx;
     // RetIdx;
 
     init(code, builder, instructions, i) {
         this.ArgTypeId = (code >> 20) & 0xF;
         this.LeftIdx = (code >> 14) & 0x3f;
         this.RightIdx = (code >> 7) & 0x7f;
         this.RetIdx = code & 0x7f;
     }
 
     link(builder, instructions, idx) {
         let LeftReg;
         let RightReg;
         switch (this.ArgTypeId) {
             case 0:
                 LeftReg = builder.LongRegister(this.LeftIdx);
                 RightReg = builder.LongRegister(this.RightIdx);
                 break;
             case 1:
                 LeftReg = builder.DoubleRegister(this.LeftIdx);
                 RightReg = builder.DoubleRegister(this.RightIdx);
                 break;
             case 2:
                 LeftReg = builder.StringRegister(this.LeftIdx);
                 RightReg = builder.StringRegister(this.RightIdx);
                 break;
             default:
                 throw Error("不支持类型：" + this.ArgTypeId);
         }
         builder.LongRegister(this.RetIdx, (st, uf, locals) => {
             return LeftReg(st, uf, locals) <= RightReg(st, uf, locals) ? 1 : 0;
         });
     }
 }
 class GT extends OBInstruction {
     // ArgTypeId;
     // LeftIdx;
     // RightIdx;
     // RetIdx;
 
     init(code, builder, instructions, i) {
         this.ArgTypeId = (code >> 20) & 0xF;
         this.LeftIdx = (code >> 14) & 0x3f;
         this.RightIdx = (code >> 7) & 0x7f;
         this.RetIdx = code & 0x7f;
     }
 
     link(builder, instructions, idx) {
         let LeftReg;
         let RightReg;
         switch (this.ArgTypeId) {
             case 0:
                 LeftReg = builder.LongRegister(this.LeftIdx);
                 RightReg = builder.LongRegister(this.RightIdx);
                 break;
             case 1:
                 LeftReg = builder.DoubleRegister(this.LeftIdx);
                 RightReg = builder.DoubleRegister(this.RightIdx);
                 break;
             case 2:
                 LeftReg = builder.StringRegister(this.LeftIdx);
                 RightReg = builder.StringRegister(this.RightIdx);
                 break;
             default:
                 throw Error("不支持类型：" + this.ArgTypeId);
         }
         builder.LongRegister(this.RetIdx, (st, uf, locals) => {
             return LeftReg(st, uf, locals) > RightReg(st, uf, locals) ? 1 : 0;
         });
     }
 }
 
 class GTE extends OBInstruction {
     // ArgTypeId;
     // LeftIdx;
     // RightIdx;
     // RetIdx;
 
     init(code, builder, instructions, i) {
         this.ArgTypeId = (code >> 20) & 0xF;
         this.LeftIdx = (code >> 14) & 0x3f;
         this.RightIdx = (code >> 7) & 0x7f;
         this.RetIdx = code & 0x7f;
     }
 
     link(builder, instructions, idx) {
         let LeftReg;
         let RightReg;
         switch (this.ArgTypeId) {
             case 0:
                 LeftReg = builder.LongRegister(this.LeftIdx);
                 RightReg = builder.LongRegister(this.RightIdx);
                 break;
             case 1:
                 LeftReg = builder.DoubleRegister(this.LeftIdx);
                 RightReg = builder.DoubleRegister(this.RightIdx);
                 break;
             case 2:
                 LeftReg = builder.StringRegister(this.LeftIdx);
                 RightReg = builder.StringRegister(this.RightIdx);
                 break;
             default:
                 throw Error("不支持类型：" + this.ArgTypeId);
         }
         builder.LongRegister(this.RetIdx, (st, uf, locals) => {
             return LeftReg(st, uf, locals) >= RightReg(st, uf, locals) ? 1 : 0;
         });
     }
 }
 class DestroyFSM extends OBInstruction {
     link(builder, instructions, idx) {
         builder.PushAction((st, uf, locals, pos) => {
             if (st.fsm.VM.debugger) {
                 st.fsm.VM.debugger.debugEvent('FSM Destroy', VM.stackInfo(st, uf), null, 2)
             }
             st.fsm.Destroy();
             throw new FSMDestroyException();
         });
     }
 }
 class FSMBroadcastMsg extends OBInstruction {
     // TitleIdx;
     // BodyTypeID;
     // BodyRegisterIdx;
 
     init(code, builder, instructions, i) {
         this.sendToSelf = ((code >> 23) & 1);
         this.TitleIdx = ((code >> 10) & 0x3F);
         this.BodyTypeID = ((code >> 6) & 0xF);
         this.BodyRegisterIdx = (code & 0x3F);
     }
 
     link(builder, instructions, idx) {
         let f_title = builder.StringRegister(this.TitleIdx);
         let f_body = this.makeBody(builder);
         builder.PushAction((st, uf, locals, pos) => {
             let title = f_title(st, uf, locals);
             let body = f_body(st, uf, locals);
             st.fsm.VM.BroadcastMessage(new UserMessage(title, Message.ArgTypeOf(this.BodyTypeID, body), body, st.fsm), this.sendToSelf);
             return ++pos;
         });
     }
     /**
          *
          * @param {OBFunctionBuilder} builder
          * @returns
          */
     makeBody(builder) {
         switch (this.BodyTypeID) {
             case 0xF:
                 return (st, uf, locals) => null;
             case 0:
                 var l = builder.LongRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return l(st, uf, locals);
                 };
             case 1:
                 var d = builder.DoubleRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return d(st, uf, locals);
                 };
             case 2:
                 var s = builder.StringRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return s(st, uf, locals);
                 };
             case 3:
                 var s1 = builder.StructRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     let v = s1(st, uf, locals);
                     if (!v) {
                         throw VM.makeError('Read uninitialized field', st, uf, locals);
                     }
                     return v;
                 };
             case 4:
                 var n = builder.NObjectRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return n(st, uf, locals);
                 };
             default:
                 throw Error("Unknown type " + this.BodyTypeID);
         }
     }
 }
 
 /**
  * 单元数操作
  */
 class SGLF extends OBInstruction {
     // Opcode;
     // value;
 
     init(code, builder, instructions, i) {
         this.value = (code & 0xFFFF);
         this.Opcode = (code >> 16) & 0xff;
     }
 
     link(builder, instructions, idx) {
         let value = this.value;
         let f_value = builder.DoubleRegister(this.value);
         if (f_value == null) {
             throw Error("left is null");
         }
         switch (this.Opcode) {
             case 0:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return -f_value(s, f, l);
                 });
                 break;
             case 1:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.log(f_value(s, f, l));
                 });
                 break;
             case 2:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.log10(f_value(s, f, l));
                 });
                 break;
             case 3:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.exp(f_value(s, f, l));
                 });
                 break;
             case 4:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.pow(10, f_value(s, f, l));
                 });
                 break;
             case 5:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.sqrt(f_value(s, f, l));
                 });
                 break;
             case 6:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.abs(f_value(s, f, l));
                 });
                 break;
             case 7:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.sin(f_value(s, f, l));
                 });
                 break;
             case 8:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.cos(f_value(s, f, l));
                 });
                 break;
             case 9:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.tan(f_value(s, f, l));
                 });
                 break;
             case 10:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.asin(f_value(s, f, l));
                 });
                 break;
             case 11:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.acos(f_value(s, f, l));
                 });
                 break;
             case 12:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.atan(f_value(s, f, l));
                 });
                 break;
             case 13:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.round(f_value(s, f, l));
                 });
                 break;
             case 14:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.ceil(f_value(s, f, l));
                 });
                 break;
             case 15:
                 builder.DoubleRegister(value, (s, f, l) => {
                     return Math.floor(f_value(s, f, l));
                 });
                 break;
         }
     }
 }
 class RAND extends OBInstruction {
     // Register;
 
     init(code, builder, instructions, i) {
         this.Register = (code & 0xFFFFFF);
     }
 
     link(builder, instructions, idx) {
         builder.DoubleRegister(this.Register, (st, f, l) => {
             return Math.random();
         });
     }
 }
 class F2I extends OBInstruction {
     // intRegIdx;
     // floatRegIdx;
 
     init(code, builder, instructions, i) {
         this.intRegIdx = ((code) >> 12) & 0xFFF;
         this.floatRegIdx = ((code) & 0xFFF);
     }
 
     link(builder, instructions, idx) {
         let g = builder.DoubleRegister(this.floatRegIdx);
         builder.LongRegister(this.intRegIdx, (st, uf, locals) => {
             return Math.trunc(g(st, uf, locals));
         });
     }
 }
 class FSMSendMsgWait_Data extends OBInstruction {
     // TitleIdx;
     // TargetIdx;
     // BodyTypeID;
     // BodyRegisterIdx;
 
     init(code, builder, instructions, i) {
         this.TargetIdx = ((code >> 17) & 0x7F);
         this.TitleIdx = ((code >> 10) & 0x7F);
         this.BodyTypeID = ((code >> 6) & 0xF);
         this.BodyRegisterIdx = (code & 0x3F);
     }
 }
 class FSMSendMsgWait extends OBInstruction {
     // waitMilliSecondIdx;
 
     init(code, builder, instructions, i) {
         this.waitMilliSecondIdx = ((code >> 17) & 0x3F);
     }
 
     link(builder, instructions, idx) {
         let anchor = instructions[idx - 1];
         if (!(anchor instanceof FSMSendMsgWait_Data)) {
             throw Error("字节码错误");
         }
         let f_title = builder.StringRegister(anchor.TitleIdx);
         let f_body = this.makeBody(builder, anchor.BodyTypeID, anchor.BodyRegisterIdx);
         let waitTime = builder.LongRegister(this.waitMilliSecondIdx);
         let f_fsm = builder.NObjectRegister(anchor.TargetIdx);
         builder.PushAction((st, uf, locals, pos) => {
             let title = f_title(st, uf, locals);
             let body = f_body(st, uf, locals);
             let waitSecond = waitTime(st, uf, locals);
             let FSM = st.fsm;
             let fsm = f_fsm(st, uf, locals);
             if (!fsm) {
                 if (FSM.VM.logLevel <= 3)
                     FSM.VM.Log("未找到发送目标", 'sys', 3);
                 return;
             }
             if (!(fsm instanceof OBVMFSM)) {
                 throw Error("字节码错误");
             }
             fsm.VM.Schedule(waitSecond, (VM) => {
                 fsm.PostMessage(new UserMessage(title, Message.ArgTypeOf(anchor.BodyTypeID, body), body, FSM));
             });
             return ++pos;
         });
     }
 
     makeBody(builder, BodyTypeID, BodyRegisterIdx) {
         switch (BodyTypeID) {
             case 0xF:
                 return (st, uf, locals) => null;
             case 0:
                 var l = builder.LongRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return l(st, uf, locals);
                 };
             case 1:
                 var d = builder.DoubleRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return d(st, uf, locals);
                 };
             case 2:
                 var s = builder.StringRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return s(st, uf, locals);
                 };
             case 3:
                 var s1 = builder.StructRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return s1(st, uf, locals);
                 };
             case 4:
                 var n = builder.NObjectRegister(BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return n(st, uf, locals);
                 };
             default:
                 throw Error("Unknown type " + BodyTypeID);
         }
     }
 }
 class FSMBroadcastMsgWait extends OBInstruction {
     // TitleIdx;
     // BodyTypeID;
     // BodyRegisterIdx;
     // waitMilliSecondIdx;
 
     init(code, builder, instructions, i) {
         this.sendToSelf = ((code >> 23) & 1);
         this.TitleIdx = ((code >> 10) & 0x3F);
         this.BodyTypeID = ((code >> 6) & 0xF);
 
         this.BodyRegisterIdx = (code & 0x3F);
         this.waitMilliSecondIdx = ((code >> 17) & 0x3F);
     }
 
     link(builder, instructions, idx) {
         let f_title = builder.StringRegister(this.TitleIdx);
         let f_body = this.makeBody(builder);
         let waitTime = builder.LongRegister(this.waitMilliSecondIdx);
         builder.PushAction((st, uf, locals, pos) => {
             let title = f_title(st, uf, locals);
             let body = f_body(st, uf, locals);
             let waitSecond = waitTime(st, uf, locals);
             let fsm = st.fsm;
             fsm.VM.Schedule(waitSecond, (VM) => {
                 VM.BroadcastMessage(new UserMessage(title, Message.ArgTypeOf(this.BodyTypeID, body), body, fsm), this.sendToSelf);
             });
             return ++pos;
         });
     }
 
     makeBody(builder) {
         switch (this.BodyTypeID) {
             case 0xF:
                 return (st, uf, locals) => null;
             case 0:
                 var l = builder.LongRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return l(st, uf, locals);
                 };
             case 1:
                 var d = builder.DoubleRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return d(st, uf, locals);
                 };
             case 2:
                 var s = builder.StringRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return s(st, uf, locals);
                 };
             case 3:
                 var s1 = builder.StructRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return s1(st, uf, locals);
                 };
             case 4:
                 var n = builder.NObjectRegister(this.BodyRegisterIdx);
                 return (st, uf, locals) => {
                     return n(st, uf, locals);
                 };
             default:
                 throw Error("Unknown type " + this.BodyTypeID);
         }
     }
 }
 class TextJoin extends OBInstruction {
     // Left;
     // Right;
     // RetReg;
 
     init(code, builder, instructions, i) {
         this.Left = (code >> 17) & 0xFF;
         this.Right = (code >> 9) & 0xff;
         this.RetReg = (code & 0xFF);
     }
 
     link(builder, instructions, idx) {
         var l = builder.StringRegister(this.Left);
         var r = builder.StringRegister(this.Right);
         builder.StringRegister(this.RetReg, (st, f, local) => {
             return l(st, f, local) + r(st, f, local);
         });
     }
 }
 class ToString extends OBInstruction {
     // ValueType;
     // ValueRegIdx;
     // RetRegIdx;
 
     init(code, builder, instructions, i) {
         this.ValueType = (code >> 20) & 0xF;
         this.ValueRegIdx = (code >> 10) & 0x1ff;
         this.RetRegIdx = (code & 0x1FF);
     }
 
     link(builder, instructions, idx) {
         switch (this.ValueType) {
             case 0:
                 var getl = builder.LongRegister(this.ValueRegIdx);
                 builder.StringRegister(this.RetRegIdx, (st, f, l) => {
                     return getl(st, f, l).toString();
                 });
                 break;
             case 1:
                 var getd = builder.DoubleRegister(this.ValueRegIdx);
                 builder.StringRegister(this.RetRegIdx, (st, f, l) => {
                     return getd(st, f, l).toString();
                 });
                 break;
             case 2:
                 var getstr = builder.StringRegister(this.ValueRegIdx);
                 builder.StringRegister(this.RetRegIdx, (st, f, l) => {
                     var v = getstr(st, f, l);
                     if (v == null) {
                         return "";
                     }
                     return v;
                 });
                 break;
             case 3:
                 var getstruct = builder.StructRegister(this.ValueRegIdx);
                 builder.StringRegister(this.RetRegIdx, (st, f, l) => {
                     var v = getstruct(st, f, l);
                     if (v == null) {
                         throw VM.makeError('Read uninitialized field', st, uf, l);
                     }
                     return v.toString();
                 });
                 break;
             case 4:
                 var geto = builder.NObjectRegister(this.ValueRegIdx);
                 builder.StringRegister(this.RetRegIdx, (st, f, l) => {
                     var v = geto(st, f, l);
                     if (v == null) {
                         return "";
                     }
                     return v.toString();
                 });
                 break;
             default:
                 throw Error("Unknown type:" + this.ValueType);
         }
     }
 }
 class Sender extends OBInstruction {
     // RetReg;
 
     init(code, builder, instructions, i) {
         this.RetReg = code & 0xFFFF;
     }
 
     link(builder, instructions, idx) {
         builder.NObjectRegister(this.RetReg, (st, f, local) => {
             return st.CurrentMessageSender();
         });
     }
 }
 class SHL extends OBInstruction {
     // value; bitCount;
     init(code, builder, instructions, i) {
         this.bitCount = code & 0xFFF;
         this.value = (code & 0xFFF000) >> 12;
     }
     link(builder, instructions, idx) {
         let getV = builder.LongRegister(this.value);
         let getC = builder.LongRegister(this.bitCount);
         builder.LongRegister(this.value, (st, f, l) => {
             let v = getV(st, f, l);
             let c = getC(st, f, l);
             if (c > 0) {
                 let r = v << c;
                 return r;
             } else {
                 let r = v >> -c;
                 return r;
             }
 
         });
     }
 }
 class AND extends OBInstruction {
     // a; b;
     init(code, builder, instructions, i) {
         this.b = code & 0xFFF;
         this.a = (code & 0xFFF000) >> 12;
     }
     link(builder, instructions, idx) {
         let getV = builder.LongRegister(this.a);
         let getC = builder.LongRegister(this.b);
         builder.LongRegister(this.a, (st, f, l) => {
             let v = getV(st, f, l);
             let c = getC(st, f, l);
             let r = v & c;
             return r;
         });
     }
 }
 class FIX extends OBInstruction {
     // regType; regIdx;
     init(code, builder, instructions, i) {
         this.regIdx = code & 0xFFFFF;
         this.regType = (code & 0xF00000) >> 20;
     }
     link(builder, instructions, idx) {
         let v;
         let loaded = false;
         let type;
         switch (this.regType) {
             case 0:
                 type = 'LongRegister';
                 break;
             case 1:
                 type = 'DoubleRegister';
                 break;
             case 2:
                 type = 'StringRegister';
                 break;
             case 3:
                 type = 'StructRegister';
                 break;
             case 4:
                 type = 'NObjectRegister';
                 break;
             default:
                 throw Error("Unknown type:" + this.regType);
         }
         let getV = builder[type](this.regIdx);
         builder[type](this.regIdx, (st, f, l) => {
             if (!loaded) {
                 v = getV(st, f, l);
             } else {
                 loaded = true;
             }
             return v;
         });
     }
 }
 /**
  * value of map by key
  */
 class VOM extends OBInstruction {
     // map;
     // key;
     // ValueType;
     // RetRegIdx;
     init(code, builder, instructions, i) {
         this.ValueType = code & 0x3F;
         this.RetRegIdx = (code & (0x3f << 6)) >> 6;
         this.key = (code & (0x3f << 12)) >> 12;
         this.map = (code & (0x3f << 18)) >> 18;
     }
 
     link(builder, instructions, idx) {
         var getMap = builder.StructRegister(this.map);
         var getKey = builder.StringRegister(this.key);
         let arr = this.getRegisterByRegTypeId(this.ValueType, builder);
         arr.call(builder, this.RetRegIdx, (st, f, l) => {
             let m = getMap(st, f, l);
             let k = getKey(st, f, l);
             let v = m.c.get(k);
             return v;
         });
     }
 }
 /**
  * value at
  */
 class VAT extends OBInstruction {
     init(code, builder, instructions, i) {
         this.ValueType = code & 0x3F;
         this.RetRegIdx = (code & (0x3f << 6)) >> 6;
         this.idx = (code & (0x3f << 12)) >> 12;
         this.list = (code & (0x3f << 18)) >> 18;
     }
 
     link(builder, instructions, idx) {
         var f_list = builder.StructRegister(this.list);
         var f_indx = builder.LongRegister(this.idx);
         let arr = this.getRegisterByRegTypeId(this.ValueType, builder);
         arr.call(builder, this.RetRegIdx, (st, f, l) => {
             let m = f_list(st, f, l);
             let k = f_indx(st, f, l);
             let v = m.c[k];
             if (typeof (v) === 'undefined') {
                 console.error('Read non-existent key:' + k);
                 throw VM.makeError('Read non-existent key', st, f, l);
             }
             return v;
         });
     }
 }
 class VOIM extends OBInstruction {
     // map;
     // key;
     // ValueType;
     // RetRegIdx;
     init(code, builder, instructions, i) {
         this.ValueType = code & 0x3F;
         this.RetRegIdx = (code & (0x3f << 6)) >> 6;
         this.key = (code & (0x3f << 12)) >> 12;
         this.map = (code & (0x3f << 18)) >> 18;
     }
 
     link(builder, instructions, idx) {
         var getMap = builder.StructRegister(this.map);
         var getKey = builder.LongRegister(this.key);
         let arr = this.getRegisterByRegTypeId(this.ValueType, builder);
         arr.call(builder, this.RetRegIdx, (st, f, l) => {
             let m = getMap(st, f, l);
             let k = getKey(st, f, l);
             let v = m.c.get(k);
             if (typeof (v) === 'undefined') {
                 console.error('Read non-existent key:' + k);
                 throw VM.makeError('Read non-existent key', st, f, l);
             }
             return v;
         });
     }
 }
 class LAND extends OBInstruction {
     // a; b;
     init(code, builder, instructions, i) {
         this.b = code & 0xFFF;
         this.a = (code & 0xFFF000) >> 12;
     }
     link(builder, instructions, idx) {
         let getV = builder.LongRegister(this.a);
         let getC = builder.LongRegister(this.b);
         builder.LongRegister(this.a, (st, f, l) => {
             let v = getV(st, f, l);
             if (v) {
                 let c = getC(st, f, l);
                 return c ? 1 : 0;
             } else {
                 return 0;
             }
         });
     }
 }
 class LOR extends OBInstruction {
     // a; b;
     init(code, builder, instructions, i) {
         this.b = code & 0xFFF;
         this.a = (code & 0xFFF000) >> 12;
     }
     link(builder, instructions, idx) {
         let getV = builder.LongRegister(this.a);
         let getC = builder.LongRegister(this.b);
         builder.LongRegister(this.a, (st, f, l) => {
             let v = getV(st, f, l);
             if (v) {
                 return 1;
             } else {
                 let c = getC(st, f, l);
                 return c ? 1 : 0;
             }
         });
     }
 }
 class LNOT extends OBInstruction {
     // a;
     init(code, builder, instructions, i) {
         this.a = code & 0xFFF;
     }
     link(builder, instructions, idx) {
         let getV = builder.LongRegister(this.a);
         builder.LongRegister(this.a, (st, f, l) => {
             let v = getV(st, f, l);
             return v === 0 ? 1 : 0;
         });
     }
 }
 class COND extends OBInstruction {
     // if_; then_; else_; regType;
     init(code, builder, instructions, i) {
         this.regType = code & 0x3F;
         this.else_ = (code & (0x3f << 6)) >> 6;
         this.then_ = (code & (0x3f << 12)) >> 12;
         this.if_ = (code & (0x3f << 18)) >> 18;
     }
     link(builder, instructions, idx) {
         let if_ = builder.LongRegister(this.if_);
         let else_;
         let then_;
         let type;
         switch (this.regType) {
             case 0:
                 type = 'LongRegister';
                 break;
             case 1:
                 type = 'DoubleRegister';
                 break;
             case 2:
                 type = 'StringRegister';
                 break;
             case 3:
                 type = 'StructRegister';
                 break;
             case 4:
                 type = 'NObjectRegister';
                 break;
             default:
                 throw Error("Unknown type:" + this.regType);
         }
         else_ = builder[type](this.else_);
         then_ = builder[type](this.then_);
         builder[type](this.then_, (st, f, l) => {
             let if_v = if_(st, f, l);
             if (if_v != 0) {
                 return then_(st, f, l);
             }
             return else_(st, f, l);
         });
     }
 }
 class NEW extends OBInstruction {
     // StructDef;
     // Register;
 
     init(code, builder, instructions, i) {
         let stridx = code & 0x3FFFF;
         this.Register = (code >> 18) & 0x3F;
 
         let structType = builder.loader.data.GetString(stridx);
         let structDef = builder.loader.script.StructDef[structType];
         if (!structDef) {
             throw Error('不存在数据结构 ' + structType);
         }
         this.StructDef = structDef;
     }
 
     link(builder, instructions, idx) {
         builder.StructRegister(this.Register, this.getValue.bind(this));
     }
 
     getValue(UBState, obvmfunction, TypedRegisters) {
         let s = new OBStructValue(this.StructDef);
         return s;
     }
 }
 
 /**
  * size of map by key
  */
 class SOM extends OBInstruction {
     init(code, builder, instructions, i) {
         this.ret = code & 0xFFF;
         this.r_map = (code & 0xFF0000) >> 16;
     }
 
     link(builder, instructions, idx) {
         var f_map = builder.StructRegister(this.r_map);
         builder.LongRegister(this.ret, (st, f, l) => {
             let map = f_map(st, f, l);
             if (map) {
                 return map.size();
             } else {
                 return 0;
             }
         });
     }
 }
 class CSTR extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.maxi = code & 0x3f;
         this.mini = (code >> 6) & 0x3f;
         this.valuei = (code >> 12) & 0x3f;
         this.reti = (code >> 18) & 0x3f;
     }
 
     link(builder, instructions, idx) {
         let maxr = builder.DoubleRegister(this.maxi);
         let minr = builder.DoubleRegister(this.mini);
         let valuer = builder.DoubleRegister(this.valuei);
         builder.DoubleRegister(this.reti, (st, f, l) => {
             let v = valuer(st, f, l);
             let max = maxr(st, f, l);
             let min = minr(st, f, l);
             return Math.min(Math.max(v, min), max);
         });
     }
 
 }
 class OBList {
     constructor(l) {
         this.c = l || [];
         this.readOnly = false;
     }
     deepClone(readOnly, circleDetection) {
         if (circleDetection.indexOf(this) >= 0) {
             throw Error('循环引用');
         }
         circleDetection.push(this);
         let n = new OBList();
         this.c.forEach((v, i) => {
             if (v instanceof OBStructValue) {
                 n.c[i] = v.deepClone(readOnly, circleDetection);
             } else {
                 n.c[i] = v;
             }
         });
         n.readOnly = readOnly;
         return n;
     }
     size() {
         return this.c.length;
     }
     toArray() {
         return Array.from(this.c);
     }
     static fromArray(arr) {
         let l = new OBList();
         l.c = Array.from(arr);
         return l;
     }
 }
 class OBSMap {
     constructor(map) {
         this.c = map || new Map();
         this.readOnly = false;
     }
     deepClone(readOnly, circleDetection) {
         if (circleDetection.indexOf(this) >= 0) {
             throw Error('循环引用');
         }
         circleDetection.push(this);
         let n = new OBSMap();
         Object.keys(this.c).forEach((i) => {
             let v = this.c.get(i);
             if (v instanceof OBStructValue) {
                 n.c.set(i, v.deepClone(readOnly, circleDetection));
             } else {
                 n.c.set(i, v);
             }
         });
         n.readOnly = readOnly;
         return n;
     }
     size() {
         return this.c.size;
     }
 }
 class OBIMap {
     constructor(map) {
         this.c = map || new Map();
         this.readOnly = false;
     }
     deepClone(readOnly, circleDetection) {
         if (circleDetection.indexOf(this) >= 0) {
             throw Error('循环引用');
         }
         circleDetection.push(this);
         let n = new OBSMap();
         Object.keys(this.c).forEach((i) => {
             let v = this.c.get(i);
             if (v instanceof OBStructValue) {
                 n.c.set(i, v.deepClone(readOnly, circleDetection));
             } else {
                 n.c.set(i, v);
             }
         });
         n.readOnly = readOnly;
         return n;
     }
     size() {
         return this.c.size;
     }
 }
 class LIST extends OBInstruction {
     init(code, builder, instructions, i) {
         this.typeIdx = code & 0xffff;
         this.reti = (code >> 16) & 0x7f;
     }
 
     link(builder, instructions, idx) {
         builder.StructRegister(this.reti, (st, f, l) => {
             return new OBList();
         });
     }
 }
 class SMAP extends OBInstruction {
     init(code, builder, instructions, i) {
         this.typeIdx = code & 0xffff;
         this.reti = (code >> 16) & 0x7f;
     }
 
     link(builder, instructions, idx) {
         builder.StructRegister(this.reti, (st, f, l) => {
             return new OBSMap();
         });
     }
 }
 class IMAP extends OBInstruction {
     init(code, builder, instructions, i) {
         this.typeIdx = code & 0xffff;
         this.reti = (code >> 16) & 0x7f;
     }
 
     link(builder, instructions, idx) {
         builder.StructRegister(this.reti, (st, f, l) => {
             return new OBIMap();
         });
     }
 }
 
 class STKV extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.valueRegType = code & 0x3F;
         this.r_value = (code & (0x3f << 6)) >> 6;
         this.r_key = (code & (0x3f << 12)) >> 12;
         this.r_map = (code & (0x3f << 18)) >> 18;
     }
 
     link(builder, instructions, idx) {
         let f_key = builder.StringRegister(this.r_key);
         let f_map = builder.StructRegister(this.r_map);
         let regArr = this.getRegisterByRegTypeId(this.valueRegType, builder);
         let f_value = regArr.call(builder, this.r_value);
         builder.PushAction((st, uf, locals, pos) => {
             let map = f_map(st, uf, locals);
             if (!map) {
                 return ++pos;
             }
             if (map.readOnly) {
                 throw VM.makeError('read only struct', st, uf, locals);
             }
             let key = f_key(st, uf, locals);
             if (typeof (key) !== "string") {
                 return ++pos;
             }
             let value = f_value(st, uf, locals);
             map.c.set(key, value);
             return ++pos;
         });
     }
 }
 class SVAT extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.valueRegType = code & 0x3F;
         this.r_value = (code & (0x3f << 6)) >> 6;
         this.r_idx = (code & (0x3f << 12)) >> 12;
         this.r_list = (code & (0x3f << 18)) >> 18;
     }
 
     link(builder, instructions, idx) {
         let f_key = builder.LongRegister(this.r_idx);
         let f_map = builder.StructRegister(this.r_list);
         let regArr = this.getRegisterByRegTypeId(this.valueRegType, builder);
         let f_value = regArr.call(builder, this.r_value);
         builder.PushAction((st, uf, locals, pos) => {
             let map = f_map(st, uf, locals);
             if (!map) {
                 return ++pos;
             }
             if (map.readOnly) {
                 throw VM.makeError('read only struct', st, uf, locals);
             }
             let key = f_key(st, uf, locals);
             if (typeof (key) !== "number") {
                 return ++pos;
             }
             let value = f_value(st, uf, locals);
             map.c[key] = value;
             return ++pos;
         });
     }
 }
 class IVAT extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.valueRegType = code & 0x3F;
         this.r_value = (code & (0x3f << 6)) >> 6;
         this.r_idx = (code & (0x3f << 12)) >> 12;
         this.r_list = (code & (0x3f << 18)) >> 18;
     }
 
     link(builder, instructions, idx) {
         let f_key = builder.LongRegister(this.r_idx);
         let f_map = builder.StructRegister(this.r_list);
         let regArr = this.getRegisterByRegTypeId(this.valueRegType, builder);
         let f_value = regArr.call(builder, this.r_value);
         builder.PushAction((st, uf, locals, pos) => {
             let map = f_map(st, uf, locals);
             if (!map) {
                 return ++pos;
             }
             if (map.readOnly) {
                 throw VM.makeError('read only struct', st, uf, locals);
             }
             let key = f_key(st, uf, locals);
             if (typeof (key) !== "number") {
                 return ++pos;
             }
             let value = f_value(st, uf, locals);
             map.c.splice(key, 0, value)
             return ++pos;
         });
     }
 }
 class STIKV extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.valueRegType = code & 0x3F;
         this.r_value = (code & (0x3f << 6)) >> 6;
         this.r_key = (code & (0x3f << 12)) >> 12;
         this.r_map = (code & (0x3f << 18)) >> 18;
     }
 
     link(builder, instructions, idx) {
         let f_key = builder.LongRegister(this.r_key);
         let f_map = builder.StructRegister(this.r_map);
         let regArr = this.getRegisterByRegTypeId(this.valueRegType, builder);
         let f_value = regArr.call(builder, this.r_value);
         builder.PushAction((st, uf, locals, pos) => {
             let map = f_map(st, uf, locals);
             if (!map) {
                 return ++pos;
             }
             if (map.readOnly) {
                 throw VM.makeError('read only struct', st, uf, locals);
             }
             let key = f_key(st, uf, locals);
             let value = f_value(st, uf, locals);
             map.c.set(key, value);
             return ++pos;
         });
     }
 }
 
 class RKOM extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.r_key = code & 0xFFFF;
         this.r_map = (code & 0xFF0000) >> 16;
     }
 
     link(builder, instructions, idx) {
         let f_key = builder.StringRegister(this.r_key);
         let f_map = builder.StructRegister(this.r_map);
         builder.PushAction((st, uf, locals, pos) => {
             let map = f_map(st, uf, locals);
             if (!map) {
                 return ++pos;
             }
             if (map.readOnly) {
                 throw VM.makeError('read only struct', st, uf, locals);
             }
             let key = f_key(st, uf, locals);
             map.c.delete(key);
             return ++pos;
         });
     }
 }
 
 class RKOIM extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.r_key = code & 0xFFFF;
         this.r_map = (code & 0xFF0000) >> 16;
     }
 
     link(builder, instructions, idx) {
         let f_key = builder.LongRegister(this.r_key);
         let f_map = builder.StructRegister(this.r_map);
         builder.PushAction((st, uf, locals, pos) => {
             let map = f_map(st, uf, locals);
             if (!map) {
                 return ++pos;
             }
             if (map.readOnly) {
                 throw VM.makeError('read only struct', st, uf, locals);
             }
             let key = f_key(st, uf, locals);
             map.c.delete(key);
             return ++pos;
         });
     }
 }
 class RVAT extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.r_key = code & 0xFFFF;
         this.r_arr = (code & 0xFF0000) >> 16;
     }
 
     link(builder, instructions, idx) {
         let f_key = builder.LongRegister(this.r_key);
         let f_arr = builder.StructRegister(this.r_arr);
         builder.PushAction((st, uf, locals, pos) => {
             /**
              * @type {Array}
              */
             let arr = f_arr(st, uf, locals);
             if (!arr) {
                 return ++pos;
             }
             if (arr.readOnly) {
                 throw VM.makeError('read only struct', st, uf, locals);
             }
             let key = f_key(st, uf, locals);
             arr.c.splice(key, 1);
             return ++pos;
         });
     }
 }
 class VAD extends OBInstruction {
 
     init(code, builder, instructions, i) {
         this.retReg = (code & 0x3FF);
         this.valueReg = (code >> 10) & 0x3FF;
         this.valueRegType = (code >> 20) & 0xf;
     }
 
     link(builder, instructions, idx) {
         let valueRegGroup = this.getRegisterByRegTypeId(this.valueRegType, builder);
         let valueReg = valueRegGroup.call(builder, this.valueReg);
         builder.LongRegister(this.retReg, (st, uf, locals) => {
             let v = valueReg(st, uf, locals);
             return !!v;
         });
     }
 }
 class SME extends OBInstruction {
     init(code, builder, instructions, i) {
         this.RetRegIdx = code & 0xFF;
         this.key = (code & (0xFf << 8)) >> 8;
         this.map = (code & (0xFf << 16)) >> 16;
     }
     link(builder, instructions, idx) {
         var getMap = builder.StructRegister(this.map);
         var getKey = builder.StringRegister(this.key);
 
         builder.LongRegister(this.RetRegIdx, (st, f, l) => {
             let m = getMap(st, f, l);
             let k = getKey(st, f, l);
             let v = m.c.get(k);
             return !!v;
         });
     }
 }
 class IME extends OBInstruction {
     init(code, builder, instructions, i) {
         this.RetRegIdx = code & 0xFF;
         this.key = (code & (0xFf << 8)) >> 8;
         this.map = (code & (0xFf << 16)) >> 16;
     }
     link(builder, instructions, idx) {
         var getMap = builder.StructRegister(this.map);
         var getKey = builder.LongRegister(this.key);
 
         builder.LongRegister(this.RetRegIdx, (st, f, l) => {
             let m = getMap(st, f, l);
             let k = getKey(st, f, l);
             let v = m.c.get(k);
             return !!v;
         });
     }
 }
 class IMA extends OBInstruction {
     init(code, builder, instructions, i) {
         this.RetRegIdx = code & 0xFFF;
         this.map = (code & (0xFFf << 12)) >> 12;
     }
     link(builder, instructions, idx) {
         var getMap = builder.StructRegister(this.map);
 
         builder.StructRegister(this.RetRegIdx, (st, f, l) => {
             let m = getMap(st, f, l);
             let keys = [];
             m.c.forEach((v, k) => {
                 keys.push(k);
             });
             return new OBList(keys);
         });
     }
 }
 class SMA extends OBInstruction {
     init(code, builder, instructions, i) {
         this.RetRegIdx = code & 0xFFF;
         this.map = (code & (0xFFf << 12)) >> 12;
     }
     link(builder, instructions, idx) {
         var getMap = builder.StructRegister(this.map);
 
         builder.StructRegister(this.RetRegIdx, (st, f, l) => {
             let m = getMap(st, f, l);
             let keys = [];
             m.c.forEach((v, k) => {
                 keys.push(k);
             });
             return new OBList(keys);
         });
     }
 }
 class CLONE extends OBInstruction {
     init(code, builder, instructions, i) {
         this.RetRegIdx = code & 0x3FF;
         this.dataIdx = (code >> 10) & 0x3FF;
         this.type = (code >> 20) & 0xF;
     }
     link(builder, instruction, idx) {
         let valueRegGroup = this.getRegisterByRegTypeId(this.type, builder);
         let from = valueRegGroup.call(builder, this.dataIdx);
         valueRegGroup.call(builder, this.RetRegIdx, (st, f, l) => {
             let v = from(st, f, l);
             if (v instanceof OBStructValue) {
                 let n = v.deepClone(false, []);
                 return n;
             } else {
                 return v;
             }
         });
     }
 }
 // module.exports = {
 //     ScriptLoader,
 //     VM
 // }
 export {
     ScriptLoader,
     VM,
     EventMessage,
     Message,
     UserMessage,
     VMPausedException,
     OBList
 }
 