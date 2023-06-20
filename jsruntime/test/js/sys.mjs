import * as obvm from '../../runtime/vm.mjs'
class Sys {
    constructor(config) {
        Object.assign(this, config);
        if (!this.prompt) {
            this.prompt = window.prompt.bind(window);
        }
    }
    install(script) {
        script.InstallLib("sys_io", "sys_io", [
            script.NativeUtil.closureVoid(this.io_prompt.bind(this),
                ['StringRegister', 'StringRegister'], true),
        ]);
        script.InstallLib("sys_window", "sys_window", [
            script.NativeUtil.closureVoid(this.window_set_width.bind(this),
                ['DoubleRegister'], true),
            script.NativeUtil.closureVoid(this.window_set_height.bind(this),
                ['DoubleRegister'], true),
            script.NativeUtil.fieldGetter(window, 'outerWidth', 'DoubleRegister'),
            script.NativeUtil.fieldGetter(window, 'outerHeight', 'DoubleRegister'),
        ]);
        script.InstallLib("sys_time", "sys_time", [
            script.NativeUtil.closureReturnValue(Date.now, 'LongRegister', [], false),
            script.NativeUtil.closureReturnValue(() => {
                return new Date();
            }, 'NObjectRegister', [], false),
            script.NativeUtil.closureReturnValue((timestamp) => {
                return new Date(timestamp);
            }, 'NObjectRegister', ['LongRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getDate();
                }, 'LongRegister', ['NObjectRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getDay();
                }, 'LongRegister', ['NObjectRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getFullYear();
                }, 'LongRegister', ['NObjectRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getHours();
                }, 'LongRegister', ['NObjectRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getMilliseconds();
                }, 'LongRegister', ['NObjectRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getMinutes();
                }, 'LongRegister', ['NObjectRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getMonth();
                }, 'LongRegister', ['NObjectRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getSeconds();
                }, 'LongRegister', ['NObjectRegister'], false),
            script.NativeUtil.closureReturnValue(
                /**
                 * 
                 * @param {Date} date 
                 * @returns 
                 */
                (date) => {
                    return date.getTime();
                }, 'LongRegister', ['NObjectRegister'], false),


            script.NativeUtil.closureVoid(
                /**
                 * 
                 * @param {Date} date 
                 */
                (date, v) => {
                    date.setDate(v);
                }, ['NObjectRegister', 'LongRegister']),
            script.NativeUtil.closureVoid(
                /**
                 * 
                 * @param {Date} date 
                 */
                (date, v) => {
                    date.setFullYear(v);
                }, ['NObjectRegister', 'LongRegister']),
            script.NativeUtil.closureVoid(
                /**
                 * 
                 * @param {Date} date 
                 */
                (date, v) => {
                    date.setHours(v);
                }, ['NObjectRegister', 'LongRegister']),
            script.NativeUtil.closureVoid(
                /**
                 * 
                 * @param {Date} date 
                 */
                (date, v) => {
                    date.setMilliseconds(v);
                }, ['NObjectRegister', 'LongRegister']),
            script.NativeUtil.closureVoid(
                /**
                 * 
                 * @param {Date} date 
                 */
                (date, v) => {
                    date.setMinutes(v);
                }, ['NObjectRegister', 'LongRegister']),
            script.NativeUtil.closureVoid(
                /**
                 * 
                 * @param {Date} date 
                 */
                (date, v) => {
                    date.setMonth(v);
                }, ['NObjectRegister', 'LongRegister']),
            script.NativeUtil.closureVoid(
                /**
                 * 
                 * @param {Date} date 
                 */
                (date, v) => {
                    date.setSeconds(v);
                }, ['NObjectRegister', 'LongRegister']),
            script.NativeUtil.closureVoid(
                /**
                 * 
                 * @param {Date} date 
                 */
                (date, v) => {
                    date.setTime(v);
                }, ['NObjectRegister', 'LongRegister']),
        ]);
    }
    window_set_width(w) {
        window.resizeTo(w, window.outerHeight);
    }
    window_set_height(h) {
        window.resizeTo(window.outerWidth, h);
    }
    io_prompt(question, title, state) {
        let answer = this.prompt(question);
        if (answer instanceof Promise) {
            answer.then((answer) => {
                state.fsm.PostMessage(new obvm.UserMessage(title, 'String', answer || '', null));
            });
        } else {
            state.fsm.PostMessage(new obvm.UserMessage(title, 'String', answer || '', null));
        }
    }
}
export { Sys };