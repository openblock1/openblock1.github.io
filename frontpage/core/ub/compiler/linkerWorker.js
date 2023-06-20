/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

class LinkContext {
    compiledLibs;
    relocation = {
        string: {},
        integer: {},
        float: {},
        bin: [],
        structFieldIndex: {}
    };
    structBin = [];
    structDefBin = [];
    structData = {};
    exported = { fsms: {}, functions: {} };
    nativeFuncMap = {};
    constructor(compiledLibs, data, nativeFuncMap) {
        this.compiledLibs = compiledLibs;
        this.structData = data;
        this.nativeFuncMap = nativeFuncMap;
    }
    addRelocationString(str) {
        if ((typeof str) !== 'string') {
            throw Error('不是字符串');
        }
        if (!this.relocation.string.hasOwnProperty(str)) {
            this.relocation.string[str] = {
                idx: 0,
                inited: false
            }
        }
    }
    collInfo() {
        let self = this;
        this.exported.functions = Object.assign({}, this.nativeFuncMap);
        this.compiledLibs.forEach(lib => {
            for (let k in lib.nativeLibs) {
                let nlib = lib.nativeLibs[k];
                let libname = nlib.libname;
                if (libname != 'buildin') {
                    self.addRelocationString(k);
                    self.addRelocationString(nlib.libhash);
                }
            }
            // 收集导出资源
            function collExports(name) {
                Object.keys(lib.export[name]).forEach(n => {
                    this.exported[name][n] = lib.export[name][n];
                });
            }
            collExports.call(this, 'fsms');
            collExports.call(this, 'functions');
            // 收集重定位资源
            function collRP(type) {
                Object.keys(lib.relocation[type]).forEach(n => {
                    if (!this.relocation[type].hasOwnProperty(n)) {
                        this.relocation[type][n] = {
                            idx: 0,
                            inited: false
                        }
                    }
                });
            }
            collRP.call(this, 'string');
            collRP.call(this, 'integer');
            collRP.call(this, 'float');
            collRP.call(this, 'structFieldIndex');

            lib.relocation['bin'].forEach(binrecord => {
                let linkRecord = this.relocation.bin.find(r => {
                    if (r.value.length !== binrecord.value.length) {
                        return false;
                    }
                    if (binrecord.value === r.value) {
                        return true;
                    }
                    for (let i = 0; i < r.value.length; i++) {
                        if (r.value[i] !== binrecord.value[i]) {
                            return false;
                        }
                    }
                    return true;
                });
                if (!linkRecord) {
                    linkRecord = {
                        value: binrecord.value,
                        inited: false,
                        idx: 0
                    };
                    this.relocation.bin.push(linkRecord);
                }
            });
            Object.keys(lib.export.structs).forEach(stname => {
                this.addRelocationString(stname);
                let st = lib.export.structs[stname];
                st.objectFields.forEach(f => {
                    this.addRelocationString(f);
                });
            });
        });
        let structTypes = Object.keys(this.structData.compiled);
        structTypes.forEach(typeName => {
            let table = this.structData.compiled[typeName];
            Object.values(table).forEach(item => {
                item.registers.string.forEach(str => {
                    this.addRelocationString(str);
                });
                let ast = this.structData.structAST[typeName];
                ast.registers.object.forEach(ofd => {
                    switch (ofd.type.$__type) {
                        case "StructFieldTypeStruct":
                            break;
                        case "StructFieldTypeIntegerMap":
                            switch (ofd.type.elementType.name) {
                                case 'string':
                                case 'String':
                                    Object.values(item.registers.object[ofd.registerIndex]).forEach(str => {
                                        this.addRelocationString(str);
                                    });
                            }
                            break;
                        case "StructFieldTypeStringMap":
                            switch (ofd.type.elementType.name) {
                                case 'string':
                                case 'String':
                                    Object.values(item.registers.object[ofd.registerIndex]).forEach(str => {
                                        this.addRelocationString(str);
                                    });
                            }
                            Object.keys(item.registers.object[ofd.registerIndex]).forEach(str => {
                                this.addRelocationString(str);
                            });
                            break;
                        case "StructFieldTypeList":
                            switch (ofd.type.elementType.name) {
                                case 'string':
                                case 'String':
                                    Object.values(item.registers.object[ofd.registerIndex]).forEach(str => {
                                        this.addRelocationString(str);
                                    });
                            }
                            break;
                        default:
                            console.error(ofd);
                            throw Error("功能未实现 " + ofd.type.$__type);
                    }
                });
            });
        });
    }
    compileRelocationTable() {
        this.relocationTable = [0];
        let pos = 0;
        /**
         * 
         * @param {string} type 
         * @param {function(n):array of uint32} serializer 
         */
        function compileType(type, serializer) {
            Object.keys(this.relocation[type]).forEach(n => {
                let record = this.relocation[type][n];
                let data = serializer(n);

                record.inited = true;
                if (type === 'integer' || type === 'float') {
                    record.idx = pos;
                } else {
                    record.idx = pos / 2;
                    if (record.idx != parseInt(record.idx)) {
                        throw Error('竟然不是整数？');
                    }
                }
                pos += data.length;
                this.relocationTable = this.relocationTable.concat(data);
            });
        }
        // integer和float是4字节的，要先放置。
        compileType.call(this, 'integer', i => {
            return [parseInt(i)];
        });

        let byteUtilArray = new ArrayBuffer(4);
        let view = new DataView(byteUtilArray);
        compileType.call(this, 'float', f => {
            let f1 = parseFloat(f);
            view.setFloat32(0, f1, false);
            return [view.getUint32()];
        });
        // 数字类型尾部对齐8字节
        while (pos % 2 != 0) {
            this.relocationTable.push(0);
            pos++;
        }
        this.relocation.bin.forEach(bin => {
            let arr = bin.value;
            bin.inited = true;
            bin.idx = pos / 2;
            pos += arr.length;
            this.relocationTable = this.relocationTable.concat(arr);
            if (arr.length % 2 != 0) {
                this.relocationTable.push(0);
                pos++;
            }
        });
        // 其他类型要占用 8字节对齐
        let textencoder = new TextEncoder('utf-8');
        compileType.call(this, 'string', s => {
            let enc1 = textencoder.encode(s);
            let arr = Array.from(enc1);
            let length = enc1.length;
            arr.unshift((length & 0xff000000) >> 24);
            arr.unshift((length & 0xff0000)>>16);
            arr.unshift((length & 0xff00)>>8);
            arr.unshift(length & 0xff);
            arr.push(0);
            // 8字节对齐
            while (arr.length % 8 != 0) {
                arr.push(0);
            }
            let u8 = new Uint8Array(arr);
            let u32 = new Uint32Array(u8.buffer);
            let u32a = Array.from(u32);
            return u32a;
        });
        this.relocationTable[0] = this.relocationTable.length - 1;
        // structFieldIndex 类型不需要写入 relocationTable
        // 根据链接数据修改bitcode即可
        Object.keys(this.relocation.structFieldIndex).forEach(stfieldname => {
            let rel = this.relocation.structFieldIndex[stfieldname];
            let sp = stfieldname.lastIndexOf(':');
            let type = stfieldname.substring(0, sp);
            let fieldname = stfieldname.substring(sp + 1);
            let stDef = this.structData.structAST[type];
            if (!stDef) {
                throw Error('结构体不存在' + type);
            }
            for (let i in stDef.fields) {
                let f = stDef.fields[i];
                if (f.name === fieldname) {
                    rel.idx = f.registerIndex;
                    break;
                }
            }
        });
    }
    makeRelocationTable() {
        this.collInfo();
        this.compileRelocationTable();
    }
    updateRelocationIdx() {
        let ctx = this;
        let checker = {
            findedMethods: {},
            searchMethodSignature(s) {
                if (ctx.exported.functions[s]) {
                    return true;
                }
                return false;
            },
            checkMethodSignature(signature) {
                if (this.findedMethods[signature]) {
                    return true;
                } else {
                    if (this.searchMethodSignature(signature)) {
                        this.findedMethods[signature] = true;
                        return true;
                    }
                    return false;
                }
            }
        };
        let libs = this.compiledLibs;
        libs.forEach(lib => {
            let u32 = new Uint32Array(lib.bin);
            function updateIdx(type) {
                Object.keys(lib.relocation[type]).forEach(n => {
                    let arr = lib.relocation[type][n];
                    let record = this.relocation[type][n];
                    arr.forEach(idxInfo => {
                        let programIdx = idxInfo.idx;
                        let programCode = u32[programIdx];
                        let cmd = (programCode >> 24) & 0xFF;
                        let clean = programCode ^ programIdx;
                        let newIdx = record.idx;
                        let newValue = clean | newIdx;
                        if (type === 'string') {
                            if (cmd === 15 || cmd === 32) {
                                if (!checker.checkMethodSignature(n)) {
                                    throw Error('找不到函数:' + n);
                                }
                            } else if (cmd === 59) {
                                // TODO: 验证 数据结构存在
                                let l = libs.find(l => l.export.structs[n]);
                                if (!l) {
                                    throw Error('找不到结构体:' + n);
                                }
                            }
                        }
                        u32[programIdx] = newValue;
                    });
                });
            }
            updateIdx.call(this, 'string');
            updateIdx.call(this, 'integer');
            updateIdx.call(this, 'float');
            updateIdx.call(this, 'structFieldIndex');
            lib.relocation.bin.forEach(b => {
                let record = this.relocation.bin.find(thisb => {
                    if (thisb.value.length !== b.value.length) {
                        return false;
                    }
                    if (thisb.value === b.value) {
                        return true;
                    }
                    for (let i = 0; i < b.value.length; i++) {
                        if (b.value[i] !== thisb.value[i]) {
                            return false;
                        }
                    }
                    return true;
                });
                b.idxList.forEach(idxInfo => {
                    let programIdx = idxInfo.idx;
                    let programCode = u32[programIdx];
                    let clean = programCode ^ programIdx;
                    let newIdx = record.idx;
                    let newValue = clean | newIdx;
                    u32[programIdx] = newValue;
                });
            });
        });
    }
    makeNativeLibDeps() {
        let header32 = [];
        header32.push(0);
        let nativeCnt = 0;
        let self = this;
        this.compiledLibs.forEach(lib => {
            for (let k in lib.nativeLibs) {
                let nlib = lib.nativeLibs[k];
                let libname = nlib.libname;
                let hash = nlib.libhash;
                if (libname != 'buildin') {
                    let nameIdx = self.relocation.string[libname];
                    header32.push(nameIdx.idx);
                    let hashIdx = self.relocation.string[hash];
                    header32.push(hashIdx.idx);
                    nativeCnt++;
                }
            }
        });
        header32[0] = nativeCnt;
        this.nativeLibDeps = header32;;
    }
    makeHeaderBin() {
        let MAG = [0x7f, 0x55, 0x45, 0x58];//'\u007fUEX';
        let version = [1, 0, 0, 0];
        let header = [].concat(MAG, version);
        let header32 = Array.from(new Uint32Array(new Uint8Array(header).buffer));
        let SegmentCnt = this.compiledLibs.length + 4;//   1 relocationTable,package info,1 structdef , 1 struct ,and libs
        header32.push(SegmentCnt);
        let dataPos = 0;
        // 数据段
        let dataSegm = [0, dataPos];// type,offset (type 0:Data,2:structData , type 1:Module) 数据段从0开始
        header32 = header32.concat(dataSegm);
        //
        //描述程序包
        dataPos += this.relocationTable.length;
        let packageInfo = [4, dataPos];
        header32 = header32.concat(packageInfo);
        // let deps = this.makeNativeLibDeps();
        // let packageInfo = [4,0];
        // header32 = header32.concat(packageInfo);
        // header32 = header32.concat(deps);
        // struct结构段
        dataPos += this.nativeLibDeps.length;
        let structDefSegm = [3, dataPos];// 从数据段的结尾开始
        header32 = header32.concat(structDefSegm);
        // struct常量段
        dataPos += this.structDefBin.length;
        let structSegm = [2, dataPos];// 
        header32 = header32.concat(structSegm);
        // 程序段 ，在struct段之后开始
        dataPos += this.structBin.length;
        // let pos = this.relocationTable.length + this.structBin.length + this.structDefBin.length;
        this.compiledLibs.forEach(l => {
            header32 = header32.concat([1, dataPos]);
            dataPos += l.bin.byteLength / 4;
        });
        this.header = header32;
    }
    makeStructDef() {
        this.structDefBin.push(0);// 放入长度占位
        this.structDefBin.push(0);// 放入个数占位
        this.compiledLibs.forEach(lib => {
            Object.keys(lib.export.structs).forEach(name => {
                let structdef = lib.export.structs[name];
                let fullnameIdx = this.relocation.string[name];
                this.structDefBin.push(fullnameIdx.idx);// 存入结构体全名索引
                this.structDefBin.push(
                    (structdef.NobjectCnt << 28)
                    | (structdef.floatCnt << 21)
                    | (structdef.integerCnt << 14)
                    | (structdef.stringCnt << 7)
                    | structdef.objectCnt);
                structdef.objectFields.forEach(f => {
                    let fnameIdx = this.relocation.string[f];
                    this.structDefBin.push(fnameIdx.idx);// 存入结构体全名索引
                });
                this.structDefBin[1]++;
            });
        });
        this.structDefBin[0] = this.structDefBin.length - 1;
    }
    makeStructBin() {
        this.structBin.push(0);// 放入长度占位
        let structData = this.structData;

        let allStruct = [];
        let structGroups = Object.keys(structData.compiled);
        this.structBin.push(structGroups.length);// 写入类型数量
        structGroups.forEach(name => {
            let ast = structData.structAST[name];
            let structGroup = structData.compiled[name];
            let structList = Object.values(structGroup);
            let fullname = ast.fullname;
            let fullnameIdx = this.relocation.string[fullname];
            this.structBin.push(fullnameIdx.idx);// 存入结构体全名索引
            this.structBin.push(structList.length);// 总数
            let groupLengthPos = this.structBin.length;
            this.structBin.push(0);// 单组长度占位符
            structList.forEach(st => {
                allStruct.push(st);
                st.index = this.structBin.length;
                this.structBin.push(0);// 单个结构体长度占位符
                st.registers.integer.forEach(i => {
                    this.structBin.push(i);
                });
                st.registers.string.forEach(s => {
                    let idx = this.relocation.string[s];
                    this.structBin.push(idx.idx);
                });
                let byteUtilArray = new ArrayBuffer(4);
                let view = new DataView(byteUtilArray);
                st.registers.float.forEach(f => {
                    let f1 = parseFloat(f);
                    view.setFloat32(0, f1, false);
                    this.structBin.push(view.getUint32());
                });
                ast.registers.object.forEach(obField => {
                    let type = obField.type.$__type;
                    let regIndex = obField.registerIndex;
                    let fd = st.registers.object[regIndex];
                    let keys = Object.keys(fd);
                    switch (type) {
                        case 'StructFieldTypeIntegerMap':
                            switch (obField.type.elementType.name) {
                                case 'string':
                                case 'String':
                                    throw Error('未实现');
                            }
                            this.structBin.push(keys.length);
                            keys.forEach(k => {
                                this.structBin.push(k);
                                let s = fd[k];
                                this.structBin.push(s);
                            });
                            break;
                        case 'StructFieldTypeStringMap':
                            let eleTypeName = obField.type.elementType.name;
                            switch (obField.type.elementType.name) {
                                case 'string':
                                case 'String':
                                    throw Error('未实现');
                            }
                            this.structBin.push(keys.length);
                            keys.forEach(k => {
                                let idx = this.relocation.string[k];
                                this.structBin.push(idx.idx);
                                let s = fd[k];
                                this.structBin.push(s.registers.integer[0]);
                            });
                            break;
                        case 'StructFieldTypeList':
                            switch (obField.type.elementType.name) {
                                case 'string':
                                case 'String':
                                    throw Error('未实现');
                            }
                            this.structBin.push(keys.length);
                            keys.forEach(k => {
                                let s = fd[k];
                                this.structBin.push(s);
                            });
                            break;
                        case "StructFieldTypeStruct":
                            // 写入目标的ID
                            this.structBin.push(fd.registers.integer[0]);
                            break;
                        default:
                            throw Error('?');
                    }
                    // let elementTypeName = obField.type.elementType ? obField.type.elementType.name:null;
                    // switch(elementTypeName){
                    //     case 'string':
                    //         case 'String':
                    //     Object.values(st.registers.object[regIndex]).forEach
                    // }
                });
                // st.registers.object.forEach(ob => {
                //     let rid = ob.registers.integer[0];
                //     this.structBin.push(rid);
                // });
                this.structBin[st.index] = this.structBin.length - st.index - 1;
            });
            this.structBin[groupLengthPos] = this.structBin.length - groupLengthPos - 1;
        });
        this.structBin[0] = this.structBin.length - 1;// 写入长度(一个单位代表4字节)
    }
    join() {
        let buf = [].concat(this.header, this.relocationTable, this.nativeLibDeps, this.structDefBin, this.structBin);
        this.compiledLibs.forEach(l => {
            let bin = l.bin;
            let u32 = Array.from(new Uint32Array(bin));
            buf = buf.concat(u32);
        });
        return buf;
    }
    link() {
        this.makeRelocationTable();
        this.updateRelocationIdx();
        this.makeStructDef();
        this.makeStructBin();
        this.makeNativeLibDeps();
        this.makeHeaderBin();
        return this.join();
    }
}
self.onmessage = function (msg) {
    let request = msg.data.request;
    let compiledLibs = request.compiledLibs;
    let data = request.data;
    let link = new LinkContext(compiledLibs, data, request.nativeFuncMap);
    let u32 = link.link();
    let buf = new Uint32Array(u32).buffer;
    let m = {
        callbackSN: msg.data.callbackSN,
        data: buf
    }
    self.postMessage(m, [buf]);
};