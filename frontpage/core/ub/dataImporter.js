/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 *  结构体数据描述，不属于语法的一部分，用于静态数据
 */
 class DataReorganizingContext {
    compiled = {};
    structAST = {};
}
Serializable(DataReorganizingContext);
class DataValue {
    constructor(structdef) {
        this.registers.float.length = structdef.registers.float.length;
        this.registers.integer.length = structdef.registers.integer.length;
        this.registers.string.length = structdef.registers.string.length;
        this.registers.object.length = structdef.registers.object.length;
    }
    registers = {
        float: [],
        integer: [],
        string: [],
        object: []
    }
    row;
}
Serializable(DataValue);
class ExcelImporter {
    dataImporter;
    checkFilesTimeout = 0;
    constructor(dataImporter) {
        this.dataImporter = dataImporter;
        VFS.partition.data = new VFS(new VFSMemoryCache());
        VFS.partition.data.on('changed', this.onFileChange.bind(this));
    }
    onFileChange(e) {
        if (this.checkFilesTimeout == 0) {
            this.checkFilesTimeout = setTimeout(() => {
                this.reimportAll();
            }, 500);
        }
    }
    reimportAll() {
        VFS.partition.data.allFiles((all) => {
            this.dataImporter.cleanData();
            this.import(all);
            this.checkFilesTimeout = 0;
            OpenBlock.DataImporter.reorganizeData();
        });
    }
    /**
     * 
     * @param {{name:String,content:ArrayBuffer}[]} arrayBufferPair 
     */
    import(arrayBufferPair) {
        arrayBufferPair.forEach(nameContentPair => {
            if (!nameContentPair.name) {
                throw Error('参数格式错误');
            }
            if (!nameContentPair.content) {
                throw Error('参数格式错误');
            }

            var data = new Uint8Array(nameContentPair.content);
            var workbook = XLSX.read(data, { type: 'array' });

            workbook.SheetNames.forEach(
                name => {
                    let sheet = workbook.Sheets[name];
                    let data = XLSX.utils.sheet_to_json(sheet);
                    this.dataImporter.rawData[name] = data;
                }
            );
            // this.loadedFiles[nameContentPair.name] = nameContentPair.content;
            // this.loadedExcels.push(nameContentPair);
        });
    }
}
class DataImporter {
    /**
     * 已经根据AST转换成structData
     */
    dataReorganizingContext = new DataReorganizingContext();
    /**
     * 从文件解析出的原始数据内容，包含附加信息，如 Excel表格中多余的列
     */
    rawData = {};
    excel;
    constructor() {
        this.excel = new ExcelImporter(this);
    }
    reorganizeData() {
        this.updateStructAST();
        this.reorganizeDataToStruct();
    }
    reorganizeDataToStruct() {
        for (let typename in this.rawData) {
            let structDef = this.dataReorganizingContext.structAST[typename];
            if (!structDef) {
                continue;
            }
            let compiled = this.reorganizeTableToStruct(structDef, this.rawData[typename]);
            this.dataReorganizingContext.compiled[typename] = compiled;
        }
        for (let name in this.dataReorganizingContext.compiled) {
            let structDef = this.dataReorganizingContext.structAST[name];
            let datas = this.dataReorganizingContext.compiled[name];
            this.updateObjectField(structDef, datas);
        }
    }
    updateStructAST() {
        this.dataReorganizingContext = new DataReorganizingContext();
        let structAST = {};
        function addStruct(libs) {
            libs.forEach(lib => {
                if (!lib.__analyzed) {
                    return;
                }
                lib.__analyzed.structs.forEach(st => {
                    let name = st.fullname;
                    if (structAST[name]) {
                        throw Error('重复的数据结构名称 ' + name);
                    }
                    structAST[name] = st;
                });
            });
        }
        addStruct(OpenBlock.BlocklyParser.loadedFiles.srcs);
        addStruct(OpenBlock.BlocklyParser.loadedFiles.libs);
        this.dataReorganizingContext.structAST = structAST;
    }
    cleanData() {
        this.rawData = {};
        this.dataReorganizingContext = new DataReorganizingContext();
    }
    reorganizeTableToStruct(structDef, rawtable) {
        let datas = {};
        if (!structDef) {
            return;
        }
        rawtable.forEach(rawdata => {
            let data = new DataValue(structDef);
            let id;
            structDef.registers.integer.forEach(v => {
                let raw = rawdata[v.name];
                let value = parseInt(raw);
                data.registers.integer[v.registerIndex] = parseInt(value);
                if (v.name === 'id') {
                    id = value;
                }
            });
            if (typeof (id) === 'number') {
                datas[id] = data;
            } else {
                throw Error('no id for struct type ' + structDef);
            }
            structDef.registers.float.forEach(v => {
                let raw = rawdata[v.name];
                data.registers.float[v.registerIndex] = parseFloat(raw);
            });
            structDef.registers.string.forEach(v => {
                let raw = rawdata[v.name];
                data.registers.string[v.registerIndex] = String(raw);
            });
        });
        return datas;
    }
    updateObjectField(structDef, datas) {
        Object.values(datas).forEach(data => {
            structDef.registers.object.forEach(f => {
                let value = f.reorganizeStructData(this.dataReorganizingContext, structDef);
                data.registers.object[f.registerIndex] = value;
            });
            data.registers.object.forEach(field => {
                field(data);
            });
        });
    }
};

StructField.prototype.reorganizeStructData = function (ctx, struct) {
    let v = this.type.reorganizeStructData(ctx, struct, this);
    return (data) => {
        data.registers.object[this.registerIndex] = v(data)
    };
};
StructFieldTypeStruct.prototype.reorganizeStructData = function (ctx, struct, field) {
    let v = field;
    let c = findColIdx(sheet, v.name);
    if (c < 0) {
        throw Error('找不到数据列：' + v.name);
    }
    return (data) => {
        let r = data.row;
        let cname = XLSX.utils.encode_cell({ c, r });
        let cell = sheet[cname];

        let id;
        if (cell.t === 's') {
            let iid = parseInt(cell.v);
            let sid = String(iid);
            if (sid !== cell.v) {
                // 不是整数形式的不处理
                throw Error(struct.fullname + " " + v.name + '不是整数');
            }
            id = iid;
        } else if (cell.t === 'n') {
            let iid = parseInt(cell.v);
            if (iid != cell.v) {
                // 不是整数形式的不处理
                throw Error(struct.fullname + " " + v.name + '不是整数');
            }
            id = iid;
        } else {
            // 不是数字或者字符串类型
            throw Error(struct.fullname + " " + v.name + '不是整数');
        }
        let t = ctx.compiled[this.name];
        if (!t) {
            throw Error(struct.fullname + '未找到表格 ' + this.name + "(1)");
        }
        return t[id];
    };
};
StructFieldTypeList.prototype.reorganizeStructData = function (ctx, struct, field) {
    let ast = ctx.structAST[this.elementType.name];
    let colIndex = -1;
    for (let i = 0; i < ast.registers.integer.length; i++) {
        let f = ast.registers.integer[i];
        if (f.name === struct.fullname) {
            colIndex = i;
            break;
        }
    }
    if (colIndex < 0) {
        throw Error(this.elementType.name + ' 表中未找到 ' + struct.fullname + ' 列');
    }
    return (data) => {
        let t = ctx.compiled[this.elementType.name];
        let ret = [];
        Object.values(t).forEach(v => {
            let id = data.registers.integer[0];
            if (v.registers.integer[colIndex] === id) {
                ret.push(v);
            }
        });
        return ret;
    }
};
StructFieldTypeIntegerMap.prototype.reorganizeStructData = function (ctx, struct, field) {
    let ast = ctx.structAST[this.elementType.name];
    let colIndex = -1;
    for (let i = 0; i < ast.registers.integer.length; i++) {
        let f = ast.registers.integer[i];
        if (f.name === struct.fullname) {
            colIndex = i;
            break;
        }
    }
    if (colIndex < 0) {
        throw Error(this.elementType.name + ' 表中未找到 ' + struct.fullname + ' 列');
    }

    let valueColIndex = -1;
    for (let i = 0; i < ast.registers.integer.length; i++) {
        let f = ast.registers.integer[i];
        if (f.name === field.name) {
            valueColIndex = i;
            break;
        }
    }
    if (valueColIndex < 0) {
        throw Error(this.elementType.name + ' 表中未找到 ' + field.name + ' 列');
    }

    return (data) => {
        let t = ctx.compiled[this.elementType.name];
        let ret = {};
        Object.values(t).forEach(v => {
            let id = data.registers.integer[0];
            if (v.registers.integer[colIndex] === id) {
                ret[v.registers.integer[valueColIndex]] = v;
            }
        });
        return ret;
    }
};

StructFieldTypeStringMap.prototype.reorganizeStructData = function (ctx, struct, field) {
    switch (this.elementType.name) {
        case 'integer':
        case 'float':
        case 'string':
            let sheetName = struct.fullname + "." + field.name;
            let sheet = book.Sheets[sheetName];
            if (!sheet) {
                throw Error(struct.fullname + '未找到表格 ' + sheetName + "(2)");
            }
            let c = findColIdx(sheet, field.name);
            if (c < 0) {
                throw Error(sheetName + ' 表中找不到数据列：' + field.name);
            }
            let range = XLSX.utils.decode_range(sheet['!ref']);
            let endRow = range.e.r;
            throw Error('功能未完成');
            // TODO
            return (data) => {
                let row = 0;
                XLSX.utils.encode_cell({ c: 1, r: row });
            };
    }
    let ast = ctx.structAST[this.elementType.name];
    let colIndex = -1;
    for (let i = 0; i < ast.registers.integer.length; i++) {
        let f = ast.registers.integer[i];
        if (f.name === struct.fullname) {
            colIndex = i;
            break;
        }
    }
    if (colIndex < 0) {
        throw Error(this.elementType.name + ' 表中未找到 ' + struct.fullname + ' 列');
    }

    let valueColIndex = -1;
    for (let i = 0; i < ast.registers.string.length; i++) {
        let f = ast.registers.string[i];
        if (f.name === field.name) {
            valueColIndex = i;
            break;
        }
    }
    if (valueColIndex < 0) {
        throw Error(this.elementType.name + ' 表中未找到 ' + field.name + ' 列');
    }

    return (data) => {
        let t = ctx.compiled[this.elementType.name];
        let ret = {};
        Object.values(t).forEach(v => {
            let id = data.registers.integer[0];
            if (v.registers.integer[colIndex] === id) {
                ret[v.registers.string[valueColIndex]] = v;
            }
        });
        return ret;
    }
};

/**
 * @type DataImporter
 */
OpenBlock.DataImporter = new DataImporter();