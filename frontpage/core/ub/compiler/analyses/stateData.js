/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

class StateAnalysesResultModule {
    /**
     * @type {String}
     */
    name;
    /**
     * @type {Object.<string,StateAnalysesResultFSM>}
     */
    fsm = {};
}
Serializable(StateAnalysesResultModule);
class StateAnalysesResultFSM {
    /**
     * @type {String}
     */
    name;
    /**
     * @type {Object<String,StateAnalysesResultState>}
     */
    states = {}
}
Serializable(StateAnalysesResultFSM);
class StateAnalysesResultState {
    /**
     * @type {String}
     */
    name;
    /**
     * @type {StateAnalysesResultFunction[]}
     */
    function = [];
    /**
     * @type {StateAnalysesResultEventHandler[]}
     */
    event = [];
    /**
     * @type {StateAnalysesResultMessageHandler[]}
     */
    message = [];
    /**
     * 在handler里或直接、间接调用function中跳转的目标状态
     * @type {string[]}
     */
    relevantStates = [];
    /**
     * @type {Boolean} 是否可能回退状态
     */
    popBack = false;
}
Serializable(StateAnalysesResultState);
class StateAnalysesResultFunction {
    /**
     * @type {String}
     */
    name;
    /**
     * @type {ChangeState[]}
     */
    targetStates = [];
    /**
     * @type {StateAnalysesResultFunction[]}
     */
    targetFunc = [];
    /**
     * @type {Boolean} 是否可能回退状态
     */
    popBack = false;
    type() { return 'function'; }
}
Serializable(StateAnalysesResultFunction);
class StateAnalysesResultEventHandler {
    /**
     * @type {String}
     */
    name;
    /**
     * 在handler里直接跳转
     * @type {ChangeState[]}
     */
    targetStates = [];
    /**
     * 在handler里或直接、间接调用function中跳转的目标状态
     * @type {string[]}
     */
    relevantStates = [];
    /**
     * @type {StateAnalysesResultFunction[]}
     */
    targetFunc = [];
    type() { return 'event'; }
}
Serializable(StateAnalysesResultEventHandler);
class StateAnalysesResultMessageHandler {
    /**
     * @type {String}
     */
    name;
    /**
     * @type {ChangeState[]}
     */
    targetStates = [];
    /**
     * 在handler里或直接、间接调用function中跳转的目标状态
     * @type {string[]}
     */
    relevantStates = [];
    /**
     * @type {StateAnalysesResultFunction[]}
     */
    targetFunc = [];
    type() { return 'message'; }
}
Serializable(StateAnalysesResultMessageHandler);