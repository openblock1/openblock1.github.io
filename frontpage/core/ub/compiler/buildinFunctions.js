/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

OpenBlock.buildinFunctionJson([
    {
        method_name: 'FSM_findFsmByType',
        arguments: [{ type: 'String', name: 'typeName' }],
        returnType: 'list<FSM>'
    },
    {
        method_name: 'Struct_countInDataset',
        arguments: [{ type: 'String', name: 'type' }],
        returnType: 'Integer'
    },
    {
        method_name: 'Struct_loadStructFromDataset',
        arguments: [{ type: 'String', name: 'type' }, { type: 'Integer', name: 'id' }],
        returnType: 'object'
    },
    {
        method_name: 'Text_Length',
        arguments: [{ type: 'String', name: 'str' }],
        returnType: 'Integer'
    },
    {
        method_name: 'Text_IsEmpty',
        arguments: [{ type: 'String', name: 'str' }],
        returnType: 'Boolean'
    },
    {
        method_name: 'Text_IndexOf',
        arguments: [{ type: 'String', name: 'str' }, { type: 'String', name: 'sub' }, { type: 'Boolean', name: 'forward' }],
        returnType: 'Integer'
    },
    {
        method_name: 'Text_CharAt',
        arguments: [{ type: 'String', name: 'str' }, { type: 'Integer', name: 'at' }],
        returnType: 'String'
    },
    {
        method_name: 'Text_GetSubstring',
        arguments: [{ type: 'String', name: 'str' }, { type: 'Integer', name: 'from' }, { type: 'Integer', name: 'to' }],
        returnType: 'String'
    },
    {
        method_name: 'Text_ToUpperCase',
        arguments: [{ type: 'String', name: 'str' }],
        returnType: 'String'
    },
    {
        method_name: 'Text_ToLowerCase',
        arguments: [{ type: 'String', name: 'str' }],
        returnType: 'String'
    },
    {
        method_name: 'Text_ToTitleCase',
        arguments: [{ type: 'String', name: 'str' }],
        returnType: 'String'
    },
    {
        method_name: 'Text_Count',
        arguments: [{ type: 'String', name: 'str' }, { type: 'String', name: 'sub' }],
        returnType: 'Integer'
    },
    {
        method_name: 'Text_Replace',
        arguments: [{ type: 'String', name: 'text' }, { type: 'String', name: 'from' }, { type: 'String', name: 'to' }],
        returnType: 'String'
    },
    {
        method_name: 'Text_Reverse',
        arguments: [{ type: 'String', name: 'str' }],
        returnType: 'String'
    },
    {
        method_name: 'SYS_LOG',
        arguments: [{ type: 'String', name: 'msg' }, { type: 'Integer', name: 'level' }],
        returnType: 'String'
    },
    {
        method_name: 'math_text_to_integer',
        arguments: [{ type: 'String', name: 'text' }],
        returnType: 'Integer'
    },
    {
        method_name: 'math_text_to_number',
        arguments: [{ type: 'String', name: 'text' }],
        returnType: 'Number'
    },
]);