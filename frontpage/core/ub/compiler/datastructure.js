/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

OpenBlock.DataStructure = {
    createModuleTemplate() {
        return {
            "formatVersion": 1,
            "fsms": [],
            "structs": [],
            "functions": [],
            "depends": [],
            "type": "src",
            "typeLimit": "",
            "comment": ""
        };
    },

    createFSMTemplate() {
        return {
            "variables": [
                //     {
                //     "sn": OpenBlock.Utils.makeSN(),
                //     "name": "变量",
                //     "type": "Number",
                //     "export": false
                // }
            ],
            "startState": 0,
            "states": [],
            "function": [],
            // "typeLimit":"",
            "comment": "状态机",
            "type": "fsm"
        };
    }
    , createStateTemplate() {
        return {
            "code": "",
            "comment": "状态",
            "variables": [],
            "type": "state"
        };
    }
    , createStructTemplate() {
        return {
            "code": "",
            "comment": "数据",
            "type": "struct"
        };
    }
    , createFunctionTemplate() {
        return {
            "code": "",
            "comment": "函数",
            "type": "function"
        };
    }
}