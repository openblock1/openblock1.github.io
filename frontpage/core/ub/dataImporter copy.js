/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */



(function () {

    // 结构体数据描述，不属于语法的一部分，用于静态数据
    class DataReorganizingContext {
        compiled = {};
        workbooks;
        structAST;
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
    function findColIdx(sheet, name) {
        for (let c = 0; ; c++) {
            let cname = XLSX.utils.encode_cell({ c, r: 0 });
            let cell = sheet[cname];
            if (!cell) {
                return -1;
            }
            if (cell.v === name) {
                return c;
            }
        }
    }
    function reorganize1(struct, book, ctx) {
        let sheet = book.Sheets[struct.fullname];
        let setValueFunc = [];
        struct.registers.integer.forEach(v => {
            let c = findColIdx(sheet, v.name);
            if (c < 0) {
                throw Error(struct.fullname + '找不到数据列：' + v.name);
            }
            setValueFunc.push((r, data) => {
                let cname = XLSX.utils.encode_cell({ c, r });
                let cell = sheet[cname];
                let val;
                if (!cell) {
                    val = 0;
                } else {
                    val = cell.v;
                    val = parseInt(val);
                }
                data.registers.integer[v.registerIndex] = val;
            });
        });
        struct.registers.float.forEach(v => {
            let c = findColIdx(sheet, v.name);
            if (c < 0) {
                throw Error(struct.fullname + '找不到数据列：' + v.name);
            }
            setValueFunc.push((r, data) => {
                let cname = XLSX.utils.encode_cell({ c, r });
                let cell = sheet[cname];
                let val;
                if (!cell) {
                    val = 0;
                } else {
                    val = cell.v;
                    val = parseFloat(val);
                }
                data.registers.float[v.registerIndex] = val;
            });
        });
        struct.registers.string.forEach(v => {
            let c = findColIdx(sheet, v.name);
            if (c < 0) {
                throw Error(struct.fullname + '找不到数据列：' + v.name);
            }
            setValueFunc.push((r, data) => {
                let cname = XLSX.utils.encode_cell({ c, r });
                let cell = sheet[cname];
                let val;
                if (!cell) {
                    val = "";
                } else {
                    val = cell.v;
                    val = String(val);
                }
                data.registers.string[v.registerIndex] = val;
            });
        });
        struct.registers.object.forEach(v => {
            let val = v.reorganize1(ctx, book, sheet, struct);
            setValueFunc.push((r, data) => {
                data.registers.object[v.registerIndex] = val;
            });
            // let c = findColIdx(sheet, v.name);
            // if (c < 0) {
            //     throw Error('找不到数据列：' + v.name);
            // }
            // setValueFunc.push((r, data) => {
            //     let cname = XLSX.utils.encode_cell({ c, r });
            //     let cell = sheet[cname];
            //     let val;
            //     if (!cell) {
            //         val = 0;
            //     } else {
            //         val = cell.v;
            //         val = parseInt(val);
            //     }
            //     data.registers.object[v.registerIndex] = val;
            // });
        });
        // 本地对象不可导入数据包
        // struct.registers.Nobject.forEach(v=>{});
        let datas = {};
        for (let r = 1; ; r++) {
            let c = 0;
            let cname = XLSX.utils.encode_cell({ c, r });
            let cell = sheet[cname];
            if (!cell) {
                // 没有内容就停止
                break;
            }
            let id;
            if (cell.t === 's') {
                let iid = parseInt(cell.v);
                let sid = String(iid);
                if (sid !== cell.v) {
                    // 不是整数形式的不处理
                    continue;
                }
                id = iid;
            } else if (cell.t === 'n') {
                let iid = parseInt(cell.v);
                if (iid != cell.v) {
                    // 不是整数形式的不处理
                    continue;
                }
                id = iid;
            } else {
                // 不是数字或者字符串类型，不处理
                continue;
            }
            let data = new DataValue(struct);
            data.row = r;
            setValueFunc.forEach(f => {
                f(r, data)
            });
            datas[id] = data;
        }
        return datas;
    }
    function reorganize2(ctx, structdef, datas) {
        Object.values(datas).forEach(data => {
            data.registers.object.forEach(field => {
                field(data);
            });
        });
    }
    function reorganize(ctx) {
        ctx.workbooks.forEach(book => {
            book.SheetNames.forEach(
                name => {
                    if (ctx.compiled[name]) {
                        throw Error('重复数据表：' + name);
                    }
                    let struct = ctx.structAST[name];
                    if (struct) {
                        let c = reorganize1(struct, book, ctx);
                        ctx.compiled[name] = c;
                    }
                }
            );
        });
        for (let name in ctx.compiled) {
            let structdef = ctx.structAST[name];
            let datas = ctx.compiled[name];
            reorganize2(ctx, structdef, datas);
        };
    }
    OpenBlock.DataImporter = {
        loadedExcels: {},// key:filename,value:ArrayBuffer
        importedData: {},
        removeExcel(name) {
            this.loadedExcels[name] = null;
            this.reorganizeData();
        },
        cleanData(){
            this.loadedExcels = {};
            this.reorganizeData();
        },
        /**
         * 
         * @param {{name:String,content:ArrayBuffer}[]} arrayBufferPair 
         */
        importExcel(arrayBufferPair) {
            arrayBufferPair.forEach(nameContentPair => {
                if (!nameContentPair.name) {
                    throw Error('参数格式错误');
                }
                if (!nameContentPair.content) {
                    throw Error('参数格式错误');
                }
                this.loadedExcels[nameContentPair.name] = nameContentPair.content;
                // this.loadedExcels.push(nameContentPair);
            });
            // Object.assign(this.loadedExcels, arrayBufferPair);
            this.reorganizeData();
        },
        reorganizeData() {
            try {
                let workbooks = [];
                Object.values(this.loadedExcels).forEach(buf => {
                    if (!buf) {
                        return;
                    }
                    var data = new Uint8Array(buf);
                    var workbook = XLSX.read(data, { type: 'array' });
                    workbooks.push(workbook);
                });
                // let sheetNames = workbook.SheetNames;
                let structAST = {};
                function addStruct(libs) {
                    libs.forEach(lib => {
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
                let ctx = new DataReorganizingContext();
                ctx.structAST = structAST;
                ctx.workbooks = workbooks;
                reorganize(ctx);
                this.importedData = ctx;
            } catch (e) {
                console.error(e);
                // TODO 提示
                throw e;
            }
        }
    };

    StructField.prototype.reorganize1 = function (ctx, book, sheet, struct) {
        let v = this.type.reorganize1(ctx, book, sheet, struct, this);
        return (data) => {
            data.registers.object[this.registerIndex] = v(data)
        };
    };
    StructFieldTypeStruct.prototype.reorganize1 = function (ctx, book, sheet, struct, field) {
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
    StructFieldTypeList.prototype.reorganize1 = function (ctx, book, sheet, struct, field) {
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
    StructFieldTypeIntegerMap.prototype.reorganize1 = function (ctx, book, sheet, struct, field) {
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

    StructFieldTypeStringMap.prototype.reorganize1 = function (ctx, book, sheet, struct, field) {
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
})();