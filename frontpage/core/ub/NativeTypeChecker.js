/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

class NativeTypeChecker extends Blockly.ConnectionChecker {
  // constructor() {
  //     super();
  // }
  matchCache = {};
  doTypeChecksWithNumberType(a, b) {
    var checkArrayOne = a.getCheck();
    var checkArrayTwo = b.getCheck();

    if (checkArrayOne && checkArrayTwo) {
      return this.doTypeChecks(a, b) || this.doNumberTypeCheck(a, b);
    }
    return true;
  }
  doNumberTypeCheck(a, b) {
    var checkArrayOne = a.getCheck();
    var checkArrayTwo = b.getCheck();

    if (!checkArrayOne || !checkArrayTwo) {
      // One or both sides are promiscuous enough that anything will fit.
      return true;
    }
    if (checkArrayOne.indexOf('Integer') >= 0 && checkArrayTwo.indexOf('Number') >= 0) {
      return true;
    }
    if (checkArrayTwo.indexOf('Integer') >= 0 && checkArrayOne.indexOf('Number') >= 0) {
      return true;
    }
  }
  doTypeChecks(a, b) {
    var checkArrayOne = a.getCheck();
    var checkArrayTwo = b.getCheck();

    if (!checkArrayOne || !checkArrayTwo) {
      // One or both sides are promiscuous enough that anything will fit.
      return true;
    }
    // Find any intersection in the check lists.
    for (var i = 0; i < checkArrayOne.length; i++) {
      if (checkArrayTwo.indexOf(checkArrayOne[i]) != -1) {
        return true;
      }
    }
    // No intersection.
    if (a.type === Blockly.connectionTypes.INPUT_VALUE) {
      return this.NativeTypeChecker(checkArrayOne, checkArrayTwo);
    } else if (a.type === Blockly.connectionTypes.OUTPUT_VALUE) {
      return this.NativeTypeChecker(checkArrayTwo, checkArrayOne);
    }
    return false;

  }
  NativeTypeChecker(inputArr, outputArr) {
    for (let o = 0; o < outputArr.length; o++) {
      let output = outputArr[o];
      for (let i = 0; i < inputArr.length; i++) {
        let input = inputArr[i];
        if (this.match(output, input)) {
          return true;
        }
      }
    }
    // if (inputArr.indexOf('Integer') >= 0 && outputArr.indexOf('Number') >= 0) {
    //   return true;
    // }
    return false;
  }
  match(sub, parent) {
    if (sub === parent) {
      return true;
    }
    if (parent === 'any') {
      return true;
    }
    if (typeof (sub) != 'string') {
      throw Error('sub must be string');
    }
    if (typeof (parent) != 'string') {
      throw Error('parent must be string');
    }
    let subMath = this.matchCache[sub];
    if (!subMath) {
      subMath = {};
      this.matchCache[sub] = subMath;
    }
    let result = subMath[parent];
    if (typeof (result) === 'boolean') {
      return result;
    }
    let types = OpenBlock.nativeTypes;
    let parents = types[sub];
    if (parents) {
      for (let i = 0; i < parents.length; i++) {
        let p = parents[i];
        if (this.match(p, parent)) {
          subMath[parent] = true;
          return true;
        }
      }
    } else {
      // 不是本地类型
      if (parent === 'object') {
        subMath[parent] = true;
        return true;
      } else if (parent.includes('*')) {//泛型(1个)
        let idx = parent.indexOf('*')
        let prefix = parent.substring(0, idx);
        let postfix = parent.substring(idx + 1);
        if (sub.startsWith(prefix) && sub.endsWith(postfix)) {
          subMath[parent] = true;
          return true;
        }
      }
    }
    subMath[parent] = false;
    return false;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.CONNECTION_CHECKER, "NativeTypeChecker", NativeTypeChecker);