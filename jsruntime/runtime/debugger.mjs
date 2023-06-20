/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
import * as obvm from './vm.mjs'
/**
 * debugger连接器，实际应用场景应该实现子类
 */
class DebuggerBroker {
    onEvent(eventName, block, args, level, stack) { }
}
class Debugger {
    /**
     * 
     * @param {connector:DebuggerConnector} options 
     */
    constructor(options) {
        this.options = options || {};
        this.instructionCount = 0;
        this.logLevel = 5;
        this.logFilter = false;
    }
    static pausableInstructionWrap(instruction) {
        return function (st) {
            if (st.fsm.VM.pausing) {
                st.fsm.VM.pausing = false;
                throw new obvm.VMPausedException();
            }
            return instruction.apply(null, arguments)
        };
    }
    instructionWrap(instruction) {
        if (this.options.instructionWrap) {
            instruction = this.options.instructionWrap(instruction);
        }
        let that = this;
        return function () {
            that.instructionCount++;
            // console.log(that.instructionCount);
            return instruction.apply(null, arguments);
        };
    }
    registerWrap(register) {
        if (this.options.registerWrap) {
            register = this.options.registerWrap(register);
        }
        let that = this;
        return function () {
            that.instructionCount++;
            let ret = register.apply(null, arguments);
            return ret;
        };
    }
    setCurrentBlock(blockId) {
        this.currentBlockId = blockId;
        this.registerType = -1;
        this.lastResult = null;
    }
    setLastResult(registerType, result) {
        this.registerType = registerType;
        this.lastResult = result;
    }
    debugEvent(eventName, block, args, level, stack) {
        if (this.options.broker) {
            if (typeof (level) != 'number') {
                console.log('level is not a number ' + level);
                level = 3
            }
            if (level < this.logLevel) {
                return;
            }
            this.options.broker.onEvent(eventName, block, args, level, this.stackMsg(stack));
        }
    }
    stackMsg(stack) {
        // if (stack) {
        //     return stack.map(stackItem => {

        //     });
        // }
    }
}

export {
    Debugger, DebuggerBroker
}
