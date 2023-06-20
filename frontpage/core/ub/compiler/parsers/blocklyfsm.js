/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * start->XML,
 * Block,
 * Mutation(xml),
 * Value(Block),
 * Field(text),
 * Next(Block),
 * Comment(text),
 * Statement(block)
 */
class BlocklyFSM {
    currentState;
    stateStack;
    errors = [];
    constructor() {
        // super();
        this.currentState = new BlocklyFSMState(this);
    }
    pushState(state) {
        this.stateStack.push(this.currentState);
        this.currentState = state;
    }
    popState() {
        this.currentState = this.stateStack.pop();
    }
    //
    startNode(elem, getAttrs, isTagEnd, getStringNode) {
        this.currentState.startNode(elem, getAttrs, isTagEnd, getStringNode);
    }
    textNode(t) {
        this.currentState.textNode(t);
    }
    endNode(elem, isTagStart, getStringNode) {
        this.currentState.endNode(elem, isTagStart, getStringNode);
    }
    error() {
        console.log(arguments);
    }
    cdata() {
        console.log(arguments);
    }
    unknownNS() {
        console.log(arguments);
    }
    attention() {
        console.log(arguments);
    }
    question() {
        console.log(arguments);
    }
    comment() {
        console.log(arguments);
    }
    getListener() {
        return {
            startNode: this.startNode.bind(this),
            textNode: this.textNode.bind(this),
            endNode: this.endNode.bind(this),
            error: this.error.bind(this),
            cdata: this.cdata.bind(this),
            unknownNS: this.unknownNS.bind(this),
            attention: this.attention.bind(this),
            question: this.question.bind(this),
            comment: this.question.bind(this),
        }
    }
}
class BlocklyFSMState {
    fsm;
    constructor(fsm) {
        // super();
        this.fsm = fsm;
    }
    OnNodeFinished() {
    }
    // parser
    startNode(elem, getAttrs, isTagEnd, getStringNode) {
        /*
         * start->XML,
         * Block,
         * Mutation(xml),
         * Value(Block),
         * Field(text),
         * Next(Block),
         * Comment(text),
         * Statement(block)
         */
        switch (elem) {
            case 'xml':
                this.fsm.stateStack = [];
                this.fsm.currentState = new BlocklyFSMState_XML(this.fsm);
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'block':
            case 'shadow':
                this.fsm.pushState(new BlocklyFSMState_Block(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'mutation':
                this.fsm.pushState(new BlocklyFSMState_Mutation(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'value':
                this.fsm.pushState(new BlocklyFSMState_Value(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'field':
                this.fsm.pushState(new BlocklyFSMState_Field(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'next':
                this.fsm.pushState(new BlocklyFSMState_Next(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'comment':
                this.fsm.pushState(new BlocklyFSMState_Comment(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'statement':
                this.fsm.pushState(new BlocklyFSMState_Statement(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'variables':
                this.fsm.pushState(new BlocklyFSMState_Variables(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            case 'variable':
                this.fsm.pushState(new BlocklyFSMState_Variable(this.fsm));
                Object.assign(this.fsm.currentState, { elementName: elem }, getAttrs());
                break;
            default:
                console.error('unknown element type:' + {
                    elem, attrs: getAttrs(), isTagEnd,
                    StringNode: getStringNode()
                });
        }
    }
    textNode(t) {
        this.text = t;
    }
    endNode(elem, isTagStart, getStringNode) {
        if (elem !== this.elementName) {
            throw Error('???');
        }
        this.fsm.popState();
        this.OnNodeFinished();
    }
    error(e) {
        console.warn(e);
    }
    cdata(c) {
        console.warn('cdata', c);
    }
    unknownNS(ns) {
        console.warn('unknownNS', ns);
    }
    attention(a) {
        console.warn('attention', a);
    }
    question(q) {
        console.warn('question', q);
    }
    comment(c) {
        console.warn('comment', c);
    }
}
class BlocklyFSMState_XML extends BlocklyFSMState {
    blocks = [];
    constructor(fsm) {
        super(fsm);
    }
    addBlock(blk) {
        this.blocks.push(blk);
    }
    OnNodeFinished() {
        this.fsm.rootBlocks = this.blocks;
    }
}
class BlocklyFSMState_Block extends BlocklyFSMState {
    constructor(fsm) {
        super(fsm);
    }
    OnNodeFinished() {
        this.fsm.currentState.addBlock(this);
    }
    AST() {
        let toAST;
        if (this.disabled) {
            toAST = OpenBlock.BlocklyParser.BlockToAST['dummy'];
        } else {
            toAST = OpenBlock.BlocklyParser.BlockToAST[this.type];
        }
        if (!toAST) {
            throw Error('Unknown AST of block type ' + this.type);
            debugger;
        }
        try {
            let ast = toAST(this);
            ast.setBlockId(this.id);
            return ast;
        } catch (e) {
            // e.message = this.id + " -> " + e.message;
            e.blockId = this.id;
            this.fsm.errors.push(e);
            return new ErrorAST();
        }
    }
}
class BlocklyFSMState_Mutation extends BlocklyFSMState {
    constructor(fsm) {
        super(fsm);
    }

    OnNodeFinished() {
        this.fsm.currentState.mutation = this;
    }
}
class BlocklyFSMState_Value extends BlocklyFSMState {
    constructor(fsm) {
        super(fsm);
    }
    addBlock(blk) {
        this.block = blk;
    }
    OnNodeFinished() {
        if (!this.fsm.currentState.values) {
            this.fsm.currentState.values = {};
        }
        this.fsm.currentState.values[this.name] = this.block;
    }
}
class BlocklyFSMState_Field extends BlocklyFSMState {
    text = "";
    constructor(fsm) {
        super(fsm);
    }
    OnNodeFinished() {
        if (!this.fsm.currentState.fields) {
            this.fsm.currentState.fields = {};
        }
        this.fsm.currentState.fields[this.name] = this;
    }
}
class BlocklyFSMState_Next extends BlocklyFSMState {
    block;
    constructor(fsm) {
        super(fsm);
    }
    addBlock(blk) {
        this.block = blk;
    }
    OnNodeFinished() {
        this.fsm.currentState.next = this.block;
    }
}
class BlocklyFSMState_Comment extends BlocklyFSMState {
    constructor(fsm) {
        super(fsm);
    }
}
class BlocklyFSMState_Variables extends BlocklyFSMState {
    constructor(fsm) {
        super(fsm);
    }
}
class BlocklyFSMState_Variable extends BlocklyFSMState {
    constructor(fsm) {
        super(fsm);
    }
}
class BlocklyFSMState_Statement extends BlocklyFSMState {
    block;
    constructor(fsm) {
        super(fsm);
    }
    addBlock(blk) {
        this.block = blk;
    }
    OnNodeFinished() {
        if (!this.fsm.currentState.statements) {
            this.fsm.currentState.statements = {};
        }
        this.fsm.currentState.statements[this.name] = this.block;
    }
}
