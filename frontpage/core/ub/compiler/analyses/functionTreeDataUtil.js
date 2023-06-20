class FunctionCallAnalysedItem {
    /**
     * @type FunctionCallItem[]
     */
    calls = [];
    /**
     * @type {string[]}
     */
    deepCalls = [];
    /**
     * @type string[]
     */
    called = [];
    /**
     * @type string[]
     */
    deepCalled = [];
    /**
     * @type {string}
     */
    type;
    /**
     * @type {string}
     */
    fullname;
    /**
     * @type {boolean}
     */
    recursion = false;
    /**
     * @type {string}
     */
    fsmFullname;
    constructor(fullname) {
        this.fullname = fullname;
    }
}
class FunctionTreeDataUtil {
    /**
     * @type {Object.<string,FunctionCallAnalysedItem}
     */
    functions = {};
    /**
     * @type {Object.<string,FunctionCallAnalysedItem}
     */
    nativeFunctions = {};
    /**
     * 
     * @param {String} start function fullname
     */
    traversePath(start) {

    }
    update() {
        console.log('update FunctionTreeData');
        let compiled = OpenBlock.Compiler.compiled;
        /**
         * @type {Object.<string,FunctionCallAnalysedItem>}
         */
        let allFunctions = {};
        /**
         * @type {Object.<string,FunctionCallAnalysedItem>}
         */
        let nativeFunctions = {};
        function get(fullname) {
            let func1 = allFunctions[fullname];
            if (!func1) {
                func1 = new FunctionCallAnalysedItem(fullname);
                allFunctions[fullname] = func1;
            }
            return func1;
        }
        Object.keys(compiled).forEach(moduleName => {
            let compiledModule = compiled[moduleName];
            /**
             * @type {Object.<string,FunctionCallNode>}
             */
            let functions = compiledModule.analysed.FunctionTree;
            Object.values(functions).forEach(func => {
                let func1 = get(func.fullname);
                func1.type = func.type;
                func1.calls = func.calls;
                func1.fsmFullname = func.fsmFullname;
            });
        });
        function getNative(fullname) {
            let func1 = nativeFunctions[fullname];
            if (!func1) {
                func1 = new FunctionCallAnalysedItem(fullname);
                func1.type = 'native';
                func1.static = true;
                nativeFunctions[fullname] = func1;
            }
            return func1;
        }
        /**
         * 
         * @param {FunctionCallAnalysedItem} func 
         * @param {FunctionCallAnalysedItem} targetFunc 
         */
        function addDeep(func, targetFunc) {
            if (!targetFunc.deepCalled.includes(func.fullname)) {
                targetFunc.deepCalled.push(func.fullname);
            }
            if (!func.deepCalls.includes(targetFunc.fullname)) {
                func.deepCalls.push(targetFunc.fullname);
            }
        }
        Object.values(allFunctions).forEach(func => {
            func.calls.forEach(funcCalled => {
                if (funcCalled.funcCallAST instanceof VoidNativeCall
                    || funcCalled.funcCallAST instanceof ValueNativeCall) {
                    let callitem = getNative(funcCalled.targetFullname);
                    if (!callitem.called.includes(func.fullname)) {
                        callitem.called.push(func.fullname);
                    }
                    return;
                }
                if (funcCalled.targetFullname === func.fullname) {
                    func.recursion = true;
                }
                let targetFunc = allFunctions[funcCalled.targetFullname];
                if (!targetFunc.called.includes(func.fullname)) {
                    targetFunc.called.push(func.fullname);
                }
                addDeep(func, targetFunc);
            });
        });
        /**
         * 
         * @param {FunctionCallAnalysedItem[]} stack 
         */
        function deepTraverse(stack) {
            // let found = false;
            let func = stack[stack.length - 1];
            func.deepCalls.forEach(targetFullname => {
                let targetCall = allFunctions[targetFullname];
                targetCall.deepCalls.forEach(deepcall => {
                    let deepcallFunc = allFunctions[deepcall];
                    stack.forEach(stFunc => {
                        addDeep(stFunc, deepcallFunc);
                        stack.push(deepcallFunc);
                        deepTraverse(stack);
                        stack.pop();
                    });
                });
            });
            // return found;
        }
        Object.values(allFunctions).forEach(func => {
            deepTraverse([func]);
        });
        this.functions = allFunctions;
        this.nativeFunctions = nativeFunctions;
    }
}
OpenBlock.onInited(() => {
    OpenBlock.FunctionTreeDataUtil = new FunctionTreeDataUtil();
    OpenBlock.Linker.onFinished(() => {
        OpenBlock.FunctionTreeDataUtil.update();
    });
});