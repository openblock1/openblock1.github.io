/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

 OpenBlock.TypeTree = {};
OpenBlock.TypeTree.Types = {};
OpenBlock.TypeTree.AllTypes = [];
OpenBlock.TypeTree.extBases = function(typebases) {
        if (!typebases) {
            return
        }
        if (!typebases[".exted"]) {
            for (let basename in typebases) {
                let baseinfo = OpenBlock.TypeTree.Types[basename]
                if (!baseinfo) {
                    continue
                }
                if (!baseinfo[".exted"]) {
                    OpenBlock.TypeTree.extBases(baseinfo)
                }
                for (let superbase in baseinfo) {
                    if (!superbase.startsWith(".")) {
                        typebases[superbase] = true
                    }
                }
            }
            typebases[".exted"] = true
        }
    }
    /**
     * @param {Array} array of types
     */
window.TypeTree = function(arr) {
    OpenBlock.TypeTree.AllTypes = arr
    arr.forEach((e, index) => {
        let self = OpenBlock.TypeTree.Types[e.type]
        if (!self) {
            self = {
                ".index": index
            }
            OpenBlock.TypeTree.Types[e.type] = self
        }
        self[e.base] = true
    })
    OpenBlock.TypeTree.Types["Boolean"] = OpenBlock.TypeTree.Types["System.Boolean"]
    OpenBlock.TypeTree.Types["String"] = OpenBlock.TypeTree.Types["System.String"]
    OpenBlock.TypeTree.Types["Char"] = OpenBlock.TypeTree.Types["System.Char"]
    OpenBlock.TypeTree.Types["Short"] = OpenBlock.TypeTree.Types["System.Int16"]
    OpenBlock.TypeTree.Types["Number"] = {
        "System.Float": true,
        "System.Double": true
    }
    OpenBlock.TypeTree.Types["Byte"] = OpenBlock.TypeTree.Types["System.Byte"]
    for (let typename in OpenBlock.TypeTree.Types) {
        let typebases = OpenBlock.TypeTree.Types[typename]
        OpenBlock.TypeTree.extBases(typebases)
    }
}

/**
 * Is this connection compatible with another connection with respect to the
 * value type system.  E.g. square_root("Hello") is not compatible.
 * @param {!Blockly.Connection} otherConnection Connection to compare against.
 * @return {boolean} True if the connections share a type.
 * @private
 */
Blockly.Connection.prototype.checkType_ = function(otherConnection) {
    if (!this.check_ || !otherConnection.check_) {
        // One or both sides are promiscuous enough that anything will fit.
        return true
    }
    if (this.check_[0] === otherConnection.check_[0]) {
        return true
    }
    var x = (this.offsetInBlock_.x + this.offsetInBlock_.y < otherConnection.offsetInBlock_.x + otherConnection.offsetInBlock_.y)
    var leftConn, rightConn
    if (x) {
        leftConn = this
        rightConn = otherConnection
    } else {
        leftConn = otherConnection
        rightConn = this
    }
    if (typeof(leftConn.check_[0]) === 'function') {
        return leftConn.check_[0].apply(leftConn, rightConn)
    }
    // leftType.IsSubclassOf(rightType);
    let all = OpenBlock.TypeTree.Types
    let leftType = all[leftConn.check_[0]]
    if (leftType) {
        return leftType[rightConn.check_[0]]
    } else {
        if (!leftConn.check_[0].startsWith("[")) {
            let msg = "can't find type :" + leftConn.check_[0]
            let blk = leftConn.getSourceBlock()
            if (blk.type === 'Native_call') {
                msg += ' native call:' + blk._ubbc_native_call_name
            }
            console.log(new Error(msg))
        }
        return false
    }
};