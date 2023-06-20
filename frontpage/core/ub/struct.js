/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */


OpenBlock.Struct = {};
OpenBlock.Struct.Blocks = {};
OpenBlock.Struct.baseTypes = [
    'Number',
    'Integer',
    'String',
    'Boolean',
    'FSM'
];
OpenBlock.addStruct = (src, opt) => {
    opt = Object.assign(OpenBlock.DataStructure.createFSMTemplate(), opt);
    if (!opt.name) {
        opt.name = OpenBlock.Utils.genName(OpenBlock.I18N.NEW_STRUCT_NAME, src.structs);
    }
    src.structs.push(opt);
    OpenBlock.saveAllSrc();
    return opt;
};
OpenBlock.removeStruct = (src, struct) => {
    const index = src.structs.indexOf(struct);
    if (index > -1) {
        src.structs.splice(index, 1);
    }
    OpenBlock.saveAllSrc();
};
OpenBlock.buildStructBlockly = (src, struct, domContainer) => {
    if (!domContainer) {
        throw new Error('domContainer is null');
    }
    if (src.structs.indexOf(struct) < 0) {
        throw new Error('Struct not in source');
    }
    domContainer.innerHTML = "";

    let xmlDom = OpenBlock.Struct.buildToolbox(src, struct);//Blockly.Xml.textToDom(OpenBlock.config.toolbox.struct);
    // OpenBlock._initStructToolbox(xml);
    let workspace = OpenBlock._buildBlockly(domContainer, xmlDom, struct.code, {
        _openblock_src: src,
        _openblock_struct: struct,
        _openblock_type: 'struct',
        _openblock_target: struct
    });
    let ret = {
        context: {
            src: src,
            struct: struct,
            type: "struct",
            workspace
        },
        value: struct,
        resize: function () {
            // workspace.resize();
            Blockly.svgResize(workspace);
        },
        dispose: function () {
            workspace.dispose();
        },
        saveCode: function () {
            let filename = src.name + '.xs';
            VFS.partition.src.get(filename, v => {
                if (v === src) {
                    struct.code = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
                    // let srcContent = JSON.stringify(src, OpenBlock.hiddenClear);
                    VFS.partition.src.put(filename, (src));
                } else {
                    console.warn(filename + " not in storage");
                }
            });
        }
    };
    ret.context.workspace.saveCode = ret.saveCode;
    workspace.clearUndo();
    return ret;
};

OpenBlock.Struct.buildToolbox = function (src, struct) {
    let xmlDom = document.createElement('xml');

    xmlDom.appendChild(Blockly.Xml.textToDom('<block type="struct"></block>'));
    xmlDom.appendChild(Blockly.Xml.textToDom('<block type="struct_field"></block>'));
    xmlDom.appendChild(Blockly.Xml.textToDom('<block type="struct_base_type"></block>'));
    xmlDom.appendChild(Blockly.Xml.textToDom('<block type="struct_structs"></block>'));
    xmlDom.appendChild(Blockly.Xml.textToDom('<block type="struct_native"></block>'));
    xmlDom.appendChild(Blockly.Xml.textToDom('<block type="struct_list"></block>'));
    xmlDom.appendChild(Blockly.Xml.textToDom('<block type="struct_string_map"></block>'));
    xmlDom.appendChild(Blockly.Xml.textToDom('<block type="struct_integer_map"></block>'));

    return xmlDom;
};

// ++++++++ blocks ++++++
Blockly.Blocks["struct"] = {
    init: function () {
        this.jsonInit({
            "message0": "数据类型 %1 %2",
            "args0": [{
                "type": "field_input",
                "name": "NAME",
            }, {
                "type": "input_statement",
                "name": "FIELDS",
                "check": "field"
            }
            ],
            "style": "struct_blocks"
        });
    }
};
Blockly.Blocks["struct_field"] = {
    init: function () {
        this.jsonInit({
            "message0": "名称 %1 类型 %2",
            "args0": [{
                "type": "field_input",
                "name": "NAME",
            }, {
                "type": "input_value",
                "name": "TYPE",
                "check": "DataType"
            }
            ],
            "style": "struct_blocks",
            "nextStatement": "field",
            "previousStatement": "field"
        });
    }
};
Blockly.Blocks["struct_list"] = {
    init: function () {
        this.jsonInit({
            "message0": "列表 元素类型 %1",
            "args0": [{
                "type": "input_value",
                "name": "TYPE",
                "check": "DataType"
            }
            ],
            "style": "struct_blocks",
            "output": "DataType"
        });
    },
    toCode() {
        let elementType = this.getInput('TYPE');
        if (elementType.connection.isConnected()) {
            let typeBlock = elementType.connection.targetBlock();
            let typeName = typeBlock.toCode();
            return 'list<' + typeName + '>';
        }
    }
};
Blockly.Blocks["struct_string_map"] = {
    init: function () {
        this.jsonInit({
            "message0": "字符串映射 元素类型 %1",
            "args0": [{
                "type": "input_value",
                "name": "TYPE",
                "check": "DataType"
            }
            ],
            "style": "struct_blocks",
            "output": "DataType"
        });
    },
    toCode() {
        let elementType = this.getInput('TYPE');
        if (elementType.connection.isConnected()) {
            let typeBlock = elementType.connection.targetBlock();
            let typeName = typeBlock.toCode();
            return 'string_map<' + typeName + '>';
        }
    }
};
Blockly.Blocks["struct_integer_map"] = {
    init: function () {
        this.jsonInit({
            "message0": "整数映射 元素类型 %1",
            "args0": [{
                "type": "input_value",
                "name": "TYPE",
                "check": "DataType"
            }
            ],
            "style": "struct_blocks",
            "output": "DataType"
        });
    },
    toCode() {
        let elementType = this.getInput('TYPE');
        if (elementType.connection.isConnected()) {
            let typeBlock = elementType.connection.targetBlock();
            let typeName = typeBlock.toCode();
            return 'integer_map<' + typeName + '>';
        }
    }
};
Blockly.Blocks["struct_base_type"] = {
    init: function () {
        this.jsonInit({
            "message0": "基本类型 %1",
            "args0": [{
                "type": "field_dropdown_base_type",
                "name": "TYPE",
            }
            ],
            "style": "struct_blocks",
            "output": "DataType"
        });
    },
    toCode() {
        return this.getFieldValue('TYPE');
    }
};
Blockly.Blocks["struct_new"] = {
    init() {
        this.jsonInit({
            "message0": "创建 %1 类型数据",
            "args0": [{
                "type": "field_dropdown_structs",
                "name": "TYPE",
            }
            ],
            "style": "struct_blocks",
            "output": null
        });
    },
    onchange(e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        let type = this.getFieldValue('TYPE');
        this.outputConnection.setCheck(type);
    }
};
Blockly.Blocks["struct_new_collection"] = {
    init() {
        this.jsonInit({
            "message0": "创建 %1 元素类型的 %2",
            "args0": [{
                "type": "field_dropdown_all_type",
                "name": "ELEMENT_TYPE",
            }, {
                "type": "field_dropdown",
                "name": "TYPE",
                "options": [
                    ["列表", "list"],
                    ["字符映射", "string_map"],
                    ["整数映射", "integer_map"]
                ]
            }
            ],
            "style": "struct_blocks",
            "output": null
        });
    },
    onchange(e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        let type = this.getFieldValue('TYPE');
        let etype = this.getFieldValue('ELEMENT_TYPE');
        this.outputConnection.setCheck(type + '<' + etype + '>');
    }
};
Blockly.Blocks["struct_structs"] = {
    init: function () {
        this.jsonInit({
            "message0": "数据结构 %1",
            "args0": [{
                "type": "field_dropdown_structs",
                "name": "TYPE",
            }
            ],
            "style": "struct_blocks",
            "output": "DataType"
        });
    },
    toCode() {
        return this.getFieldValue('TYPE');
    }
};
Blockly.Blocks["struct_native"] = {
    init: function () {
        this.jsonInit({
            "message0": "本地类型 %1",
            "args0": [{
                "type": "field_dropdown_native_type",
                "name": "TYPE",
            }
            ],
            "style": "struct_blocks",
            "output": "DataType"
        });
    },
    toCode() {
        return this.getFieldValue('TYPE');
    }
};

Blockly.Blocks["struct_count_in_dataset"] = {
    init: function () {
        this.jsonInit({
            "type": "struct_count_in_dataset",
            "message0": Blockly.Msg["struct_count_in_dataset"],
            "args0": [{
                "type": "field_dropdown_structs",
                "name": "TYPE",
            }],
            "output": "Integer",
            "style": "struct_blocks"
        });
    }
};
Blockly.Blocks['struct_load_from_dataset'] = {
    init: function () {
        this.jsonInit({
            "message0": "从数据集中加载 ID为 %1 的 %2",
            "args0": [{
                "type": "input_value",
                "name": "ID",
                "check": ["Integer"]
            }, {
                "type": "field_dropdown_structs",
                "name": "TYPE",
            }
            ],
            "style": "struct_blocks",
            "output": null
        });
        this.onchange = function (e) {
            if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
                return;
            }
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.timeout = setTimeout(() => {

                this.timeout = 0;
                if (!this.workspace) {
                    return;
                }
                let type = this.getFieldValue('TYPE');
                this.outputConnection.setCheck(type);
            }, 500);
        }
    }
};
Blockly.Blocks["struct_clone"] = {
    init() {
        this.jsonInit({
            "message0": "复制数据 %1",
            "args0": [{
                "type": "input_value",
                "name": "DATA"
            }],
            "style": "struct_blocks",
            "output": null
        });
    },
    onchange(e) {
        let targetB = this.getInputTargetBlock('DATA');
        if (targetB) {
            let check = targetB.outputConnection.getCheck();
            if (check && check.length > 0) {
                this.setOutput(true, check);
                return;
            }
        }
        this.setOutput(true);
    },
    mutationToDom() {
        let check = this.outputConnection.getCheck();
        let dom = Blockly.utils.xml.createElement('mutation');
        let node;
        if (check && check.length > 0) {
            node = Blockly.utils.xml.createTextNode(encodeURI(check[0]));
        } else {
            node = Blockly.utils.xml.createTextNode('');
        }
        dom.appendChild(node);
        return dom;
    },
    domToMutation(xml) {
        if (xml && xml.textContent) {
            try {
                let check = JSON.parse(decodeURI(xml.textContent));
            } catch (e) { }
        }
    }
}
Blockly.Blocks["struct_get_field"] = {
    init() {
        this.jsonInit({
            "message0": "从 数据 %1 中获取 %2 的值",
            "args0": [{
                "type": "input_value",
                "name": "DATA"
            }, {
                "type": "struct_get_field_dropdown",
                "name": "FIELD",
            }],
            "style": "struct_blocks",
            "output": null
        });
    },
    onchange(e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        let _check = this.outputConnection.getCheck();
        let field = this.getField('FIELD');
        if (!field) {
            if (_check) {
                this.setOutput(true);
            }
            return;
        }
        let typefield = field.getValue();
        if (!typefield) {
            if (_check) {
                this.setOutput(true);
            }
            return;
        }
        Blockly.Events.disable();
        field.doValueUpdate_(typefield);

        let idx = typefield.lastIndexOf('/');
        let fieldtype = typefield.substr(idx + 1);
        Blockly.Events.enable();
        if ((!_check) || _check[0] !== fieldtype) {
            this.setOutput(true, fieldtype);
        }
    }
};
Blockly.Blocks["struct_set_field"] = {
    init() {
        this.jsonInit({
            "message0": "设置 数据 %1 中 %2 的值为 %3",
            "args0": [{
                "type": "input_value",
                "name": "DATA"
            }, {
                "type": "struct_get_field_dropdown",
                "name": "FIELD",
            }, {
                "type": "input_value",
                "name": "VALUE"
            }],
            "style": "struct_blocks",
            "nextStatement": "inst",
            "previousStatement": "inst"
        });
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
            if (!this.workspace) {
                return;
            }
            Blockly.Events.disable();
            let field = this.getField('FIELD');
            let typefield = field.getValue();
            field.doValueUpdate_(typefield);

            let idx = typefield.lastIndexOf('/');
            let fieldtype = typefield.substr(idx + 1);

            let valueField = this.getInput('VALUE');
            valueField.setCheck(fieldtype);
            Blockly.Events.enable();
        }, 200);
    }
};
Blockly.Blocks['struct_sort_list_field'] = {
    init() {
        this.jsonInit({
            "message0": "将 数据 %1 的列表 %2 以 %3 排序",
            "args0": [{
                "type": "input_value",
                "name": "DATA"
            }, {
                "type": "struct_get_field_dropdown_sortable",
                "name": "FIELD",
            }, {
                "type": "field_dropdown",
                "name": "SORT",
                "options": [
                    ["正序", "A"],
                    ["倒序", "D"]
                ]
            }],
            "style": "struct_blocks",
            "previousStatement": "inst",
            "nextStatement": "inst",
        });
    }
};
Blockly.Blocks['struct_get_most_from_list_field'] = {
    init() {
        this.jsonInit({
            "message0": "获取 数据 %1 的列表 %2 中 %3",
            "args0": [{
                "type": "input_value",
                "name": "DATA"
            }, {
                "type": "struct_get_field_dropdown_sortable",
                "name": "FIELD",
            }, {
                "type": "field_dropdown",
                "name": "SORT",
                "options": [
                    ["最小", "S"],
                    ["最大", "L"]
                ]
            }],
            "style": "struct_blocks",
            "output": null
        });
    }
};
OpenBlock.Struct.genericSetter = function (block, main, sub, containerName, typeField) {
    return (e) => {
        if (main.isConnected()) {
            let check = main.targetConnection.getCheck();
            if (check && check.length > 0) {
                check = check[0];
                let subcheck = check.substring(containerName.length + 1, check.length - 1);
                sub.setCheck(subcheck);
                if (typeField) {
                    typeField.setValue(subcheck);
                }
                return;
            }
        }
        sub.setCheck();
        if (typeField) {
            typeField.setValue('');
        }
    }
};
Blockly.Blocks['struct_map_get_value_of_key'] = {
    init() {
        this.jsonInit({
            "message0": "获取 字符串映射 %1 中 %2 对应的值",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": "string_map<*>"
            }, {
                "type": "input_value",
                "name": "KEY",
                "check": "String"
            }],
            "style": "struct_blocks",
            "output": null
        });
        this.onchange = OpenBlock.Struct
            .genericSetter(this, this.getInput('MAP').connection, this.outputConnection, 'string_map');
    }
};
Blockly.Blocks['struct_imap_get_value_of_key'] = {
    init() {
        this.jsonInit({
            "message0": "获取 整数映射 %1 中 %2 对应的值",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": "integer_map<*>"
            }, {
                "type": "input_value",
                "name": "KEY",
                "check": "Integer"
            }],
            "style": "struct_blocks",
            "output": null
        });
        this.onchange = OpenBlock.Struct
            .genericSetter(this, this.getInput('MAP').connection, this.outputConnection, 'integer_map');
    }
};
Blockly.Blocks['struct_container_size'] = {
    init() {
        this.jsonInit({
            "message0": "获取 集合 %1 的大小",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": ["string_map<*>", "integer_map<*>", "list<*>"]
            }],
            "style": "struct_blocks",
            "output": 'Integer'
        });
    }
};
Blockly.Blocks['struct_imap_exist'] = {
    init() {
        this.jsonInit({
            "message0": "整数映射 %1 中是否包含索引 %2",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": ["integer_map<*>"]
            }, {
                "type": "input_value",
                "name": "KEY",
                "check": ["Integer"]
            }],
            "style": "struct_blocks",
            "output": 'Boolean'
        });
    }
};
Blockly.Blocks['struct_smap_exist'] = {
    init() {
        this.jsonInit({
            "message0": "字符串映射 %1 中是否包含索引 %2",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": ["string_map<*>"]
            }, {
                "type": "input_value",
                "name": "KEY",
                "check": ["String"]
            }],
            "style": "struct_blocks",
            "output": 'Boolean'
        });
    }
};
Blockly.Blocks['struct_smap_all_key'] = {
    init() {
        this.jsonInit({
            "message0": "字符串映射 %1 中全部索引",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": ["string_map<*>"]
            }],
            "style": "struct_blocks",
            "output": 'list<String>'
        });
    }
};
Blockly.Blocks['struct_imap_all_key'] = {
    init() {
        this.jsonInit({
            "message0": "整数映射 %1 中全部索引",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": ["integer_map<*>"]
            }],
            "style": "struct_blocks",
            "output": 'list<Integer>'
        });
    }
};
Blockly.Blocks['struct_map_remove_value_of_key'] = {
    init() {
        this.jsonInit({
            "message0": "删除 字符串映射 %1 中 %2 的映射",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": "string_map<*>"
            }, {
                "type": "input_value",
                "name": "KEY",
                "check": "String"
            }],
            "style": "struct_blocks",
            "previousStatement": "inst",
            "nextStatement": "inst",
        });
    }
};
Blockly.Blocks['struct_imap_delete_value_of_key'] = {
    init() {
        this.jsonInit({
            "message0": "删除 整数映射 %1 中 %2 的映射",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": "integer_map<*>"
            }, {
                "type": "input_value",
                "name": "KEY",
                "check": "Integer"
            }],
            "style": "struct_blocks",
            "previousStatement": "inst",
            "nextStatement": "inst",
        });
    }
};
Blockly.Blocks['struct_map_set_value_of_key'] = {
    init() {
        this.jsonInit({
            "message0": "设置 字符串映射 %1 中 %2 对应的值 %3 ( %4 )",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": "string_map<*>"
            }, {
                "type": "input_value",
                "name": "KEY",
                "check": "String"
            }, {
                "type": "input_value",
                "name": "VALUE",
                "check": null
            }, {
                "type": "field_label",
                "name": "elementType"
            }],
            "style": "struct_blocks",
            "previousStatement": "inst",
            "nextStatement": "inst",
        });
        this.onchange = OpenBlock.Struct
            .genericSetter(this, this.getInput('MAP').connection, this.getInput('VALUE').connection, 'string_map', this.getField('elementType'));
    }
};
Blockly.Blocks['struct_imap_set_value_of_key'] = {
    init() {
        this.jsonInit({
            "message0": "设置 整数映射 %1 中 %2 对应的值 %3 ( %4 )",
            "args0": [{
                "type": "input_value",
                "name": "MAP",
                "check": "integer_map<*>"
            }, {
                "type": "input_value",
                "name": "KEY",
                "check": "Integer"
            }, {
                "type": "input_value",
                "name": "VALUE",
                "check": null
            }, {
                "type": "field_label",
                "name": "elementType"
            }],
            "style": "struct_blocks",
            "previousStatement": "inst",
            "nextStatement": "inst",
        });
        this.onchange = OpenBlock.Struct
            .genericSetter(this, this.getInput('MAP').connection, this.getInput('VALUE').connection, 'integer_map', this.getField('elementType'));
    }
};
Blockly.Blocks['struct_list_get_value_at_index'] = {
    init() {
        this.jsonInit({
            "message0": "获取 列表中 %1 中 索引 %2 的值",
            "args0": [{
                "type": "input_value",
                "name": "LIST",
                "check": "list<*>"
            }, {
                "type": "input_value",
                "name": "INDEX",
                "check": "Integer"
            }],
            "style": "struct_blocks",
            "output": null
        });
        this.onchange = OpenBlock.Struct
            .genericSetter(this, this.getInput('LIST').connection, this.outputConnection, 'list');
    }
};
Blockly.Blocks['struct_list_set_value_at_index'] = {
    init() {
        this.jsonInit({
            "message0": "设置 列表 %1 索引位 %2 的值 %3 ( %4 )",
            "args0": [{
                "type": "input_value",
                "name": "LIST",
                "check": "list<*>"
            }, {
                "type": "input_value",
                "name": "INDEX",
                "check": "Integer"
            }, {
                "type": "input_value",
                "name": "VALUE",
                "check": null
            }, {
                "type": "field_label",
                "name": "elementType"
            }],
            "style": "struct_blocks",
            "previousStatement": "inst",
            "nextStatement": "inst",
        });
        this.onchange = OpenBlock.Struct
            .genericSetter(this, this.getInput('LIST').connection, this.getInput('VALUE').connection, 'list', this.getField('elementType'));
    }
};
Blockly.Blocks['struct_list_insert_value_at_index'] = {
    init() {
        this.jsonInit({
            "message0": "在 列表 %1 索引位 %2 插入值 %3 ( %4 )",
            "args0": [{
                "type": "input_value",
                "name": "LIST",
                "check": "list<*>"
            }, {
                "type": "input_value",
                "name": "INDEX",
                "check": "Integer"
            }, {
                "type": "input_value",
                "name": "VALUE",
                "check": null
            }, {
                "type": "field_label",
                "name": "elementType"
            }],
            "style": "struct_blocks",
            "previousStatement": "inst",
            "nextStatement": "inst",
        });
        this.onchange = OpenBlock.Struct
            .genericSetter(this, this.getInput('LIST').connection, this.getInput('VALUE').connection, 'list', this.getField('elementType'));
    }
};
Blockly.Blocks['struct_list_delete_value_at_index'] = {
    init() {
        this.jsonInit({
            "message0": "在 列表 %1 中删除索引位 %2 的值",
            "args0": [{
                "type": "input_value",
                "name": "LIST",
                "check": "list<*>"
            }, {
                "type": "input_value",
                "name": "INDEX",
                "check": "Integer"
            }],
            "style": "struct_blocks",
            "previousStatement": "inst",
            "nextStatement": "inst",
        });
    }
};
// +++++++++++
(function () {
    class StructGetFieldDropdown extends Blockly.FieldDropdown {
        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            var options = this.getOptions(true);
            for (var i = 0, option; (option = options[i]); i++) {
                if (option[1] === newValue) {
                    this.selectedOption_ = option;
                    let blk = this.getSourceBlock();
                    if (blk) {

                        let datablk = blk.getInputTargetBlock('DATA');
                        if (!datablk) {
                            this.value_ = newValue;
                            return;
                        }
                        let check = datablk.outputConnection.getCheck();
                        if (!check) {
                            blk.setWarningText(OpenBlock.i('未设置类型'));
                            this.value_ = newValue;
                            return;
                        }
                        let typeName = check[0];
                        let stDef = OpenBlock.BlocklyParser.getStructDefByName(typeName);
                        if (!stDef) {
                            this.value_ = newValue;
                            return;
                        }
                        let start = newValue.indexOf(":");
                        if (start < 0) {
                            this.value_ = newValue;
                            return;
                        }
                        let end = newValue.indexOf("/");
                        if (end < 0) {
                            this.value_ = newValue;
                            return;
                        }
                        let fieldName = newValue.substr(start + 1, end - start - 1);
                        let fieldType = null;
                        for (let k in stDef.fields) {
                            let f = stDef.fields[k];
                            if (f.name === fieldName) {
                                fieldType = f.type.name;
                                break;
                            }
                        }
                        blk.setWarningText();
                        if (blk.outputConnection) {
                            blk.outputConnection.setCheck(fieldType)
                        }
                        let valueInput = blk.getInput('VALUE');
                        if (valueInput) {
                            valueInput.setCheck(fieldType);
                        }
                    }
                    this.value_ = newValue;
                    return;
                }
            }
            this.selectedOption_ = [newValue, newValue];
            let blk = this.getSourceBlock();
            if (blk) {
                blk.setWarningText('找不到字段 ' + newValue);
            }
        }

        menuGenerator() {
            let blk = this.getSourceBlock();
            if (!blk) {
                return [['', '']];
            }

            let datablk = blk.getInputTargetBlock('DATA');
            if (!datablk) {
                return [['', '']];
            }
            let check = datablk.outputConnection.getCheck();
            if (!check) {
                return [['', '']];
            }
            let typeName = check[0];
            let stDef = OpenBlock.BlocklyParser.getStructDefByName(typeName);
            if (!stDef) {
                return [['', '']];
            }
            let menu = [];
            stDef.fields.forEach(fd => {
                menu.push([fd.name, stDef.fullname + ':' + fd.name + '/' + fd.type.name]);
            });
            if (menu.length === 0) {
                menu.push(['', '']);
            }
            return menu;
        };
        doClassValidation_(a) {
            return a;
        };
        toXml(fieldElement) {
            fieldElement.textContent = this.getValue();
            return fieldElement;
        };
        fromXml(fieldElement) {
            this.setValue(fieldElement.textContent);
        };
        getOptions(opt_useCache) {
            return this.menuGenerator();
        }
        static fromJson(options) {
            return new OpenBlock.Struct.Blocks.StructGetFieldDropdown(options);
        }
    }
    OpenBlock.Struct.Blocks.StructGetFieldDropdown = StructGetFieldDropdown;
})();

Blockly.fieldRegistry.register('struct_get_field_dropdown', OpenBlock.Struct.Blocks.StructGetFieldDropdown);


// -----------// +++++++++++

(function () {
    class StructGetSortableFieldDropdown extends Blockly.FieldDropdown {
        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            var options = this.getOptions(true);
            for (var i = 0, option; (option = options[i]); i++) {
                if (option[1] === newValue) {
                    this.selectedOption_ = option;
                    let blk = this.getSourceBlock();
                    if (blk) {

                        let datablk = blk.getInputTargetBlock('DATA');
                        if (!datablk) {
                            this.value_ = newValue;
                            return;
                        }
                        let check = datablk.outputConnection.getCheck();
                        if (!check) {
                            blk.setWarningText(OpenBlock.i('未设置类型'));
                            this.value_ = newValue;
                            return;
                        }
                        let typeName = check[0];
                        let stDef = OpenBlock.BlocklyParser.getStructDefByName(typeName);
                        if (!stDef) {
                            this.value_ = newValue;
                            return;
                        }
                        let start = newValue.indexOf(":");
                        if (start < 0) {
                            this.value_ = newValue;
                            return;
                        }
                        let end = newValue.indexOf("/");
                        if (end < 0) {
                            this.value_ = newValue;
                            return;
                        }
                        let fieldName = newValue.substr(start + 1, end - start - 1);
                        let fieldType = null;
                        for (let k in stDef.fields) {
                            let f = stDef.fields[k];
                            if (f.name === fieldName) {
                                fieldType = f.type.name;
                                break;
                            }
                        }
                        blk.setWarningText();
                        if (blk.outputConnection) {
                            blk.outputConnection.setCheck(fieldType)
                        }
                        let valueInput = blk.getInput('VALUE');
                        if (valueInput) {
                            valueInput.setCheck(fieldType);
                        }
                    }
                    this.value_ = newValue;
                    return;
                }
            }
            this.selectedOption_ = [newValue, newValue];
            let blk = this.getSourceBlock();
            if (blk) {
                blk.setWarningText('找不到字段 ' + newValue);
            }
        }
        menuGenerator() {
            let blk = this.getSourceBlock();
            if (!blk) {
                return [['', '']];
            }

            let datablk = blk.getInputTargetBlock('DATA');
            if (!datablk) {
                return [['', '']];
            }
            let check = datablk.outputConnection.getCheck();
            if (!check) {
                return [['', '']];
            }
            let typeName = check[0];
            let stDef = OpenBlock.BlocklyParser.getStructDefByName(typeName);
            if (!stDef) {
                return [['', '']];
            }
            let menu = [];
            stDef.fields.forEach(fd => {
                debugger
                menu.push([fd.name, stDef.fullname + ':' + fd.name + '/' + fd.type.name]);
            });
            if (menu.length === 0) {
                menu.push(['', '']);
            }
            return menu;
        };
        doClassValidation_(a) {
            return a;
        };
        toXml(fieldElement) {
            fieldElement.textContent = this.getValue();
            return fieldElement;
        };
        fromXml(fieldElement) {
            this.setValue(fieldElement.textContent);
        }
        setValue(newValue) {
            Blockly.Field.prototype.setValue.call(this, newValue);
        }
        getOptions(opt_useCache) {
            return this.menuGenerator();
        }
        static fromJson(options) {
            return new OpenBlock.Struct.Blocks.StructGetSortableFieldDropdown(options);
        };
    }
    OpenBlock.Struct.Blocks.StructGetSortableFieldDropdown = StructGetSortableFieldDropdown;
})();

Blockly.fieldRegistry.register('struct_get_field_dropdown_sortable', OpenBlock.Struct.Blocks.StructGetSortableFieldDropdown);


// -----------
(function () {
    class BaseTypeFieldDropdown extends Blockly.FieldDropdown {
        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            var options = this.getOptions(true);
            for (var i = 0, option; (option = options[i]); i++) {
                if (option[1] === newValue) {
                    this.selectedOption_ = option;
                    let blk = this.getSourceBlock();
                    if (blk) {
                        blk.setWarningText();
                    }
                    this.value_ = newValue;
                    return;
                }
            }
            this.selectedOption_ = [newValue, newValue];
            let blk = this.getSourceBlock();
            if (blk) {
                blk.setWarningText('找不到变量 ' + newValue);
            }
        };

        menuGenerator() {
            return OpenBlock.I18N.PRIMARY_TYPES;
        };
        doClassValidation_(a) {
            return a;
        };

        toXml(fieldElement) {
            fieldElement.textContent = this.getValue();
            return fieldElement;
        };
        fromXml(fieldElement) {
            this.setValue(fieldElement.textContent);
        }
        setValue(newValue) {
            Blockly.Field.prototype.setValue.call(this, newValue);
        }
        getOptions(opt_useCache) {
            return this.menuGenerator();
        }
        static fromJson(options) {
            return new OpenBlock.Struct.Blocks.BaseTypeFieldDropdown(options);
        };
    }
    OpenBlock.Struct.Blocks.BaseTypeFieldDropdown = BaseTypeFieldDropdown;
})();

Blockly.fieldRegistry.register('field_dropdown_base_type', OpenBlock.Struct.Blocks.BaseTypeFieldDropdown);


(function () {
    class StructsFieldDropdown extends Blockly.FieldDropdown {

        menuGenerator() {
            let blk = this.getSourceBlock();
            if (!blk) {
                return [['', '']];
            } else {
                let env = (blk.workspace._openblock_env || blk.workspace.targetWorkspace._openblock_env);
                let src = env._openblock_src;
                let struct = env._openblock_struct;
                let structs = OpenBlock.getRelatedStructs(src);
                let menu = [];
                Object.keys(structs).forEach(fullname => {
                    menu.push([fullname, fullname]);
                });
                // Object.keys(OpenBlock.nativeTypes).map(t => {
                //     menu.push([OpenBlock.i(t), t]);
                // });
                if (menu.length == 0) {
                    return [['', '']];
                }
                return menu;
            }
        };
        doClassValidation_(a) {
            return a;
        };
        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            var options = this.getOptions(true);
            for (var i = 0, option; (option = options[i]); i++) {
                if (option[1] === newValue) {
                    this.selectedOption_ = option;
                    let blk = this.getSourceBlock();
                    if (blk) {
                        blk.setWarningText();
                    }
                    this.value_ = newValue;
                    return;
                }
            }
            this.selectedOption_ = [newValue, newValue];
            let blk = this.getSourceBlock();
            if (blk) {
                blk.setWarningText('找不到类型 ' + newValue);
            }
        };
        toXml(fieldElement) {
            fieldElement.textContent = this.getValue();
            return fieldElement;
        };
        fromXml(fieldElement) {
            this.setValue(fieldElement.textContent);
        };
        setValue(newValue) {
            Blockly.Field.prototype.setValue.call(this, newValue);
        }
        getOptions(opt_useCache) {
            return this.menuGenerator();
        }
        static fromJson(options) {
            return new OpenBlock.Struct.Blocks.StructsFieldDropdown(options);
        };

    }
    OpenBlock.Struct.Blocks.StructsFieldDropdown = StructsFieldDropdown;
})();
Blockly.fieldRegistry.register('field_dropdown_structs', OpenBlock.Struct.Blocks.StructsFieldDropdown);

// ------------------------------------------------------------------------------------------------

(function () {
    class AllTypeFieldDropdown extends Blockly.FieldDropdown {
        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            var options = this.getOptions(true);
            for (var i = 0, option; (option = options[i]); i++) {
                if (option[1] === newValue) {
                    this.selectedOption_ = option;
                    let blk = this.getSourceBlock();
                    if (blk) {
                        blk.setWarningText();
                    }
                    this.value_ = newValue;
                    return;
                }
            }
            this.selectedOption_ = [newValue, newValue];
            let blk = this.getSourceBlock();
            if (blk) {
                blk.setWarningText('找不到类型 ' + newValue);
            }
        }

        menuGenerator() {
            let primary_types = OpenBlock.I18N.PRIMARY_TYPES;
            let blk = this.getSourceBlock();
            if (!blk) {
                return primary_types
            } else {
                let env = (blk.workspace._openblock_env || blk.workspace.targetWorkspace._openblock_env);
                let src = env._openblock_src;
                let struct = env._openblock_struct;
                let structs = OpenBlock.getRelatedStructs(src);
                let menu = [].concat(primary_types);
                Object.keys(structs).forEach(fullname => {
                    menu.push([fullname, fullname]);
                });
                Object.keys(OpenBlock.nativeTypes).map(t => {
                    menu.push([OpenBlock.i(t), t]);
                });
                if (menu.length == 0) {
                    return primary_types;
                }
                return menu;
            }
        }
        doClassValidation_(a) {
            return a;
        }
        toXml(fieldElement) {
            fieldElement.textContent = this.getValue();
            return fieldElement;
        };
        fromXml(fieldElement) {
            this.setValue(fieldElement.textContent);
        }
        setValue(newValue) {
            Blockly.Field.prototype.setValue.call(this, newValue);
        }
        getOptions(opt_useCache) {
            return this.menuGenerator();
        }
        static fromJson(options) {
            return new OpenBlock.Struct.Blocks.AllTypeFieldDropdown(options);
        };
    }
    OpenBlock.Struct.Blocks.AllTypeFieldDropdown = AllTypeFieldDropdown;
})();

Blockly.fieldRegistry.register('field_dropdown_all_type', OpenBlock.Struct.Blocks.AllTypeFieldDropdown);




// ------------------------------------------------------------------------------------------------

(function () {
    class NativeTypeFieldDropdown extends Blockly.FieldDropdown {
        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            var options = this.getOptions(true);
            for (var i = 0, option; (option = options[i]); i++) {
                if (option[1] === newValue) {
                    this.selectedOption_ = option;
                    let blk = this.getSourceBlock();
                    if (blk) {
                        blk.setWarningText();
                    }
                    this.value_ = newValue;
                    return;
                }
            }
            this.selectedOption_ = [newValue, newValue];
            let blk = this.getSourceBlock();
            if (blk) {
                blk.setWarningText('找不到类型 ' + newValue);
            }
        }

        menuGenerator() {
            let menu = [];
            Object.keys(OpenBlock.nativeTypes).map(t => {
                menu.push([OpenBlock.i(t), t]);
            });
            if (menu.length == 0) {
                return OpenBlock.I18N.PRIMARY_TYPES;
            }
            return menu;
        }
        doClassValidation_(a) {
            return a;
        }
        toXml(fieldElement) {
            fieldElement.textContent = this.getValue();
            return fieldElement;
        }
        fromXml(fieldElement) {
            this.setValue(fieldElement.textContent);
        }
        setValue(newValue) {
            Blockly.Field.prototype.setValue.call(this, newValue);
        }
        getOptions(opt_useCache) {
            return this.menuGenerator();
        }
        static fromJson(options) {
            return new OpenBlock.Struct.Blocks.NativeTypeFieldDropdown(options);
        }
    }
    OpenBlock.Struct.Blocks.NativeTypeFieldDropdown = NativeTypeFieldDropdown;
})();

Blockly.fieldRegistry.register('field_dropdown_native_type', OpenBlock.Struct.Blocks.NativeTypeFieldDropdown);
// ---------- blocks -------

OpenBlock.getRelatedStructs = (src) => {
    let relatedSrc = OpenBlock.getRelatedSrcOrLib(src);

    let structMap = {};
    relatedSrc.forEach(rSrc => {
        // structArr = structArr.concat(rSrc.structs);
        rSrc.__analyzed.structs.forEach(st => {
            let fullname = rSrc.name + "." + st.name;
            structMap[fullname] = st;
        });
    });
    return structMap;
};
