/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

OpenBlock.Procedures = {};
Blockly.Blocks['method_return'] = {
    init() {
        this.jsonInit({
            "type": "method_return",
            "message0": "返回",
            "previousStatement": "inst",
            "style": 'procedure_blocks'
        });
    },
    onchange(e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        // if (e.recordUndo) {
        let root = this.getRootBlock();
        if (root.type === 'typed_procedures') {
            let returnType = root.getInputTargetBlock('RETURN');
            if (returnType) {
                this.setValueType(returnType.toCode());
                return;
            }
            // }
            this.removeInput('VALUE', true);
        }
    },
    getValueInput() {
        let input = this.getInput('VALUE');
        if (!input) {
            input = this.appendValueInput('VALUE');
            input.appendField('返回值：');
        }
        return input;
    },
    setValueType(typeName) {
        let input = this.getValueInput();
        input.setCheck(typeName);
    },
    mutationToDom() {
        let input = this.getInput('VALUE');
        if (input) {
            let dom = Blockly.utils.xml.createElement('mutation');
            let node = Blockly.utils.xml.createTextNode(encodeURI(JSON.stringify(input.connection.getCheck())));
            dom.appendChild(node);
            return dom;
        } else {
            return Blockly.utils.xml.createElement('mutation');
        }
    },
    domToMutation(xml) {
        if (xml && xml.textContent) {
            let mutationData = JSON.parse(decodeURI(xml.textContent), Deserializer);
            this.setValueType(mutationData);
        }
    },
};
Blockly.Blocks["typed_procedure_call"] = {
    init() {
        this.mutationData = {
            returnType: null,
            args: [],
            ignoreReturnValue: false
        }
        this.module = null;
        this.setStyle('procedure_blocks');
        this.appendDummyInput('BASE')
            .appendField('调用函数')
            .appendField('模块：')
            .appendField(new Blockly.FieldDropdown(this.moudleList, this.moudleValidator), 'MODULE')
            .appendField('函数：')
            .appendField(new Blockly.FieldDropdown(this.funcList, this.funcValidator), 'METHOD');
        this.setNextStatement(true, 'inst');
        this.setPreviousStatement(true, "inst");
    },
    customContextMenu(options) {
        if (this.isInFlyout) {
            return;
        }
        if (this.mutationData.returnType) {
            let block = this;
            if (!this.mutationData.ignoreReturnValue) {
                let o = {
                    callback() {
                        block.mutationData.ignoreReturnValue = true;
                        block.updateBlock();
                    },
                    enabled: true,
                    text: "忽略返回值"
                };
                options.unshift(o);
            } else {
                let o = {
                    callback() {
                        block.mutationData.ignoreReturnValue = false;
                        block.updateBlock();
                    },
                    enabled: true,
                    text: "读取返回值"
                };
                options.unshift(o);
            }
        }
        if (window.selectFunctionByName) {
            let blk = this;
            let o = {
                callback() {
                    let func = blk.getFieldValue('METHOD');
                    let module = blk.getFieldValue('MODULE');
                    if (module) {
                        let funcname = func.substring(0, func.indexOf('('));
                        funcname = funcname.substring(funcname.lastIndexOf('.') + 1);
                        let src = OpenBlock.getSrcByName(module);
                        if (src.__analyzed) {
                            let f = src.__analyzed.functions.find((f) => {
                                return f.name === funcname;
                            });
                            if (f) {
                                window.selectFunctionByName(module, f.name, f.blockId);
                            }
                        }
                    } else {
                        let ws = blk.workspace;
                        let topblks = ws.getTopBlocks();
                        for (let k in topblks) {
                            let tblk = topblks[k];
                            if (tblk.type == 'typed_procedures') {
                                let name = tblk.getFieldValue('NAME');
                                if (name === func) {
                                    tblk.select();
                                    OpenBlock.Utils.centerOnSingleBlock(ws, tblk.id);
                                }
                            }
                        }
                    }
                },
                enabled: true,
                text: "跳转到函数"
            };
            options.unshift(o);
        }
    },
    mutationToDom() {
        let dom = Blockly.utils.xml.createElement('mutation');
        let node = Blockly.utils.xml.createTextNode(encodeURI(JSON.stringify(this.mutationData)));
        dom.appendChild(node);
        return dom;
    },
    domToMutation(xml) {
        if (xml && xml.textContent) {
            let mutationData = JSON.parse(decodeURI(xml.textContent), Deserializer);
            this.mutationData = mutationData;
        } else {
            this.mutationData = { args: [], returnType: null };
        }
        this.updateBlock();
    },
    updateBlock() {
        let block = this;
        Blockly.Events.disable();
        if (this.mutationData.returnType && !this.mutationData.ignoreReturnValue) {
            if (block.nextConnection && block.nextConnection.isConnected()) {
                block.nextConnection.disconnect();
            }
            block.setNextStatement(false);
            if (block.previousConnection && block.previousConnection.isConnected()) {
                block.previousConnection.disconnect();
            }
            block.setPreviousStatement(false);
            block.setOutput(true, this.mutationData.returnType.toCodeText());
        } else {
            if (block.outputConnection && block.outputConnection.isConnected()) {
                block.outputConnection.disconnect();
            }
            block.setOutput(false);
            block.setNextStatement(true, 'inst');
            block.setPreviousStatement(true, 'inst');
        }
        for (let i = 0; i < this.mutationData.args.length; i++) {
            let input = block.inputList[1 + i];
            let arg = this.mutationData.args[i];
            let type;
            if (arg.type) {
                if (!arg.type.toCodeText) {
                    debugger
                }
                type = arg.type.toCodeText();
            }
            if (input) {
                input.fieldRow[0].setValue(arg.name);
                input.setCheck(type);
            }
            else {
                let name = arg.name;
                let input = block.appendValueInput('ARG' + i);
                input.setAlign(Blockly.ALIGN_RIGHT).setCheck(type);
                input.appendField(name);
            }
        }
        while (block.inputList.length > this.mutationData.args.length + 1) {
            let input = block.inputList[block.inputList.length - 1];
            if (input.connection && input.connection.isConnected()) {
                input.connection.disconnect();
            }
            block.removeInput(input.name);
        }
        Blockly.Events.enable();
    },
    funcList() {
        let rt = []
        let block = this.getSourceBlock();
        if (!block) {
            rt.push(['', '']);
            return rt;
        }
        if (block.module) {
            let module = OpenBlock.BlocklyParser.loadedFiles.
                srcs.find(m => m.name === block.module);
            if (module) {
                if (!module.__compiled) {
                    rt.push(['', '']);
                    return rt;
                }
                module = module.__compiled.export;
            } else {
                module = OpenBlock.BlocklyParser.loadedFiles.
                    libs.find(m => m.name === block.module);
                // TODO 处理 lib 的导出格式
                debugger
            }
            if (module) {
                Object.values(module.functions).forEach(f => {
                    if (f.fullname.split('.').length === 2) {
                        rt.push([f.name, f.signature, f]);
                    }
                });
            }
            if (rt.length === 0) {
                rt.push(['', '']);
            }
            return rt;
        } else {
            let env = (block.workspace._openblock_env || block.workspace.targetWorkspace._openblock_env);
            if (env && env._openblock_src) {
                let src = env._openblock_src;
                if (!src) {
                    rt.push(['', '']);
                    return rt;
                }
                let state = env._openblock_state;
                if (state) {
                    src = env._openblock_src.__analyzed;
                    let fsm = env._openblock_fsm;
                    let fsmname = fsm.name;
                    let a_fsm = src.fsms.find(v => (fsmname === v.name));
                    let a_state = a_fsm.states.find(v => (v.name === state.name));
                    a_state.functions.forEach(f => { rt.push([f.name, f.name, f]); });
                } else if (env._openblock_function) {
                    src = env._openblock_src.__compiled;
                    if (src) {
                        let functions = src.export.functions;
                        Object.values(functions).forEach(f => { rt.push([f.name, f.name, f]); });
                    }
                }
                if (rt.length === 0) {
                    rt.push(['', '']);
                }
                return rt;
            } else {
                rt.push(['', '']);
                return rt;
            }
        }
    },
    onFuncUpdate() {
        let m = this.getField('METHOD');
        if (m) {
            m.setValue(m.getValue());
        }
    },
    onchange(e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            this.updateTimeout = 0;
            this.onFuncUpdate();
        }, 500);
    },
    funcValidator(v) {
        this.func = null;
        let block = this.getSourceBlock();
        if (!block) {
            return v;
        }
        if (block.errorModule) {
            return v;
        }
        let lst = block.funcList.call(this);
        let func = v === '' ? null : lst.find(f => (f[1] === v));
        if (!func) {
            block.setWarningText('找不到函数');
        } else {
            this.func = func;
            block.setWarningText();
            let funcDef = func[2];
            if (block.mutationData) {
                block.mutationData.returnType = funcDef.returnType;
                block.mutationData.args = funcDef.args;
            } else {
                block.mutationData = {
                    returnType: funcDef.returnType,
                    args: funcDef.args
                };
            }
            block.updateBlock();
        }
        return v;
    },
    moudleList() {
        let blk = this.getSourceBlock();
        if (!blk) {
            return [['当前作用域', '']];
        }
        let env = blk.workspace._openblock_env;
        if (!env) {
            return [['当前作用域', '']];
        }
        let scope = env._openblock_state || env._openblock_function;
        let rt = [['当前作用域', '']]
        OpenBlock.BlocklyParser.loadedFiles.analyzedModules.forEach(m => {
            rt.push([m.name, m.name]);
        });
        return rt;
    },
    moudleValidator(v) {
        let block = this.getSourceBlock();
        if (!block) {
            return v;
        }
        block.module = null;
        if (v === '') {
            return v;
        }
        let arr = OpenBlock.BlocklyParser.loadedFiles.analyzedModules;
        for (let i = 0; i < arr.length; i++) {
            let module = arr[i];
            if (module.name === v) {
                block.module = v;
                break;
            }
        }
        if (block.module) {
            block.setWarningText();
            block.errorModule = false;
            setTimeout(() => {
                block.onFuncUpdate();
            }, 2);
            // let mf = block.getField('METHOD');
            // mf.setValue(mf.getValue());
        } else {
            block.setWarningText("找不到模块");
            block.errorModule = true;
        }
        return v
    }
};
Blockly.Blocks['typed_procedures'] = {
    init() {
        this.setStyle('procedure_blocks');
        var nameField = new Blockly.FieldTextInput('');
        this.appendDummyInput()
            .appendField('定义函数')
            .appendField(nameField, 'NAME');
        let returnType = this.appendValueInput('RETURN');
        returnType.appendField('返回值类型：');
        returnType.setCheck('DataType');
        let args = this.appendStatementInput('ARGS').appendField('参数');
        args.setCheck('field');
        this.setNextStatement(true, 'inst');
    },
    updateArgs() {
        let stmt = this.getInput('ARGS');
        if (!stmt) {
            return;
        }
        let stmtconn = stmt.connection;
        let fieldconn = stmtconn.targetConnection;
        let info = [];
        while (fieldconn) {
            let fieldblk = fieldconn.getSourceBlock();
            //
            let name = fieldblk.getFieldValue('NAME');
            // if (info.find((i) => { return i.name === name })) {
            //     throw Error('重复参数：' + name);
            // }
            let typeconn = fieldblk.getInput('TYPE').connection.targetConnection;
            if (typeconn) {
                let typeblk = typeconn.getSourceBlock();
                let type = typeblk.toCode();
                info.push({ name, type, blockId: this.id });
            } else {
                info.push({ name, type: "", blockId: this.id });
            }
            //
            fieldconn = fieldblk.nextConnection.targetConnection;
        }
        this.local_variable_info = info;
    },
    onchange(e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => {
            this.timeout = 0;
            this.updateArgs();
        }, 500);
    },
    mutationToDom() {
        if (this.local_variable_info) {
            let dom = Blockly.utils.xml.createElement('mutation');
            let node = Blockly.utils.xml.createTextNode(encodeURI(JSON.stringify(this.local_variable_info)));
            dom.appendChild(node);
            return dom;
        } else {
            let dom = Blockly.utils.xml.createElement('mutation');
            return dom;
        }
    },
    domToMutation(xml) {
        if (xml && xml.textContent) {
            try {
                let info = JSON.parse(decodeURI(xml.textContent));
                this.local_variable_info = info;
            } catch (e) { }
        }
    }
};
OpenBlock.Procedures = {
    makeFlyout(workspace) {
        var xmlList = [];
        xmlList.push(Blockly.Xml.textToDom('<block type="typed_procedures"></block>'));
        xmlList.push(Blockly.Xml.textToDom('<block type="typed_procedure_call"></block>'));
        xmlList.push(Blockly.Xml.textToDom('<block type="method_return"></block>'));
        return xmlList;
    }
};
OpenBlock.wsBuildCbs.push(workspace => {
    workspace.registerToolboxCategoryCallback('UB_PROCEDURE', OpenBlock.Procedures.makeFlyout);
});