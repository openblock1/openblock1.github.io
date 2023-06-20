/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

(function () {
    OpenBlock.nativefunctions = { custom: {}, buildin: [] };
    OpenBlock.initNativeFunctionAndTypes = function () {
        OpenBlock.nativefunctions.custom = {};
        OpenBlock.nativeTypes = {};
    };
    OpenBlock.nativefunctions.findBuildInFunction = function (name) {
        let func = OpenBlock.nativefunctions.buildin.find(f => {
            return f.fullname === name;
        });
        if (!func) {
            throw Error('找不到内置函数 ' + name);
        }
        return func;
    }
    OpenBlock.initNativeFunctionAndTypes();
    /**
     * 
     * @param {[typename:[supertype]]} typeMap 
     */
    OpenBlock.AddNativeTypes = function (typeMap) {
        for (let type in typeMap) {
            OpenBlock.nativeTypes[type] = typeMap[type];
        }
    }
    function initBuildinJson(arr, libHash, libName, lib) {
        let i = 0;
        lib.libName = libName;
        lib.libHash = libHash;
        arr.forEach(f => {

            let fdef = new FunctionDef();
            fdef.setName(f.method_name);
            if (f.returnType) {
                fdef.setReturnType(OpenBlock.textToValueType(f.returnType));
            }
            if (f.arguments) {
                f.arguments.forEach(a => {
                    let type = OpenBlock.textToValueType(a.type);
                    let sf = new StructField();
                    if (type) {
                        sf.setType(type);
                    }
                    sf.setName(a.name);
                    fdef.addArg(sf);
                });
            }
            fdef.fullname = f.method_name;
            fdef.scope = 'global';
            fdef.buildSignature();

            fdef.libHash = libHash;
            fdef.libIndex = i++;
            fdef.libName = libName;

            lib.push(fdef);
        });
    }
    OpenBlock.buildinFunctionJson = function (arr) {
        initBuildinJson(arr, '', '', OpenBlock.nativefunctions.buildin);
    }
    OpenBlock.nativeFunctionJson = function (libName, libHash, arr) {
        if (libName === '' || typeof (libName) != 'string') {
            throw Error("必须提供库名称");
        }
        if (OpenBlock.nativefunctions.custom[libName]) {
            throw Error("导入本地库重复 " + libName);
        }
        OpenBlock.nativefunctions.custom[libName] = [];
        initBuildinJson(arr, libHash, libName, OpenBlock.nativefunctions.custom[libName]);
    }
    OpenBlock.nativefunctions.check = function (func, throws) {
        let libName = func.libName;
        let libHash = func.libHash;
        let libIndex = func.libIndex;
        let lib = OpenBlock.nativefunctions.custom[libName];
        if (!lib) {
            if (throws) {
                throw { "message": ("找不到函数库 " + func.fullname) };
            } else {
                return null;
            }
        }
        // if (lib.libHash != libHash) {
        //     console.log("函数库Hash不一致 " + libName + "/" + libHash);
        // }
        let libfunc = lib[libIndex];
        if (libfunc.fullname != func.fullname) {
            // console.log("函数索引已经发生改变" + func.fullname);
            libfunc = lib.find(f => f.fullname === func.fullname);
            if (!libfunc) {
                if (throws) {
                    throw { "message": ("找不到函数 " + func.fullname) };
                } else {
                    return null;
                }
            }
        }
        // if (libfunc.signature !== func.signature) {
        //     console.warn("函数签名已经改变");
        // }
        return libfunc;
    }
})();