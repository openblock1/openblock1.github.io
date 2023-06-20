/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

let DAG = function () {
    this.allNodes = [];
    this.nodeGraph = null;
    this.errors = [];
    this.startNodes = null;
};
DAG.Node = function (value) {
    this.value = value;
    this.out = [];
    this.outNode = {};
    this.inNode = [];
};
DAG.prototype.addValue = function (nodeValue) {
    let node = new DAG.Node(nodeValue);
    this.allNodes.push(node);
    return node;
};
DAG.prototype._checkAcyclicFromNode = function (node, _index, _arr, stack) {
    let _stack = stack || [];
    if (_stack.indexOf(node) > -1) {
        let cyclic = "";
        let start = _stack.indexOf(node);
        for (let i = start; i < _stack.length; i++) {
            cyclic += _stack[i].value + " => ";
        }
        cyclic += " => " + node.value;
        this.errors.push({
            "type": "Cyclic",
            "desc": cyclic
        });
        return;
    }
    _stack.push(node);
    for (let k in node.outNode) {
        let o = node.outNode[k];
        this._checkAcyclicFromNode(o, 0, 0, _stack);
    }
    if (_stack[_stack.length - 1] === node) {
        _stack.pop();
    } else {
        throw new Error('Stack wrong.');
    }
};
DAG.prototype.build = function () {
    let nodeGraph = {};
    let startNodes = [];
    this.allNodes.forEach(n => {
        if (nodeGraph[n.value]) {
            this.errors.push({
                "type": "Duplicated",
                "name": n.value
            });
            return;
        }
        n.outNode = {};
        n.inNode = [];
        nodeGraph[n.value] = n;
    });
    this.allNodes.forEach(n => {
        n.out.forEach(o => {
            let target = nodeGraph[o];
            if (target) {
                n.outNode[o] = target;
                target.inNode.push(n);
            } else {
                console.log("Can not find '" + target + "' for " + n.value);
            }
        });
    });
    this.allNodes.forEach(n => {
        if (n.inNode.length === 0) {
            startNodes.push(n);
        }
    });
    startNodes.forEach(this._checkAcyclicFromNode, this);
    let ordered = [];
    function add(node) {
        if (!node) {
            return;
        }
        node.out.forEach(n => {
            add(nodeGraph[n]);
        });
        ordered.push(node);
    }
    startNodes.forEach(n => {
        add(n);
    });
    this.nodeGraph = nodeGraph;
    this.startNodes = startNodes;
    this.orderedNodes = ordered;
};
DAG.prototype.allInNodeMap = function (node, preInNode) {
    if (this.errors.length > 0 || !this.nodeGraph) {
        return [];
    }
    if (!node) {
        return []
    }
    let nodes = preInNode || {};
    node.inNode.forEach(n => {
        nodes[n.value] = n;
        this.allInNodeMap(n, nodes);
    });
    return nodes;
}
DAG.prototype.allOutNodeMap = function (node, preInNode) {
    if (this.errors.length > 0 || !this.nodeGraph) {
        return [];
    }
    if (!node) {
        return [];
    }
    let nodes = preInNode || {};
    for (let k in node.outNode) {
        let n = node.outNode[k];
        nodes[n.value] = n;
        this.allOutNodeMap(n, nodes);
    }
    return nodes;
}
DAG.prototype.avalibleOutNode = function (nodeValue) {
    if (this.errors.length > 0 || !this.nodeGraph) {
        return [];
    }
    let node = this.nodeGraph[nodeValue];
    let unavalibleNodeMap = {};
    unavalibleNodeMap[nodeValue] = node;
    this.allInNodeMap(node, unavalibleNodeMap);
    this.allOutNodeMap(node, unavalibleNodeMap);
    let nodes = [].concat(this.allNodes);
    for (let value in unavalibleNodeMap) {
        let node = unavalibleNodeMap[value];
        let i = nodes.indexOf(node);
        if (i >= 0) {
            nodes.splice(i, 1);
        }
    }
    return nodes;
}
DAG.prototype.unavalibleOutNode = function (nodeValue) {
    if (this.errors.length > 0 || !this.nodeGraph) {
        return [];
    }
    let node = this.nodeGraph[nodeValue];
    let unavalibleNodeMap = {};
    this.allInNodeMap(node, unavalibleNodeMap);
    let nodes = Object.values(unavalibleNodeMap);
    for (let k in node.outNode) {
        let n = node.outNode[k];
        nodes.push(n);
    }
    return nodes;
}
DAG.prototype.changeNodeValue = function (oldValue, newValue) {
    let nameNode = this.nodeGraph[newValue];
    if (nameNode) {
        throw new Error('There is already a node valued ' + oldValue);
    }
    let node = this.nodeGraph[oldValue];
    if (!node) {
        throw new Error('No node valued ' + oldValue);
    }
    node.value = newValue;
    this.nodeGraph[newValue] = node;
    delete this.nodeGraph[oldValue];
    return true;
}