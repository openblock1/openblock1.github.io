class FunctionCallItem {
    /**
     * @type {String}
     */
    targetFullname;
    /**
     * @type {String}
     */
    path;
    /**
     * @type {VoidMethodCall || ValueMethodCall || VoidNativeCall || ValueNativeCall}
     */
    funcCallAST;
    init(funcCallAst, targetFullname, path) {
        this.targetFullname = targetFullname;
        this.funcCallAST = funcCallAst;
        this.path = path;
        return this;
    }
}
Serializable(FunctionCallItem);
class FunctionCallNode {
    /**
     * @type {string}
     */
    fullname;
    /**
     * @type {string}
     */
    fsmFullname;
    calls = [];
    add(item) {
        this.calls.push(item);
    }
}
Serializable(FunctionCallNode);
class FunctionTreeData {
    /**
     * @type {Object.<string,FunctionCallNode>}
     */
    functions = {};
    /**
     * @type {string} function/message/event
     */
    type;
    get(fullname) {
        return this.functions[fullname];
    }
    create(fullname, type, fsmFullname) {
        let node = new FunctionCallNode();
        node.fullname = fullname;
        node.type = type;
        node.fsmFullname = fsmFullname;
        this.functions[fullname] = node;
        return node;
    }
}
Serializable(FunctionTreeData);