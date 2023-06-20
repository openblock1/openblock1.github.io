/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

OpenBlock.Blocks = {};
OpenBlock.Blocks.getAvaliableVar = function (block, r, include_sub_statement) {
    if (!r) {
        r = [];
    }
    if (!block) {
        return r;
    }
    if (block.local_variable_info) {
        block.local_variable_info.forEach(i => {
            if (!include_sub_statement) {
                if (i.sub_statement) {

                } else {
                    r.push(i);
                }
            } else {
                r.push(i);
            }
        });
    }
    let prevBlock = block.getPreviousBlock();
    if (prevBlock) {
        if (block === prevBlock.getNextBlock()) {
            // 同级前置指令
            OpenBlock.Blocks.getAvaliableVar(prevBlock, r, include_sub_statement);
        } else {
            // 父级指令
            OpenBlock.Blocks.getAvaliableVar(prevBlock, r, true);
        }
    }
    // 父级指令
    let outputBlock = block.outputConnection && block.outputConnection.targetBlock();
    OpenBlock.Blocks.getAvaliableVar(outputBlock, r, true);
    return r;
}
function isChildBlockOf(b1, b2) {
    if (!(b1 instanceof Blockly.Block)) {
        return false;
    }
    if (!(b2 instanceof Blockly.Block)) {
        return false;
    }
    while (b1) {
        if (b1 === b2) {
            return true;
        }
        b1 = b1.getParent();
    }
    return false;
}
Blockly.defineBlocksWithJsonArray(
    [
        // Block for composing a colour from RGB components.
        {
            "type": "colour_rgb",
            "message0": "%{BKY_COLOUR_RGB_TITLE} %{BKY_COLOUR_RGB_RED} %1 %{BKY_COLOUR_RGB_GREEN} %2 %{BKY_COLOUR_RGB_BLUE} %3",
            "args0": [
                {
                    "type": "input_value",
                    "name": "RED",
                    "check": "Integer",
                    "align": "RIGHT"
                },
                {
                    "type": "input_value",
                    "name": "GREEN",
                    "check": "Integer",
                    "align": "RIGHT"
                },
                {
                    "type": "input_value",
                    "name": "BLUE",
                    "check": "Integer",
                    "align": "RIGHT"
                }
            ],
            "output": "Colour",
            "helpUrl": "%{BKY_COLOUR_RGB_HELPURL}",
            "style": "colour_blocks",
            "tooltip": "%{BKY_COLOUR_RGB_TOOLTIP}"
        },
        {
            "type": "text_isEmpty",
            "message0": "%{BKY_TEXT_ISEMPTY_TITLE}",
            "args0": [
                {
                    "type": "input_value",
                    "name": "VALUE",
                    "check": ['String']
                }
            ],
            "output": 'Boolean',
            "style": "text_blocks",
            "tooltip": "%{BKY_TEXT_ISEMPTY_TOOLTIP}",
            "helpUrl": "%{BKY_TEXT_ISEMPTY_HELPURL}"
        },
        {
            "type": "text_indexOf",
            "message0": "%{BKY_TEXT_INDEXOF_TITLE}",
            "args0": [
                {
                    "type": "input_value",
                    "name": "VALUE",
                    "check": "String"
                },
                {
                    "type": "field_dropdown",
                    "name": "END",
                    "options": [
                        [
                            "%{BKY_TEXT_INDEXOF_OPERATOR_FIRST}",
                            "FIRST"
                        ],
                        [
                            "%{BKY_TEXT_INDEXOF_OPERATOR_LAST}",
                            "LAST"
                        ]
                    ]
                },
                {
                    "type": "input_value",
                    "name": "FIND",
                    "check": "String"
                }
            ],
            "output": "Integer",
            "style": "text_blocks",
            "helpUrl": "%{BKY_TEXT_INDEXOF_HELPURL}",
            "inputsInline": true,
            "extensions": [
                "text_indexOf_tooltip"
            ]
        },
        {
            "type": "math_text_to_integer",
            "message0": Blockly.Msg['math_text_to_integer'],
            "args0": [
                {
                    "type": "input_value",
                    "name": "TEXT",
                    "check": ["String"]
                }
            ],
            "output": ["Integer"],
            "style": "math_blocks",
        },
        {
            "type": "math_text_to_number",
            "message0": Blockly.Msg['math_text_to_number'],
            "args0": [
                {
                    "type": "input_value",
                    "name": "TEXT",
                    "check": ["String"]
                }
            ],
            "output": ["Number"],
            "style": "math_blocks",
        },
        // Block for rounding functions.
        {
            "type": "math_round",
            "message0": "%1 %2",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        ["%{BKY_MATH_ROUND_OPERATOR_ROUND}", "ROUND"],
                        ["%{BKY_MATH_ROUND_OPERATOR_ROUNDUP}", "ROUNDUP"],
                        ["%{BKY_MATH_ROUND_OPERATOR_ROUNDDOWN}", "ROUNDDOWN"]
                    ]
                },
                {
                    "type": "input_value",
                    "name": "NUM",
                    "check": ["Number"]
                }
            ],
            "output": ["Integer", "Number"],
            "style": "math_blocks",
            "helpUrl": "%{BKY_MATH_ROUND_HELPURL}",
            "tooltip": "%{BKY_MATH_ROUND_TOOLTIP}"
        },
        // Block for remainder of a division.
        {
            'type': 'math_modulo',
            'message0': '%{BKY_MATH_MODULO_TITLE}',
            'args0': [
                {
                    'type': 'input_value',
                    'name': 'DIVIDEND',
                    'check': ['Integer'],
                },
                {
                    'type': 'input_value',
                    'name': 'DIVISOR',
                    'check': ['Integer'],
                },
            ],
            'inputsInline': true,
            'output': ['Number'],
            'style': 'math_blocks',
            'tooltip': '%{BKY_MATH_MODULO_TOOLTIP}',
            'helpUrl': '%{BKY_MATH_MODULO_HELPURL}',
        },
        {
            "type": "text_length",
            "message0": "%{BKY_TEXT_LENGTH_TITLE}",
            "args0": [
                {
                    "type": "input_value",
                    "name": "VALUE",
                    "check": ['String',]
                }
            ],
            "output": ['Integer', 'Number'],
            "style": "text_blocks",
            "tooltip": "%{BKY_TEXT_LENGTH_TOOLTIP}",
            "helpUrl": "%{BKY_TEXT_LENGTH_HELPURL}"
        }, {
            "type": "logic_is_not_valid",
            "message0": Blockly.Msg["logic_is_not_valid"],
            "args0": [{
                "type": "input_value",
                "name": "A0"
            }],
            "inputsInline": true,
            "output": "Boolean",
            "style": "operation_blocks",
            "tooltip": "",
            "helpUrl": ""
        },
        {
            "type": "logic_is_valid",
            "message0": Blockly.Msg["logic_is_valid"],
            "args0": [{
                "type": "input_value",
                "name": "A0"
            }],
            "inputsInline": true,
            "output": "Boolean",
            "style": "operation_blocks",
            "tooltip": "",
            "helpUrl": ""
        }, {
            "type": "variables_self",
            "message0": Blockly.Msg["variables_self"],
            "inputsInline": true,
            "output": "FSM",
            "style": "gameobject_blocks",
            "tooltip": "",
            "helpUrl": ""
        }, {
            "type": "text_comment",
            "message0": "注释 %1",
            "args0": [
                {
                    "type": "field_multilinetext",
                    "name": "TEXT",
                    "text": "注释"
                }
            ],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "text_blocks",
            "extensions": [
                "tooltip_when_inline"
            ]
        },
        {
            "type": "math_trig_atan2",
            "message0": 'atan2 Y %1 X %2',
            "args0": [
                {
                    "type": "input_value",
                    "name": "Y",
                    "check": "Number"
                },
                {
                    "type": "input_value",
                    "name": "X",
                    "check": "Number"
                },
            ],
            "inputsInline": true,
            "output": "Number",
            "style": "math_blocks",
            "tooltip": "",
            "helpUrl": ""
        },
        {
            "type": "destroy_fsm",
            "message0": Blockly.Msg["destroy_fsm"],
            "previousStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        },
        // Block for checking if a number is even, odd, prime, whole, positive,
        // negative or if it is divisible by certain number.
        {
            "type": "math_number_property",
            "message0": "%1 %2",
            "args0": [
                {
                    "type": "input_value",
                    "name": "NUMBER_TO_CHECK",
                    "check": "Number"
                },
                {
                    "type": "field_dropdown",
                    "name": "PROPERTY",
                    "options": [
                        ["%{BKY_MATH_IS_EVEN}", "EVEN"],
                        ["%{BKY_MATH_IS_ODD}", "ODD"],
                        // ["%{BKY_MATH_IS_PRIME}", "PRIME"],
                        ["%{BKY_MATH_IS_WHOLE}", "WHOLE"],
                        ["%{BKY_MATH_IS_POSITIVE}", "POSITIVE"],
                        ["%{BKY_MATH_IS_NEGATIVE}", "NEGATIVE"],
                        ["%{BKY_MATH_IS_DIVISIBLE_BY}", "DIVISIBLE_BY"]
                    ]
                }
            ],
            "inputsInline": true,
            "output": "Boolean",
            "style": "math_blocks",
            "tooltip": "%{BKY_MATH_IS_TOOLTIP}",
            "mutator": "math_is_divisibleby_mutator"
        },
        {
            "type": "controls_repeat_ext",
            "message0": "%{BKY_CONTROLS_REPEAT_TITLE}",
            "args0": [{
                "type": "input_value",
                "name": "TIMES",
                "check": ["Integer", "Number"]
            }],
            "message1": "%{BKY_CONTROLS_REPEAT_INPUT_DO} %1",
            "args1": [{
                "type": "input_statement",
                "name": "DO",
                "check": "inst"
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "loop_blocks",
            "tooltip": "%{BKY_CONTROLS_REPEAT_TOOLTIP}",
            "helpUrl": "%{BKY_CONTROLS_REPEAT_HELPURL}"
        },
        // Block for random integer between [X] and [Y].
        {
            "type": "math_random_int",
            "message0": "%{BKY_MATH_RANDOM_INT_TITLE}",
            "args0": [
                {
                    "type": "input_value",
                    "name": "FROM",
                    "check": ["Number", "Integer"]
                },
                {
                    "type": "input_value",
                    "name": "TO",
                    "check": ["Number", "Integer"]
                }
            ],
            "inputsInline": true,
            "output": ["Integer", "Number"],
            "style": "math_blocks",
            "tooltip": "%{BKY_MATH_RANDOM_INT_TOOLTIP}",
            "helpUrl": "%{BKY_MATH_RANDOM_INT_HELPURL}"
        }, {
            'type': 'math_number_property',
            'message0': '%1 %2',
            'args0': [
                {
                    'type': 'input_value',
                    'name': 'NUMBER_TO_CHECK',
                    'check': ['Number', 'Integer'],
                },
                {
                    'type': 'field_dropdown',
                    'name': 'PROPERTY',
                    'options': [
                        ['%{BKY_MATH_IS_EVEN}', 'EVEN'],
                        ['%{BKY_MATH_IS_ODD}', 'ODD'],
                        ['%{BKY_MATH_IS_PRIME}', 'PRIME'],
                        ['%{BKY_MATH_IS_WHOLE}', 'WHOLE'],
                        ['%{BKY_MATH_IS_POSITIVE}', 'POSITIVE'],
                        ['%{BKY_MATH_IS_NEGATIVE}', 'NEGATIVE'],
                        ['%{BKY_MATH_IS_DIVISIBLE_BY}', 'DIVISIBLE_BY'],
                    ],
                },
            ],
            'inputsInline': true,
            'output': 'Boolean',
            'style': 'math_blocks',
            'tooltip': '%{BKY_MATH_IS_TOOLTIP}',
            'mutator': 'math_is_divisibleby_mutator',
        },
        // Block for advanced math operators with single operand.
        {
            'type': 'math_single',
            'message0': '%1 %2',
            'args0': [
                {
                    'type': 'field_dropdown',
                    'name': 'OP',
                    'options': [
                        ['%{BKY_MATH_SINGLE_OP_ROOT}', 'ROOT'],
                        ['%{BKY_MATH_SINGLE_OP_ABSOLUTE}', 'ABS'],
                        ['-', 'NEG'],
                        ['ln', 'LN'],
                        ['log10', 'LOG10'],
                        ['e^', 'EXP'],
                        ['10^', 'POW10'],
                    ],
                },
                {
                    'type': 'input_value',
                    'name': 'NUM',
                    'check': ['Number', 'Integer'],
                },
            ],
            'output': ['Number', 'Integer'],
            'style': 'math_blocks',
            'helpUrl': '%{BKY_MATH_SINGLE_HELPURL}',
            'extensions': ['math_op_tooltip'],
        },
    ]
);
/**
 * openblock变量必须初始化，此命令不再有意义
 */
Blockly.Blocks['logic_var_assigned'] = {
    init() {
        this.jsonInit({
            "message0": Blockly.Msg['LOGIC_VAR_ASSIGNED'],
            "args0": [
                {
                    "type": "input_value",
                    "name": "VALUE",
                }
            ],
            "output": "Boolean",
            "inputsInline": true,
            "style": "logic_blocks",
            "tooltip": Blockly.Msg['LOGIC_VAR_ASSIGNED_TOOLTIP']
        });
    },
    onchange(e) {
        let input = this.getInput('VALUE');
        if (input && input.connection.isConnected()) {
            let check = input.connection.targetConnection.check_;
            if (!check) {
                this.setWarningText();
                return true;
            }

            if (check && ((check.indexOf('Integer') > -1) || (check.indexOf('Number') > -1))) {
                this.setWarningText(OpenBlock.i('不支持数字和整数类型'));
            } else {
                this.setWarningText();
            }
        }
    }
};
Blockly.Blocks['text_count'] = {
    /**
     * Block for counting how many times one string appears within another string.
     * @this {Blockly.Block}
     */
    init: function () {
        this.jsonInit({
            "message0": Blockly.Msg['TEXT_COUNT_MESSAGE0'],
            "args0": [
                {
                    "type": "input_value",
                    "name": "SUB",
                    "check": "String"
                },
                {
                    "type": "input_value",
                    "name": "TEXT",
                    "check": "String"
                }
            ],
            "output": "Integer",
            "inputsInline": true,
            "style": "text_blocks",
            "tooltip": Blockly.Msg['TEXT_COUNT_TOOLTIP'],
            "helpUrl": Blockly.Msg['TEXT_COUNT_HELPURL']
        });
    }
};

Blockly.Blocks["controls_for"] = {
    init() {
        this.jsonInit(
            {
                "type": "controls_for",
                "message0": "%{BKY_CONTROLS_FOR_TITLE}",
                "args0": [
                    {
                        "type": "field_input",
                        "name": "VAR"
                    },
                    {
                        "type": "input_value",
                        "name": "FROM",
                        "check": "Integer",
                        "align": "RIGHT"
                    },
                    {
                        "type": "input_value",
                        "name": "TO",
                        "check": "Integer",
                        "align": "RIGHT"
                    },
                    {
                        "type": "input_value",
                        "name": "BY",
                        "check": "Integer",
                        "align": "RIGHT"
                    }
                ],
                "message1": "%{BKY_CONTROLS_REPEAT_INPUT_DO} %1",
                "args1": [{
                    "type": "input_statement",
                    "name": "DO",
                    "check": "inst"
                }],
                "inputsInline": true,
                "previousStatement": "inst",
                "nextStatement": "inst",
                "style": "loop_blocks",
                "helpUrl": "%{BKY_CONTROLS_FOR_HELPURL}",
                "extensions": [
                    "contextMenu_newGetLocalVariableBlock_OB",
                    "controls_for_tooltip"
                ]
            });
    },
    onchange(e) {
        if (this.isInFlyout) {
            return;
        }
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        if (e.blockId !== this.id) {
            return;
        }
        let name = this.getFieldValue('VAR');
        if (!this.local_variable_info) {
            let info = { name, type: "Integer", blockId: this.id, sub_statement: true };
            this.local_variable_info = [info];
        } else {
            this.local_variable_info.name = name;
        }
    },
    mutationToDom() {
        let name = this.getFieldValue('VAR');
        let info = { name, type: "Integer", blockId: this.id, sub_statement: true };
        this.local_variable_info = [info];
        let dom = Blockly.utils.xml.createElement('mutation');
        let node = Blockly.utils.xml.createTextNode(name);
        dom.appendChild(node);
        return dom;
    },
    domToMutation(xml) {
        let name = xml.innerHTML;
        let info = { name, type: "Integer", blockId: this.id, sub_statement: true };
        this.local_variable_info = [info];
    },
};


/**
* Mixin to add a context menu item to create a 'variables_get' block.
* Used by blocks 'controls_for' and 'controls_forEach'.
* @mixin
* @augments Block
* @package
* @readonly
*/
const CUSTOM_CONTEXT_MENU_CREATE_LOCAL_VARIABLES_GET_MIXIN = {
    /**
     * Add context menu option to create getter block for the loop's variable.
     * (customContextMenu support limited to web BlockSvg.)
     * @param {!Array} options List of menu options to add to.
     * @this {Block}
     */
    customContextMenu: function (options) {
        if (this.isInFlyout) {
            return;
        }
        const variable = this.getField('VAR') || this.getField('NAME');
        const varName = variable.getValue();
        if (!this.isCollapsed() && varName !== null) {
            {
                const option = { enabled: true };
                option.text = Blockly.Msg['local_variable_get'].replace('%1', varName);
                let block_s = Blockly.utils.xml.createElement('block');
                block_s.setAttribute('type', 'local_variable_get');
                var f = Blockly.utils.xml.createElement('field');
                f.setAttribute('name', 'VAR');
                f.textContent = varName;
                block_s.appendChild(f);
                option.callback = Blockly.ContextMenu.callbackFactory(this, block_s);
                options.push(option);
            }
            {
                const option = { enabled: true };
                option.text = Blockly.Msg['local_variable_set'].replace('%1', varName);
                let block_s = Blockly.utils.xml.createElement('block');
                block_s.setAttribute('type', 'local_variable_set');
                var f = Blockly.utils.xml.createElement('field');
                f.setAttribute('name', 'VAR');
                f.textContent = varName;
                block_s.appendChild(f);
                option.callback = Blockly.ContextMenu.callbackFactory(this, block_s);
                options.push(option);
            }
        }
    },
};
Blockly.Extensions.registerMixin(
    'contextMenu_newGetLocalVariableBlock_OB',
    CUSTOM_CONTEXT_MENU_CREATE_LOCAL_VARIABLES_GET_MIXIN);
/**
* Mixin to add a context menu item to create a 'variables_get' block.
* Used by blocks 'controls_for' and 'controls_forEach'.
* @mixin
* @augments Block
* @package
* @readonly
*/
const CUSTOM_CONTEXT_MENU_CREATE_FSM_VARIABLES_GET_MIXIN = {
    /**
     * Add context menu option to create getter block for the loop's variable.
     * (customContextMenu support limited to web BlockSvg.)
     * @param {!Array} options List of menu options to add to.
     * @this {Block}
     */
    customContextMenu: function (options) {
        if (this.isInFlyout) {
            let self = this;
            let workspace = self.workspace.targetWorkspace;
            let o = {
                callback() {
                    let vid = self.getFieldValue('VAR');
                    let env = workspace._openblock_env;
                    if (env && env._openblock_fsm) {
                        OpenBlock.removeFSMVariableByName(env._openblock_fsm, vid, workspace);
                    }
                },
                enabled: true,
                text: "删除变量"
            };
            options.push(o);
            return;
        }
        const variable = this.getField('VAR') || this.getField('NAME');
        const varName = variable.getValue();
        if (!this.isCollapsed() && varName !== null) {
            {
                const option = { enabled: true };
                option.text = Blockly.Msg['fsm_variables_get'].replace('%1', varName).replace('%2', '');
                let block_s = Blockly.utils.xml.createElement('block');
                block_s.setAttribute('type', 'fsm_variables_get');
                var f = Blockly.utils.xml.createElement('field');
                f.setAttribute('name', 'VAR');
                f.textContent = varName;
                block_s.appendChild(f);
                option.callback = Blockly.ContextMenu.callbackFactory(this, block_s);
                options.push(option);
            }
            {
                const option = { enabled: true };
                option.text = Blockly.Msg['fsm_variables_set'].replace('%1', varName).replace('%2', '').replace('%3', '');
                let block_s = Blockly.utils.xml.createElement('block');
                block_s.setAttribute('type', 'fsm_variables_set');
                var f = Blockly.utils.xml.createElement('field');
                f.setAttribute('name', 'VAR');
                f.textContent = varName;
                block_s.appendChild(f);
                option.callback = Blockly.ContextMenu.callbackFactory(this, block_s);
                options.push(option);
            }
        }
    }
};
Blockly.Extensions.registerMixin(
    'contextMenu_newGetFSMVariableBlock_OB',
    CUSTOM_CONTEXT_MENU_CREATE_FSM_VARIABLES_GET_MIXIN);

/**
* Mixin to add a context menu item to create a 'variables_get' block.
* Used by blocks 'controls_for' and 'controls_forEach'.
* @mixin
* @augments Block
* @package
* @readonly
*/
const CUSTOM_CONTEXT_MENU_CREATE_STATE_VARIABLES_GET_MIXIN = {
    /**
     * Add context menu option to create getter block for the loop's variable.
     * (customContextMenu support limited to web BlockSvg.)
     * @param {!Array} options List of menu options to add to.
     * @this {Block}
     */
    customContextMenu: function (options) {
        if (this.isInFlyout) {
            let self = this;
            let workspace = self.workspace.targetWorkspace;
            let o = {
                callback() {
                    let vid = self.getFieldValue('VAR');
                    let env = workspace._openblock_env;
                    if (env && env._openblock_state) {
                        OpenBlock.removeStateVariableByName(env._openblock_state, vid, workspace);
                    }
                },
                enabled: true,
                text: "删除变量"
            };
            options.push(o);
            return;
        }
        const variable = this.getField('VAR') || this.getField('NAME');
        const varName = variable.getValue();
        if (!this.isCollapsed() && varName !== null) {
            {
                const option = { enabled: true };
                option.text = Blockly.Msg['state_variables_get'].replace('%1', varName).replace('%2', '');
                let block_s = Blockly.utils.xml.createElement('block');
                block_s.setAttribute('type', 'state_variables_get');
                var f = Blockly.utils.xml.createElement('field');
                f.setAttribute('name', 'VAR');
                f.textContent = varName;
                block_s.appendChild(f);
                option.callback = Blockly.ContextMenu.callbackFactory(this, block_s);
                options.push(option);
            }
            {
                const option = { enabled: true };
                option.text = Blockly.Msg['state_variables_set'].replace('%1', varName).replace('%2', '').replace('%3', '');
                let block_s = Blockly.utils.xml.createElement('block');
                block_s.setAttribute('type', 'state_variables_set');
                var f = Blockly.utils.xml.createElement('field');
                f.setAttribute('name', 'VAR');
                f.textContent = varName;
                block_s.appendChild(f);
                option.callback = Blockly.ContextMenu.callbackFactory(this, block_s);
                options.push(option);
            }
        }
    },
};
Blockly.Extensions.registerMixin(
    'contextMenu_newGetStateVariableBlock_OB',
    CUSTOM_CONTEXT_MENU_CREATE_STATE_VARIABLES_GET_MIXIN);

Blockly.Blocks["controls_whileUntil"] = {
    init() {
        this.jsonInit({
            "type": "controls_whileUntil",
            "message0": "%1 %2",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "MODE",
                    "options": [
                        ["%{BKY_CONTROLS_WHILEUNTIL_OPERATOR_WHILE}", "WHILE"],
                        ["%{BKY_CONTROLS_WHILEUNTIL_OPERATOR_UNTIL}", "UNTIL"]
                    ]
                },
                {
                    "type": "input_value",
                    "name": "BOOL",
                    "check": "Boolean"
                }
            ],
            "message1": "%{BKY_CONTROLS_REPEAT_INPUT_DO} %1",
            "args1": [{
                "type": "input_statement",
                "name": "DO",
                "check": "inst"
            }],
            "previousStatement": 'inst',
            "nextStatement": 'inst',
            "style": "loop_blocks",
            "helpUrl": "%{BKY_CONTROLS_WHILEUNTIL_HELPURL}",
            "extensions": ["controls_whileUntil_tooltip"]
        });
    }
}
Blockly.Blocks['math_arithmetic'] = {
    init() {
        this.jsonInit(
            // Block for basic arithmetic operator.
            {
                "type": "ub_math_arithmetic",
                "message0": "%1 %2 %3",
                "args0": [
                    {
                        "type": "input_value",
                        "name": "A",
                        "check": ["Number", "Integer"]
                    },
                    {
                        "type": "field_dropdown",
                        "name": "OP",
                        "options": [
                            ["%{BKY_MATH_ADDITION_SYMBOL}", "ADD"],
                            ["%{BKY_MATH_SUBTRACTION_SYMBOL}", "MINUS"],
                            ["%{BKY_MATH_MULTIPLICATION_SYMBOL}", "MULTIPLY"],
                            ["%{BKY_MATH_DIVISION_SYMBOL}", "DIVIDE"],
                            ["%{BKY_MATH_POWER_SYMBOL}", "POWER"]
                        ]
                    },
                    {
                        "type": "input_value",
                        "name": "B",
                        "check": ["Number", "Integer"]
                    }
                ],
                "inputsInline": true,
                "output": ["Integer", "Number"],
                "style": "math_blocks",
                "helpUrl": "%{BKY_MATH_ARITHMETIC_HELPURL}",
                "extensions": ["math_op_tooltip"]
            });
    },
    onchange(e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        function isInt(input) {
            if (input && input.connection.isConnected()) {
                let check = input.connection.targetConnection.check_;
                if (!check) {
                    return true;
                }
                if (check.indexOf('Integer') > -1) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        }

        let _check = this.outputConnection.getCheck()
        if (isInt(this.getInput('A')) && isInt(this.getInput('B'))) {
            if ((!_check) || _check.length !== 2) {
                this.setOutput(true, ['Integer', 'Number']);
            }
        } else {
            if ((!_check) || _check.length !== 1) {
                this.setOutput(true, ['Number'])
            }
        }
    }
}
// 兼容早期的使用方式
Blockly.Blocks['ub_math_arithmetic'] = Blockly.Blocks['math_arithmetic'];
Blockly.Blocks['text_print'] = {
    /**
     * Block for print statement.
     * @this {Blockly.Block}
     */
    init: function () {
        this.jsonInit({
            "message0": Blockly.Msg['TEXT_PRINT_TITLE'],
            "args0": [
                {
                    "type": "input_value",
                    "name": "TEXT"
                }
            ],
            "style": "text_blocks",
            "tooltip": Blockly.Msg['TEXT_PRINT_TOOLTIP'],
            "helpUrl": Blockly.Msg['TEXT_PRINT_HELPURL'],
            "nextStatement": ["inst"],
            "previousStatement": ["inst"]
        });
    },
};

Blockly.Blocks['text_log'] = {
    /**
     * Block for print statement.
     * @this {Blockly.Block}
     */
    init: function () {
        this.jsonInit({
            "message0": Blockly.Msg['TEXT_LOG'],
            "args0": [
                {
                    "type": "input_value",
                    "name": "MSG",
                    "check": 'String'
                },
                {
                    "type": "field_dropdown",
                    "name": "LEVEL",
                    "options": [
                        ["1", "1"],
                        ["2", "2"],
                        ["3", "3"],
                        ["4", "4"],
                        ["5", "5"],
                        ["6", "6"],
                        ["7", "7"],
                        ["8", "8"]
                    ]
                }
            ],
            "style": "text_blocks",
            "nextStatement": ["inst"],
            "previousStatement": ["inst"]
        });
    },
};

Blockly.Blocks["math_integer"] = {
    init: function () {
        this.jsonInit({
            "message0": "整数 %1",
            "args0": [{
                "type": "field_input",
                "name": "NUM",
            }
            ],
            "style": "struct_blocks",
            "output": ["Integer"]
        });
    },
    onchange(e) {
        if (e.blockId == this.id) {
            let input = this.getFieldValue('NUM');
            let newValue = String(parseInt(input));
            this.setFieldValue(newValue, 'NUM');
        }
    }
};
Blockly.Blocks["local_variable_create"] = {
    init: function () {
        this.jsonInit({
            "message0": "创建局部变量  %1 (%2) %3",
            "args0": [{
                "type": "field_input",
                "name": "NAME",
            },
            {
                "type": "field_label",
                "name": "TYPENAME"
            }, {
                "type": "input_value",
                "name": "VALUE",
                "check": ""
            }
            ],
            "style": "struct_blocks",
            "inputsInline": false,
            "nextStatement": ["inst"],
            "previousStatement": ["inst"],
            "extensions": [
                "contextMenu_newGetLocalVariableBlock_OB"
            ]
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
            let name = this.getFieldValue('NAME');
            if (name) {
                name = name.trim();
            }
            let target = this.getInput('VALUE').connection.targetConnection;
            if (target && name) {
                let check = target.check_;
                if (check && check.length > 0) {
                    let type = check[0];
                    if ((!this.local_variable_info) || this.local_variable_info.length == 0) {
                        this.local_variable_info = [{
                            name,
                            type: type, blockId: this.id
                        }];
                    } else if (this.local_variable_info[0].name === name && this.local_variable_info[0].type === type) {
                        if (this.getField('TYPENAME').getValue()) {
                            return;
                        }
                    } else {
                        this.local_variable_info[0].name = name;
                        this.local_variable_info[0].type = type;
                    }
                    // Blockly.Events.disable();
                    let typeinput = this.getField('TYPENAME');
                    if (typeinput) {
                        typeinput.setValue(OpenBlock.i(type));
                    }
                    this.setWarningText();
                    // Blockly.Events.enable();
                    return;
                } else {
                    this.setWarningText(OpenBlock.i('必须设置确定的变量类型'));
                    this.local_variable_info = [];
                }
            } else {
                this.setWarningText(OpenBlock.i('需要设定名称和变量值'));
                this.local_variable_info = [];
            }
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
Blockly.Blocks['local_variable_get'] = {
    init() {
        this.jsonInit({
            "type": "local_variable_get",
            "message0": Blockly.Msg["local_variable_get"],
            "style": "variable_blocks",
            "args0": [{
                "type": "dropdown_local_variables",
                "name": "VAR"
            }],
            "output": null,
            "extensions": [
                "contextMenu_newGetLocalVariableBlock_OB"
            ]
        });
    },
    onchange(e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        // if (this.timeout) {
        //     clearTimeout(this.timeout);
        // }
        // this.timeout = setTimeout(() => {
        //     this.timeout = 0;
        // if (!this.workspace) {
        //     if (this.outputConnection.getCheck()) {
        //         this.setOutput(true, null);
        //     }
        //     return;
        // }
        if (!this.getParent()) {
            if (this.outputConnection.getCheck()) {
                this.setOutput(true, null);
            }
            return;
        }
        Blockly.Events.disable();
        let f = this.getField('VAR');
        if (!f) {
            return;
        }
        OpenBlock.FieldDropdownLocalVariables.update(f);
        if (f.local_variable_info) {
            let _check = this.outputConnection.getCheck()
            if ((!_check) || _check[0] !== f.local_variable_info.type) {
                this.setOutput(true, f.local_variable_info.type);
            }
        } else {
            if (this.outputConnection.getCheck()) {
                this.setOutput(true, null);
            }
        }
        Blockly.Events.enable();
        // }, 500);
    }
};

Blockly.Blocks['local_variable_set'] = {
    init() {
        this.jsonInit({
            "type": "local_variable_set",
            "message0": "设置局部变量 %1 为 %2",
            "style": "variable_blocks",
            "args0": [{
                "type": "dropdown_local_variables",
                "name": "VAR"
            }, {
                "type": 'input_value',
                "name": "VALUE",
                "check": null
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "extensions": [
                "contextMenu_newGetLocalVariableBlock_OB"
            ]
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
            let f = this.getField('VAR');
            if (!f) {
                return;
            }
            OpenBlock.FieldDropdownLocalVariables.update(f);
            if (f.local_variable_info) {
                let type = f.local_variable_info.type;
                if (type === 'Number') {
                    this.getInput('VALUE').setCheck(['Number', 'Integer']);
                } else {
                    this.getInput('VALUE').setCheck(type);
                }
            }
            Blockly.Events.enable();
        }, 500);
    }
};

Blockly.Extensions.register('tooltip_when_inline', function () {
    this.setTooltip(function () {
        return this.getFieldValue('TEXT');
    }.bind(this));
});


(function () {
    class FieldDropdownLocalVariables extends Blockly.FieldDropdown {
        constructor(options) {
            super(FieldDropdownLocalVariables.menuGenerator, FieldDropdownLocalVariables.validator, options);
        }
        static menuGenerator() {
            let arr = this.getAvaliableVar();
            if (arr.length > 0) {
                let ret = arr.map(v => {
                    return [v.name, v.name];
                });
                ret.unshift(['', '']);
                return ret;
            } else {
                return [["", ""]];
            }
        };
        static validator(value) {
            let blk = this.getSourceBlock();
            if (blk) {
                let p;
                if (value && value.length > 0) {
                    let arr = this.getAvaliableVar();
                    p = arr.find(v => {
                        return v.name === value;
                    });
                }
                if (!p) {
                    blk.setWarningText('找不到变量 ' + value);
                    this.local_variable_info = null;
                } else {
                    this.local_variable_info = p;
                    blk.setWarningText();
                }
            }
            return value;
        }
        doClassValidation_(a) {
            return a;
        }
        getAvaliableVar() {
            let blk = this.getSourceBlock();
            if (!blk) {
                return [];
            }
            let env = (blk.workspace._openblock_env || blk.workspace.targetWorkspace._openblock_env);
            if (env && env._openblock_src) {
                let ret = OpenBlock.Blocks.getAvaliableVar(blk.getParent());
                return ret;
            }
            return [];
        };
        toXml(fieldElement) {
            fieldElement.textContent = this.getValue();
            return fieldElement;
        }
        fromXml(fieldElement) {
            this.setValue(fieldElement.textContent);
        }
        // setValue(newValue) {
        //     Blockly.Field.prototype.setValue.call(this, newValue);
        // }
        doValueUpdate_(newValue) {
            this.value_ = newValue;
            this.isDirty_ = true;
            this.selectedOption_ = [newValue, newValue];
        }
        static update(f) {
            if (!f) {
                return;
            }
            let v = f.getValue();
            f.setValue(v);
        };
        static fromJson(options) {
            return new OpenBlock.FieldDropdownLocalVariables(options);
        };

    }
    OpenBlock.FieldDropdownLocalVariables = FieldDropdownLocalVariables;
})();
Blockly.fieldRegistry.register('dropdown_local_variables', OpenBlock.FieldDropdownLocalVariables);
// 事件基础块 +++++++++++++++++
Blockly.Extensions.registerMutator('OpenBlock.Blocks.EventBaseMutator', {
    domToMutation: function (xmlDom) {
        var mutation = document.createElement('mutation');
        if (xmlDom.hasAttribute('eventname')) {
            let evtname = xmlDom.getAttribute('eventname');
            mutation.setAttribute('eventname', evtname);
            this.ub_event_name = evtname;
            let txt = Blockly.Msg[evtname] || evtname;
            this.appendDummyInput().appendField(txt);
            this.setTooltip(txt);
        }
        if (xmlDom.hasAttribute('style')) {
            let style = xmlDom.getAttribute('style');
            mutation.setAttribute('style', style);
            this.setStyle(style);
        }
        if (xmlDom.hasAttribute('colour')) {
            let colour = xmlDom.getAttribute('colour');
            mutation.setAttribute('colour', colour);
        }
        if (xmlDom.hasAttribute('argtype')) {
            let argtype = xmlDom.getAttribute('argtype');
            mutation.setAttribute('argtype', argtype);

            this.appendDummyInput().appendField(Blockly.Msg[argtype] || argtype);
        }
        this.setNextStatement(true, 'inst');
        // this.appendStatementInput('body')
        this.mutationDom = mutation;
    },
    mutationToDom: function () {
        return this.mutationDom;
    }
}, function () { });
Blockly.Blocks["on_event"] = {
    init: function () {
        Blockly.Extensions.apply('OpenBlock.Blocks.EventBaseMutator', this, true);
    }
};
OpenBlock.Blocks.EventBaseListener = function (event) {
    if (event.type === Blockly.Events.BLOCK_MOVE ||
        event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_CHANGE ||
        event.type === Blockly.Events.BLOCK_DELETE) {
        let blks = {}
        let blkArr = Blockly.Workspace.getById(event.workspaceId).getTopBlocks()
        blkArr.forEach(blk => {
            if (blk.isInsertionMarker() || blk.isInFlyout || blk.type !== 'on_event') {
                return;
            }
            if (!blks[blk.ub_event_name]) {
                blks[blk.ub_event_name] = [];
            }
            blks[blk.ub_event_name].push(blk);
        });
        for (let k in blks) {
            let a = blks[k]
            if (a.length > 1) {
                a.forEach(b => {
                    b.setWarningText(Blockly.Msg['DuplicatedEvent'], 'DuplicatedEvent');
                    b.setEnabled(false);
                })
            } else {
                a.forEach(b => {
                    b.setWarningText(null, 'DuplicatedEvent');
                    b.setEnabled(true);
                })
            }
        }
    }
};

OpenBlock.wsBuildCbs.push(s => {
    s.addChangeListener(OpenBlock.Blocks.EventBaseListener);
});

// 事件基础块 ----------------------

Blockly.Blocks["fsm_send_message"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_send_message",
            "message0": "发送消息 %1 给 %2 附加数据 %3",
            "args0": [{
                "type": "field_input",
                "name": "TITLE",
                "check": "String"
            }, {
                "type": "input_value",
                "name": "FSM",
                "check": "FSM"
            }, {
                "type": "input_value",
                "name": "ARG"
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
    }
};
Blockly.Blocks["fsm_send_dynamic_message"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_send_dynamic_message",
            "message0": "发送消息 %1 给 %2 附加数据 %3",
            "args0": [{
                "type": "input_value",
                "name": "TITLE",
                "check": "String"
            }, {
                "type": "input_value",
                "name": "FSM",
                "check": "FSM"
            }, {
                "type": "input_value",
                "name": "ARG"
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
        this.setWarningText(OpenBlock.i('逻辑分析无法跟踪动态消息，如非必要避免使用。'));
    }
};
Blockly.Blocks["fsm_send_message_after_millisecond"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_send_message_after_millisecond",
            "message0": "等待 %4 毫秒后 %5 发送消息 %1 给 %2 附加数据 %3",
            "args0": [{
                "type": "field_input",
                "name": "TITLE",
                "check": "String"
            }, {
                "type": "input_value",
                "name": "FSM",
                "check": "FSM"
            }, {
                "type": "input_value",
                "name": "ARG"
            }, {
                "type": "input_value",
                "name": "WAIT_MILLISECOND",
                "check": "Integer"
            },
            {
                "type": "input_dummy"
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
    }
};
Blockly.Blocks["fsm_broadcast_message"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_broadcast_message",
            "message0": "广播消息 %1 附加数据 %2 发送给自己 %3",
            "args0": [{
                "type": "field_input",
                "name": "TITLE",
                "check": "String"
            }, {
                "type": "input_value",
                "name": "ARG"
            }, {
                "type": "field_checkbox",
                "name": "SEND_SELF"
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
    }
};
Blockly.Blocks["fsm_broadcast_message_after_millisecond"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_broadcast_message_after_millisecond",
            "message0": "等待 %3 毫秒后 %5 广播消息 %1 附加数据 %2 发送给自己 %4",
            "args0": [{
                "type": "field_input",
                "name": "TITLE",
                "check": "String"
            }, {
                "type": "input_value",
                "name": "ARG"
            }, {
                "type": "input_value",
                "name": "WAIT_MILLISECOND",
                "check": "Integer"
            }, {
                "type": "field_checkbox",
                "name": "SEND_SELF"
            },
            {
                "type": "input_dummy"
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
    }
};
Blockly.Blocks["on_message"] = {
    init: function () {
        this.jsonInit({
            "type": "on_message",
            "message0": Blockly.Msg["on_message"],
            "args0": [{
                "type": "field_input",
                "name": "VALUE"
            }],
            "nextStatement": "inst",
            "style": "event_blocks",
            "tooltip": "",
            "helpUrl": ""
        });

    }
};
Blockly.Blocks["on_message_primary"] = {
    init: function () {
        this.jsonInit({
            "type": "on_message_primary",
            "message0": Blockly.Msg["on_message_primary"],
            "args0": [{
                "type": "field_input",
                "name": "VALUE"
            }, {
                "type": "field_dropdown_base_type",
                "name": "TYPE",
            }],
            "nextStatement": "inst",
            "style": "event_blocks",
            "tooltip": "",
            "helpUrl": ""
        });

    }
};
Blockly.Blocks["on_message_struct"] = {
    init: function () {
        this.jsonInit({
            "type": "on_message_struct",
            "message0": Blockly.Msg["on_message_struct"],
            "args0": [{
                "type": "field_input",
                "name": "VALUE"
            }, {
                "type": "field_dropdown_structs",
                "name": "TYPE",
            }],
            "nextStatement": "inst",
            "style": "event_blocks",
            "tooltip": "",
            "helpUrl": ""
        });

    }
};
Blockly.Blocks["on_message_with_arg"] = {
    init: function () {
        this.jsonInit({
            "type": "on_message_with_arg",
            "message0": Blockly.Msg["on_message_with_arg"],
            "args0": [{
                "type": "field_input",
                "name": "VALUE"
            }, {
                "type": "field_dropdown_all_type",
                "name": "TYPE",
            }],
            "nextStatement": "inst",
            "style": "event_blocks",
            "tooltip": "",
            "helpUrl": ""
        });

    }
};
Blockly.Blocks["received_message_arg"] = {
    init: function () {
        this.jsonInit({
            "type": "received_message_arg",
            "message0": Blockly.Msg["received_message_arg"],
            "args0": [{
                "type": 'field_label_serializable',
                "name": 'TYPE'
            }, {
                "type": 'field_label',
                "name": 'TYPENAME'
            }],
            "output": null
        });
    },
    onchange: function (e) {
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
            let _check = this.outputConnection.getCheck()
            let blk = this.getParent();
            if (_check && !blk) {
                this.setOutput(true);
                return;
            }
            while (blk != null) {
                let type;
                if (blk.type.startsWith('on_message')) {
                    type = blk.getFieldValue('TYPE');
                } else if (blk.type.startsWith('on_event')) {
                    type = blk.mutationDom.getAttribute('argType');
                } else {
                    blk = blk.getParent();
                    continue;
                }
                Blockly.Events.disable();
                if (type) {
                    if (_check && _check[0] === type) {

                    } else {
                        this.setOutput(true, type);
                        this.setFieldValue(type, 'TYPE');
                        this.setFieldValue(OpenBlock.i(type), 'TYPENAME');
                    }
                } else {
                    if (_check) {
                        try {
                            this.setOutput(false);
                        } catch (e) {
                            // 这里捕获的是由于用户连续操作导致已经创建连接的块马上改变输出属性
                            console.warn(e);
                        }
                    }
                    this.setFieldValue('', 'TYPE')
                }
                this.setWarningText();
                Blockly.Events.enable();
                return;
            }
            if (_check) {
                this.setOutput(true);
            }
            if (!this.warning) {
                this.setWarningText("只可在接收消息或事件时候使用");
            }
        }, 500);
    }
}
// 早期版本拼写错误
Blockly.Blocks["recived_message_arg"] = Blockly.Blocks["received_message_arg"]

Blockly.Blocks["received_message_sender"] = {
    init: function () {
        this.jsonInit({
            "type": "received_message_sender",
            "message0": "发送者",
            "output": "FSM",
            "style": "event_blocks"
        });
    },
    onchange: function (e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        let blk = this.getParent();
        while (blk != null) {
            if (blk.type.startsWith('on_message')) {
            } else {
                blk = blk.getParent();
                continue;
            }
            this.setWarningText();
            return;
        }
        this.setWarningText("只可在接收消时候使用");
    }
}
// 早期拼写错误处理
Blockly.Blocks["recived_message_sender"] = Blockly.Blocks["received_message_sender"]
// 状态切换块 +++++++++++++++

Blockly.Blocks["change_state"] = {
    init: function () {
        this.jsonInit({
            "type": "change_state",
            "message0": Blockly.Msg["change_state"],
            "args0": [{
                "type": "field_dropdown_state",
                "name": "VALUE"
            }],
            "previousStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });

    }
};
Blockly.Blocks["push_state"] = {
    init: function () {
        this.jsonInit({
            "type": "push_state",
            "message0": Blockly.Msg["push_state"],
            "args0": [{
                "type": "field_dropdown_state",
                "name": "VALUE"
            }],
            "previousStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });

    }
};
Blockly.Blocks["pop_state"] = {
    init: function () {
        this.jsonInit({
            "type": "pop_state",
            "message0": Blockly.Msg["pop_state"],
            "previousStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });

    }
};
(function () {
    class FieldDropdownState extends Blockly.FieldDropdown {

        menuGenerator() {
            let blk = this.getSourceBlock();
            if (blk) {
                let workspace = blk.workspace;
                let env = workspace._openblock_env || (workspace.targetWorkspace && workspace.targetWorkspace._openblock_env);
                if (env) {
                    let cur_fsm = env._openblock_fsm;
                    if (cur_fsm) {
                        let opt = [];
                        let i = 0;
                        cur_fsm.states.forEach(state => {
                            opt.push([state.name, '' + (state.name)]);
                        });
                        return opt;
                    } else {
                        return [['', '']];
                    }
                }
            }
            return [['', '']];
        };
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
            return new OpenBlock.FieldDropdownState(options);
        };

    }
    OpenBlock.FieldDropdownState = FieldDropdownState;
})();
Blockly.fieldRegistry.register('field_dropdown_state', OpenBlock.FieldDropdownState);

// 状态切换块 ------------------
// 状态变量 +++++

// OpenBlock.Blocks.state_variable_flyout = function (workspace) {
//     if (!workspace._openblock_env) {
//         return [];
//     }
//     var xmlList = [];
//     // 添加函数

//     var button = document.createElement('button');
//     button.setAttribute('text', '%{BKY_NEW_VARIABLE}');
//     button.setAttribute('callbackKey', 'CREATE_STATE_VARIABLE');


//     xmlList.push(button);

//     var block_s = Blockly.utils.xml.createElement('block');
//     block_s.setAttribute('type', 'state_variables_set');
//     xmlList.push(block_s);
//     var block_g = Blockly.utils.xml.createElement('block');
//     block_g.setAttribute('type', 'state_variables_get');
//     xmlList.push(block_g);

//     return xmlList;
// };
// OpenBlock.Blocks.build_state_variable_flyout = function (workspace) {
//     workspace.registerToolboxCategoryCallback('STATE_VARIABLE_DYNAMIC', OpenBlock.Blocks.state_variable_flyout);
// };

Blockly.Blocks["state_variables_get"] = {
    init: function () {
        this.jsonInit({
            "type": "state_variables_get",
            "message0": Blockly.Msg["state_variables_get"],
            "args0": [{
                "type": "field_dropdown_state_variables",
                "name": "VAR"
            },
            {
                "type": "field_label",
                "name": "TYPE"
            }],
            "output": null,
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": "",
            "extensions": [
                "contextMenu_newGetStateVariableBlock_OB"
            ]
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
                let vid = this.getFieldValue('VAR');
                let env = this.workspace._openblock_env;
                if (env && env._openblock_state) {
                    let variable = env._openblock_state.variables.find(e => e.name === vid);
                    if (variable) {
                        this.outputConnection.setCheck(variable.type);
                        // this.getInput('VALUE').setCheck(variable.type);
                    }
                }
            }, 500);
        }
    }
};
Blockly.Blocks["state_variables_set"] = {
    init: function () {
        this.jsonInit({
            "type": "state_variables_set",
            "message0": Blockly.Msg["state_variables_set"],
            "args0": [{
                "type": "field_dropdown_state_variables",
                "name": "VAR"
            }, {
                "type": "input_value",
                "name": "VALUE"
            },
            {
                "type": "field_label",
                "name": "TYPE"
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": "",
            "extensions": [
                "contextMenu_newGetStateVariableBlock_OB"
            ]
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
                let vid = this.getFieldValue('VAR');
                let env = this.workspace._openblock_env;
                if (env && env._openblock_state) {
                    let variable = env._openblock_state.variables.find(e => e.name === vid);
                    if (variable) {
                        let type = variable.type;
                        if (type === 'Number') {
                            this.getInput('VALUE').setCheck(['Number', 'Integer']);
                        } else {
                            this.getInput('VALUE').setCheck(type);
                        }
                    }
                }
            }, 500);
        }
    }
};
OpenBlock.Blocks.state_variable_flyout = function (workspace) {
    if (!(workspace._openblock_env && workspace._openblock_env._openblock_state)) {
        return [];
    }
    var xmlList = [];
    // 添加函数

    var button = document.createElement('button');
    button.setAttribute('text', '%{BKY_NEW_VARIABLE}');
    button.setAttribute('callbackKey', 'CREATE_STATE_VARIABLE');


    xmlList.push(button);


    let state = workspace._openblock_env._openblock_state;
    state.variables.forEach(v => {
        var block_s = Blockly.utils.xml.createElement('block');
        block_s.setAttribute('type', 'state_variables_set');
        var f = Blockly.utils.xml.createElement('field');
        f.setAttribute('name', 'VAR');
        f.textContent = v.name;
        block_s.appendChild(f);
        xmlList.push(block_s);
        var block_g = Blockly.utils.xml.createElement('block');
        block_g.setAttribute('type', 'state_variables_get');
        f = Blockly.utils.xml.createElement('field');
        f.setAttribute('name', 'VAR');
        f.textContent = v.name;
        block_g.appendChild(f);
        xmlList.push(block_g);
    });
    var block_s = Blockly.utils.xml.createElement('block');
    block_s.setAttribute('type', 'state_variables_set');
    xmlList.push(block_s);
    var block_g = Blockly.utils.xml.createElement('block');
    block_g.setAttribute('type', 'state_variables_get');
    xmlList.push(block_g);

    return xmlList;
};
OpenBlock.Blocks.build_state_variable_flyout = function (workspace) {
    workspace.registerToolboxCategoryCallback('STATE_VARIABLE_DYNAMIC', OpenBlock.Blocks.state_variable_flyout);
};
OpenBlock.wsBuildCbs.push(OpenBlock.Blocks.build_state_variable_flyout);
// 状态变量 -----

OpenBlock.wsBuildCbs.push(function (workspace) {
    workspace.registerButtonCallback('CREATE_STATE_VARIABLE', function (button) {
        if (typeof (OpenBlock.config.uiCallbacks.addStateVariable) === 'function') {
            let workspace = button.getTargetWorkspace();
            OpenBlock.config.uiCallbacks.addStateVariable(workspace._openblock_env._openblock_src, workspace._openblock_env._openblock_state, workspace);
        } else {
            Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
        }
    });
});

(function () {
    class FieldDropdownSTATEVariables extends Blockly.FieldDropdown {
        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            var options = this.getOptions(true);
            for (var i = 0, option; (option = options[i]); i++) {
                if (option[1] === newValue) {
                    this.selectedOption_ = option;
                    let blk = this.getSourceBlock();
                    if (blk) {
                        blk.setWarningText();
                        let workspace = blk.workspace;
                        let env = workspace._openblock_env || (workspace.targetWorkspace && workspace.targetWorkspace._openblock_env);
                        if (env) {
                            let cur_fsm = env._openblock_state;
                            if (cur_fsm) {
                                for (let k in cur_fsm.variables) {
                                    let v = cur_fsm.variables[k];
                                    if (v.name === newValue) {
                                        let typeinput = blk.getField('TYPE');
                                        if (typeinput) {
                                            typeinput.setValue(OpenBlock.i(v.type));
                                        }
                                        if (blk.outputConnection) {
                                            blk.outputConnection.setCheck(v.type)
                                        }
                                        let valueInput = blk.getInput('VALUE');
                                        if (valueInput) {
                                            valueInput.setCheck(v.type);
                                        }
                                        break;
                                    }
                                }
                            }
                        }
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
        }
        menuGenerator() {
            let blk = this.getSourceBlock();
            if (blk) {
                let workspace = blk.workspace;
                let env = workspace._openblock_env || (workspace.targetWorkspace && workspace.targetWorkspace._openblock_env);
                if (env) {
                    let cur_state = env._openblock_state;
                    if (cur_state) {
                        let opt = [];
                        let i = 0;
                        cur_state.variables.forEach(state => {
                            opt.push([state.name, state.name]);
                        });
                        return opt;
                    } else {
                        return [['', '']];
                    }
                }
            }
            return [['', '']];
        };
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
            return new OpenBlock.FieldDropdownSTATEVariables(options);
        };
    }
    OpenBlock.FieldDropdownSTATEVariables = FieldDropdownSTATEVariables;
})();

Blockly.fieldRegistry.register('field_dropdown_state_variables', OpenBlock.FieldDropdownSTATEVariables);

// 状态机变量 ++++++++++++++++++++

Blockly.Blocks["fsm_variables_get"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_variables_get",
            "message0": Blockly.Msg["fsm_variables_get"],
            "args0": [{
                "type": "field_dropdown_fsm_variables",
                "name": "VAR"
            },
            {
                "type": "field_label",
                "name": "TYPE"
            }],
            "output": null,
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": "",
            "extensions": [
                "contextMenu_newGetFSMVariableBlock_OB"
            ]
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
                let vid = this.getFieldValue('VAR');
                let env = this.workspace._openblock_env;
                if (env && env._openblock_fsm) {
                    let variable = env._openblock_fsm.variables.find(e => e.name === vid);
                    if (variable) {
                        this.outputConnection.setCheck(variable.type);
                        this.setWarningText();
                    } else {
                        this.setWarningText("变量不存在");
                    }
                }
            }, 500);
        }
    }
};

Blockly.Blocks["fsm_variables_set"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_variables_set",
            "message0": Blockly.Msg["fsm_variables_set"],
            "args0": [{
                "type": "field_dropdown_fsm_variables",
                "name": "VAR"
            }, {
                "type": "input_value",
                "name": "VALUE"
            },
            {
                "type": "field_label",
                "name": "TYPE"
            }],
            "previousStatement": "inst",
            "nextStatement": "inst",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": "",
            "extensions": [
                "contextMenu_newGetFSMVariableBlock_OB"
            ]
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
                let vid = this.getFieldValue('VAR');
                let env = this.workspace._openblock_env;
                if (env && env._openblock_fsm) {
                    let variable = env._openblock_fsm.variables.find(e => e.name === vid);
                    if (variable) {
                        let input = this.getInput('VALUE');
                        let _check = input.connection.getCheck();
                        let type = variable.type;
                        if (_check && _check[0] === type) {
                            return;
                        }
                        if (type === 'Number') {
                            input.setCheck(['Number', 'Integer']);
                        } else {
                            input.setCheck(type);
                        }
                        this.setWarningText();
                    } else {
                        if (!this.warning) {
                            this.setWarningText("变量不存在");
                        }
                    }
                }
            }, 500);
        }
    }
};
OpenBlock.Blocks.fsm_variable_flyout = function (workspace) {
    if (!(workspace._openblock_env && workspace._openblock_env._openblock_fsm)) {
        return [];
    }
    var xmlList = [];
    // 添加函数

    var button = document.createElement('button');
    button.setAttribute('text', '%{BKY_NEW_VARIABLE}');
    button.setAttribute('callbackKey', 'CREATE_FSM_VARIABLE');


    xmlList.push(button);
    let fsm = workspace._openblock_env._openblock_fsm;
    fsm.variables.forEach(v => {
        var block_s = Blockly.utils.xml.createElement('block');
        block_s.setAttribute('type', 'fsm_variables_set');
        var f = Blockly.utils.xml.createElement('field');
        f.setAttribute('name', 'VAR');
        f.textContent = v.name;
        block_s.appendChild(f);
        xmlList.push(block_s);
        var block_g = Blockly.utils.xml.createElement('block');
        block_g.setAttribute('type', 'fsm_variables_get');
        f = Blockly.utils.xml.createElement('field');
        f.setAttribute('name', 'VAR');
        f.textContent = v.name;
        block_g.appendChild(f);
        xmlList.push(block_g);
    });
    var block_s = Blockly.utils.xml.createElement('block');
    block_s.setAttribute('type', 'fsm_variables_set');
    xmlList.push(block_s);
    var block_g = Blockly.utils.xml.createElement('block');
    block_g.setAttribute('type', 'fsm_variables_get');
    xmlList.push(block_g);

    return xmlList;
};
OpenBlock.Blocks.build_fsm_variable_flyout = function (workspace) {
    workspace.registerToolboxCategoryCallback('FSM_VARIABLE_DYNAMIC', OpenBlock.Blocks.fsm_variable_flyout);
};
OpenBlock.wsBuildCbs.push(OpenBlock.Blocks.build_fsm_variable_flyout);

OpenBlock.wsBuildCbs.push(function (workspace) {
    workspace.registerButtonCallback('CREATE_FSM_VARIABLE', function (button) {
        let workspace = button.getTargetWorkspace();
        if (typeof (OpenBlock.config.uiCallbacks.addFsmVariable) === 'function') {
            OpenBlock.config.uiCallbacks.addFsmVariable(workspace._openblock_env._openblock_src, workspace._openblock_env._openblock_fsm, workspace);
        } else {
            Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
        }
    });
});


(function () {
    class FieldDropdownFSMVariables extends Blockly.FieldDropdown {
        menuGenerator() {
            let blk = this.getSourceBlock();
            if (blk) {
                let workspace = blk.workspace;
                let env = workspace._openblock_env || (workspace.targetWorkspace && workspace.targetWorkspace._openblock_env);
                if (env) {
                    let cur_fsm = env._openblock_fsm;
                    if (cur_fsm) {
                        let opt = [];
                        cur_fsm.variables.forEach(state => {
                            opt.push([state.name, state.name]);
                        });
                        return opt;
                    } else {
                        return [['', '']];
                    }
                }
            }
            return [['', '']];
        }
        // doClassValidation_(a) {
        //     return a;
        // }
        doValueUpdate_(newValue) {
            super.doValueUpdate_(newValue);
            var options = this.getOptions(true);
            for (var i = 0, option; (option = options[i]); i++) {
                if (option[1] === newValue) {
                    this.selectedOption_ = option;
                    let blk = this.getSourceBlock();
                    if (blk) {
                        blk.setWarningText();
                        let workspace = blk.workspace;
                        let env = workspace._openblock_env || (workspace.targetWorkspace && workspace.targetWorkspace._openblock_env);
                        if (env) {
                            let cur_fsm = env._openblock_fsm;
                            if (cur_fsm) {
                                for (let k in cur_fsm.variables) {
                                    let v = cur_fsm.variables[k];
                                    if (v.name === newValue) {
                                        let typeinput = blk.getField('TYPE');
                                        if (typeinput) {
                                            typeinput.setValue(OpenBlock.i(v.type));
                                        }
                                        if (blk.outputConnection) {
                                            blk.outputConnection.setCheck(v.type)
                                        }
                                        let valueInput = blk.getInput('VALUE');
                                        if (valueInput) {
                                            valueInput.setCheck(v.type);
                                        }
                                        this.value_ = newValue;
                                        break;
                                    }
                                }
                            }
                        }
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
            return new OpenBlock.FieldDropdownFSMVariables(options);
        };
    }
    OpenBlock.FieldDropdownFSMVariables = FieldDropdownFSMVariables;
})();


Blockly.fieldRegistry.register('field_dropdown_fsm_variables', OpenBlock.FieldDropdownFSMVariables);
// 状态机变量 ---------------------

Blockly.Blocks['empty_provider'] = {
    init: function () {
        this.jsonInit({
            "style": "variable_blocks",
            "output": "String"
        });
    },
    mutationToDom() {
        let dom = Blockly.utils.xml.createElement('mutation');
        let node = Blockly.utils.xml.createTextNode(this.mutation);
        dom.appendChild(node);
        return dom;
    },
    domToMutation(xml) {
        if (xml && xml.textContent) {
            this.mutation = xml.textContent;
            this.updateBlock();
        }
    },
    updateBlock() {
        let mutationData = JSON.parse(decodeURI(this.mutation), Deserializer);
        let parentType = mutationData.parentType;
        let arg = mutationData.argName;
        let blkprovider = OpenBlock.NativeBlockProviderConfig[parentType];
        if (blkprovider) {
            /**
             * @type {OB_DropdownProvider}
             */
            let provider = blkprovider[arg];
            if (provider) {
                this.setOutput(true, mutationData.checkType);
                let subinput = this.appendDummyInput();
                subinput.appendField(new Blockly.FieldDropdown(provider.options), 'VALUE');
            } else {
                console.warn('找不到本地块供给 ' + parentType + ":" + arg);
            }
        } else {
            console.warn('找不到本地块供给 ' + parentType);
        }
    }
};
// 状态机控制 ++++++++++++++++++++

Blockly.Blocks['fsm_provider'] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_provider",
            "message0": "%1",
            "args0": [{
                "type": "field_dropdown_fsm_list",
                "name": "FSM"
            }],
            "output": "String",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
    }
};
Blockly.Blocks["fsm_create"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_create",
            "message0": Blockly.Msg["fsm_create"],
            "args0": [{
                "type": "field_dropdown_fsm_list",
                "name": "FSM"
            }],
            "output": "FSM",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
    }
};
Blockly.Blocks["find_fsm_by_type"] = {
    init: function () {
        this.jsonInit({
            "type": "find_fsm_by_type",
            "message0": Blockly.Msg["find_fsm_by_type"],
            "args0": [{
                "type": "field_dropdown_fsm_list",
                "name": "FSM"
            }],
            "output": "list<FSM>",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
    }
};
Blockly.Blocks["fsm_create_unnamed"] = {
    init: function () {
        this.jsonInit({
            "type": "fsm_create_unnamed",
            "message0": Blockly.Msg["fsm_create_unnamed"],
            "output": "String",
            "style": "control_blocks",
            "tooltip": "",
            "helpUrl": ""
        });
    }
};
(function () {
    class FieldDropdownFSMList extends Blockly.FieldDropdown {
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
                blk.setWarningText('找不到状态机 ' + newValue);
            }
        }

        menuGenerator() {
            let blk = this.getSourceBlock();
            if (!blk) {
                return [['', '']];
            }
            let env = this.getSourceBlock().workspace._openblock_env;
            if (!env) {
                return [['', '']];
            }
            let list = [];
            let modName = env._openblock_src.name;
            let node = OpenBlock.BlocklyParser.loadedFiles.dependingTree.nodeGraph[modName];
            let depends;
            if (node) {
                depends = [modName].concat(node.out);
            } else {
                depends = [modName];
            }
            OpenBlock.BlocklyParser.loadedFiles.analyzedModules.forEach(m => {
                if (depends.indexOf(m.name) == -1) {
                    return;
                }
                m.fsms.forEach(fsm => {
                    let name = m.name + "." + fsm.name;
                    list.push([name, name]);
                });
            });
            if (list.length === 0) {
                list.push(["", ""]);
            }
            return list;
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
            return new OpenBlock.FieldDropdownFSMList(options);
        };
    }
    OpenBlock.FieldDropdownFSMList = FieldDropdownFSMList;
})();

Blockly.fieldRegistry.register('field_dropdown_fsm_list', OpenBlock.FieldDropdownFSMList);
// 状态机控制 ---------------------

// Blockly.Blocks["sort"] // TODO

Blockly.Blocks['native_call'] = {
    init() {
        this.setStyle("native_call");
    },
    mutationToDom() {
        let dom = Blockly.utils.xml.createElement('mutation');
        let node = Blockly.utils.xml.createTextNode(this.mutation);
        dom.appendChild(node);
        return dom;
    },
    domToMutation(xml) {
        if (xml && xml.textContent) {
            this.mutation = xml.textContent;
            this.mutationData = JSON.parse(decodeURI(this.mutation), Deserializer);
            this.appendDummyInput().appendField(OpenBlock.i(this.mutationData.func.fullname)
                + (this.mutationData.func.returnType ? (":" + OpenBlock.i(this.mutationData.func.returnType.toCodeText())) : ""));
            this.updateBlock();
        }
    },
    getConfig(fieldName) {
        let b = OpenBlock.NativeBlockProviderConfig[this.mutationData.func.fullname];
        if (b) {
            return b[fieldName];
        }
    },
    updateBlock() {
        let func = OpenBlock.nativefunctions.check(this.mutationData.func, false);
        if (func) {
            this.mutationData.func = func;
            this.setWarningText();
        } else {
            func = this.mutationData.func;
            this.setWarningText("函数库已经发生改变，请用其他块替代");
        }
        let block = this;
        Blockly.Events.disable();
        if (func.returnType && !this.mutationData.ignoreReturnValue) {
            if (block.nextConnection && block.nextConnection.isConnected()) {
                block.nextConnection.disconnect();
            }
            block.setNextStatement(false);
            if (block.previousConnection && block.previousConnection.isConnected()) {
                block.previousConnection.disconnect();
            }
            block.setPreviousStatement(false);
            block.setOutput(true, func.returnType.toCodeText());
        } else {
            if (block.outputConnection && block.outputConnection.isConnected()) {
                block.outputConnection.disconnect();
            }
            block.setOutput(false);
            block.setNextStatement(true, 'inst');
            block.setPreviousStatement(true, 'inst');
        }
        for (let i = 0; i < func.args.length; i++) {
            let input = block.inputList[1 + i];
            let arg = func.args[i];
            let type;
            let checkType;
            if (arg.type) {
                if (!arg.type.toCodeText) {
                    debugger
                }
                type = arg.type.toCodeText();
                checkType = type;
                if (checkType == 'Number') {
                    checkType = ['Number', 'Integer'];
                }
            }
            if (input) {
                input.fieldRow[0].setValue(OpenBlock.i(arg.name) + ":" + OpenBlock.i(type));
                input.setCheck(checkType);
            }
            else {
                let name = arg.name;
                let input = block.appendValueInput(name);
                input.setAlign(Blockly.ALIGN_RIGHT).setCheck(checkType);
                input.appendField(OpenBlock.i(arg.name) + ":" + OpenBlock.i(type));
                if (!input.connection.isConnected() && this.workspace.isFlyout) {
                    let conf = this.getConfig(name);
                    if (conf) {
                        let blk = conf.makeBlock(this.workspace, type, name, input);
                        blk.setShadow(true);
                        input.connection.connect(blk.outputConnection);
                    }
                }
            }
        }
        while (block.inputList.length > func.args.length + 1) {
            let input = block.inputList[block.inputList.length - 1];
            if (input.connection && input.connection.isConnected()) {
                input.connection.disconnect();
            }
            block.removeInput(input.name);
        }
        Blockly.Events.enable();
    }
};

(function () {
    let types = {
        "Character Keys": [
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "0",
            "`", "~", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "=", "_", "+", "[", "]", "{", "}", ";", ":", "\"", "'", ",", ".", "<", ">", "/", "?"],
        "Modifier Keys": ["Alt", "AltGraph", "CapsLock", "Control", "Fn", "FnLock", "Hyper", "Meta", "NumLock", "ScrollLock", "Shift", "Super", "Symbol",
            "SymbolLock",
        ],
        "Whitespace Keys": ["Enter", "Tab", " "],
        "Navigation Keys": ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home", "PageDown", "PageUp"],
        "Editing Keys": ["Backspace", "Clear", "Copy", "CrSel", "Cut", "Delete", "EraseEof", "ExSel", "Insert", "Paste", "Redo", "Undo"],
        "UI Keys": [
            "Accept", "Again ", "Attn ", "Cancel ", "ContextMenu ", "Escape ", "Execute ", "Find ",
            "Finish ", "Help ", "Pause ", "Play ", "Props ", "Select ", "ZoomIn ", "ZoomOut"
        ],
        "Device Keys": ["BrightnessDown", "BrightnessUp", "Eject", "LogOff", "Power", "PowerOff", "PrintScreen", "Hibernate", "Standby", "WakeUp"],
        "IME and Composition Keys": [
            "AllCandidates", "Alphanumeric", "CodeInput", "Compose", "Convert", "Dead", "FinalMode", "GroupFirst", "GroupLast",
            "GroupNext", "GroupPrevious", "ModeChange", "NextCandidate", "NonConvert", "PreviousCandidate", "Process", "SingleCandidate"
        ],
        "Function Keys": [
            "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20",
            "Soft1", "Soft2", "Soft3", "Soft4"
        ],
        "Phone Keys": [
            "AppSwitch", "Call", "Camera", "CameraFocus", "EndCall", "GoBack", "GoHome", "HeadsetHook", "LastNumberRedial", "Notification", "MannerMode", "VoiceDial",
        ],
        "Multimedia Keys": ["ChannelDown", "ChannelUp", "MediaFastForward", "MediaPause", "MediaPlay", "MediaPlayPause", "MediaRecord", "MediaRewind",
            "MediaTrackNext", "MediaTrackPrevious"],
        "Audio Control Keys": ["AudioBalanceLeft", "AudioBalanceRight", "AudioBassDown", "AudioBassBoostDown", "AudioBassBoostToggle", "AudioBassBoostUp",
            "AudioBassUp", "AudioFaderFront", "AudioFaderRear", "AudioSurroundModeNext", "AudioTrebleDown", "AudioTrebleUp", "AudioVolumeDown", "AudioVolumeMute",
            "AudioVolumeUp", "MicrophoneToggle", "MicrophoneVolumeDown", "MicrophoneVolumeMute", "MicrophoneVolumeUp"],
        "TV Control Keys": ["TV", "TV3DMode", "TVAntennaCable", "TVAudioDescription", "TVAudioDescriptionMixDown", "TVAudioDescriptionMixUp", "TVContentsMenu",
            "TVDataService", "TVInput", "TVInputComponent1", "TVInputComponent2", "TVInputComposite1", "TVInputComposite2", "TVInputHDMI1", "TVInputHDMI2", "TVInputHDMI3",
            "TVInputHDMI4", "TVInputVGA1", "TVMediaContext", "TVNetwork", "TVNumberEntry", "TVPower", "TVRadioService", "TVSatellite", "TVSatelliteBS", "TVSatelliteCS",
            "TVSatelliteToggle", "TVTerrestrialAnalog", "TVTerrestrialDigital", "TVTimer"],
        "Media Controller Keys": ["AVRInput", "AVRPower", "ColorF0Red", "ColorF1Green", "ColorF2Yellow", "ColorF3Blue", "ColorF4Grey", "ColorF5Brown",
            "ClosedCaptionToggle", "Dimmer", "DisplaySwap", "DVR", "Exit", "FavoriteClear0", "FavoriteClear1", "FavoriteClear2", "FavoriteClear3", "FavoriteRecall0",
            "FavoriteRecall1", "FavoriteRecall2", "FavoriteRecall3", "FavoriteStore0", "FavoriteStore1", "FavoriteStore2", "FavoriteStore3", "Guide",
            "GuideNextDay", "GuidePreviousDay", "Info", "InstantReplay", "Link", "ListProgram", "LiveContent", "Lock", "MediaApps", "MediaAudioTrack", "MediaLast",
            "MediaSkipBackward", "MediaSkipForward", "MediaStepBackward", "MediaStepForward", "MediaTopMenu", "NavigateIn", "NavigateNext", "NavigateOut",
            "NavigatePrevious", "NextFavoriteChannel", "NextUserProfile", "OnDemand", "Pairing", "PinPDown", "PinPMove", "PinPToggle", "PinPUp", "PlaySpeedDown",
            "PlaySpeedReset", "PlaySpeedUp", "RandomToggle", "RcLowBattery", "RecordSpeedNext", "RfBypass", "ScanChannelsToggle", "ScreenModeNext", "Settings",
            "SplitScreenToggle", "STBInput", "STBPower", "Subtitle", "Teletext", "VideoModeNext", "Wink", "ZoomToggle"],
        "Speech Recognition Keys": ["SpeechCorrectionList", "SpeechInputToggle"],
        "Document Keys": ["Close", "New", "Open", "Print", "Save", "SpellCheck", "MailForward", "MailReply", "MailSend"],
        "Application Selector Keys": ["LaunchCalculator", "LaunchCalendar", "LaunchContacts", "LaunchMail", "LaunchMediaPlayer", "LaunchMusicPlayer", "LaunchMyComputer",
            "LaunchPhone", "LaunchScreenSaver", "LaunchSpreadsheet", "LaunchWebBrowser", "LaunchWebCam", "LaunchWordProcessor", "LaunchApplication1", "LaunchApplication2",
            "LaunchApplication2", "LaunchApplication3", "LaunchApplication4", "LaunchApplication5", "LaunchApplication6", "LaunchApplication7", "LaunchApplication8",
            "LaunchApplication9", "LaunchApplication10", "LaunchApplication11", "LaunchApplication12", "LaunchApplication13", "LaunchApplication14", "LaunchApplication15", "LaunchApplication16"],
        "Browser Control Keys": ["BrowserBack", "BrowserFavorites", "BrowserForward", "BrowserHome", "BrowserRefresh", "BrowserSearch", "BrowserStop"],
        "Numeric Keypad Keys": ["Key11", "Key12", "Clear"],
        "Special Values": ["Unidentified"],
    };
    let typemap = {};
    for (let k in types) {
        let arr = types[k];
        typemap[k] = arr.map(i => [i, i]);
    }
    let allValue = [];
    for (let k in types) {
        let arr = types[k];
        allValue = allValue.concat(arr.map(i => [i, i]));
    }

    let typenames = Object.keys(types).map(t => [OpenBlock.i(t), t]);
    Blockly.Blocks['text_key_value'] = {
        init() {
            this.jsonInit({
                "message0": Blockly.Msg['TEXT_KEY_VALUE'],
                "args0": [
                    {
                        "type": "field_dropdown",
                        "name": "TYPE",
                        "options": typenames
                    },
                    {
                        "type": "field_dropdown",
                        "name": "VALUE",
                        "options": allValue//this.menu.bind(this)
                    }
                ],
                "style": "text_blocks",
                "output": "String",
            });
        },
        menu() {
            let keytype = this.getFieldValue('TYPE')
            let values = typemap[keytype || "Character Keys"];
            if (values && values.length > 0) {
                return values;
            }
            return [["", ""]]
        },
        onchange(e) {
            if (e.blockId === this.id
                && e.type === 'change'
                && e.name === 'TYPE') {
                let values = types[e.newValue];
                if (!values) {
                    this.setFieldValue("Character Keys", 'TYPE');
                    values = typemap["Character Keys"];
                }
                let value = this.getFieldValue('VALUE');
                let valueField = this.getField('VALUE');
                valueField.menuGenerator_ = typemap[e.newValue];
                if (!value || values.indexOf(value) == -1) {
                    if (values.length == 0) {
                        this.setFieldValue("", 'VALUE');
                    } else {
                        this.setFieldValue(values[0], 'VALUE');
                    }
                }
            }
        }
    };
})();


/**
 * Adds dynamic type validation for the left and right sides of a logic_compare
 * block.
 * @mixin
 * @augments Block
 * @readonly
 */
const LOGIC_COMPARE_ONCHANGE_MIXIN = {
    /**
     * Called whenever anything on the workspace changes.
     * Prevent mismatched types from being compared.
     * @param {!AbstractEvent} e Change event.
     * @this {Block}
     */
    onchange: function (e) {
        if (OpenBlock.Utils.canBlockEventSkipSave(e)) {
            return;
        }
        if (!this.prevBlocks_) {
            this.prevBlocks_ = [null, null];
        }
        if (this.workspace.isFlyout) {
            return;
        }
        const blockA = this.getInputTargetBlock('A');
        const blockB = this.getInputTargetBlock('B');
        // Disconnect blocks that existed prior to this change if they don't match.
        if (blockA && blockB &&
            !this.workspace.connectionChecker.doTypeChecksWithNumberType(
                blockA.outputConnection, blockB.outputConnection)) {
            // Mismatch between two inputs.  Revert the block connections,
            // bumping away the newly connected block(s).
            Blockly.Events.setGroup(e.group);
            const prevA = this.prevBlocks_[0];
            if (prevA !== blockA) {
                blockA.unplug();
                if (prevA && !prevA.isDisposed() && !prevA.isShadow()) {
                    // The shadow block is automatically replaced during unplug().
                    this.getInput('A').connection.connect(prevA.outputConnection);
                }
            }
            const prevB = this.prevBlocks_[1];
            if (prevB !== blockB) {
                blockB.unplug();
                if (prevB && !prevB.isDisposed() && !prevB.isShadow()) {
                    // The shadow block is automatically replaced during unplug().
                    this.getInput('B').connection.connect(prevB.outputConnection);
                }
            }
            this.bumpNeighbours();
            Blockly.Events.setGroup(false);
        }
        this.prevBlocks_[0] = this.getInputTargetBlock('A');
        this.prevBlocks_[1] = this.getInputTargetBlock('B');
    },
};

/**
 * "logic_compare" extension function. Adds type left and right side type
 * checking to "logic_compare" blocks.
 * @this {Block}
 * @readonly
 */
const LOGIC_COMPARE_EXTENSION = function () {
    // Add onchange handler to ensure types are compatible.
    this.mixin(LOGIC_COMPARE_ONCHANGE_MIXIN);
};

Blockly.Extensions.unregister('logic_compare');
Blockly.Extensions.register('logic_compare', LOGIC_COMPARE_EXTENSION);


Blockly.Blocks["logic_operation_ext"] = {
    init() {
        this.jsonInit(
            // Block for logical operations: 'and', 'or'.
            {
                'type': 'logic_operation',
                'message0': '%1',
                'args0': [
                ],
                'inputsInline': true,
                'output': 'Boolean',
                'style': 'logic_blocks',
                'helpUrl': '%{BKY_LOGIC_OPERATION_HELPURL}',
                // 'extensions': ['logic_op_tooltip'],
            });

    },
    // mutationToDom() {
    //     let dom = Blockly.utils.xml.createElement('mutation');
    //     let node = Blockly.utils.xml.createTextNode(this.mutation);
    //     dom.appendChild(node);
    //     return dom;
    // },
    // domToMutation(xml) {
    //     if (xml && xml.textContent) {
    //         this.mutation = xml.textContent;
    //         this.mutationData = JSON.parse(decodeURI(this.mutation), Deserializer);
    //         this.appendDummyInput().appendField(OpenBlock.i(this.mutationData.func.fullname)
    //             + (this.mutationData.func.returnType ? (":" + OpenBlock.i(this.mutationData.func.returnType.toCodeText())) : ""));
    //         this.updateBlock();
    //     }
    // }
};