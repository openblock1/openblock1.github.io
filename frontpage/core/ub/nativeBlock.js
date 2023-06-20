/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 参数供给
 * 
 * 为本地函数中需要的参数提供可视化的内容编辑方法
 * 
 */
class OB_NativeBlockArgumentProvider {
    /**
     * 
     * @param {xmldom} blockDom 本地块xml配置中的block节点
     * @param {xmldom} providerDom 本地块xml配置中的provider节点
     */
    init(blockDom, providerDom) { }
    /**
     * 
     * @param {Blockly.Workspace} workspace
     * @param {String} checkType 需要的类型
     * @param {String} inputName input名称
     * @param {Blockly.Input} input input对象
     */
    makeBlock(parentBlock, checkType, inputName, input) { }
}
class OB_FSMNameProvider extends OB_NativeBlockArgumentProvider {
    /**
     * 
     * @param {Blockly.Workspace} workspace
     * @param {String} checkType 需要的类型
     * @param {String} inputName input名称
     * @param {Blockly.Input} input input对象
     */
    makeBlock(workspace, checkType, inputName, input) {
        if (checkType && checkType !== 'String') {
            throw Error('fsm 供给只支持字符串类型');
        }
        let blk = workspace.newBlock('fsm_provider');
        return blk;
    }
}
class OB_DropdownProvider extends OB_NativeBlockArgumentProvider {
    /**
     * 下拉列表的选项
     * @type {Array.<Object.<string,String>>|Function} 国际化->返回值的键值对
     */
    options;
    /**
     * @type {String}
     */
    arg;
    /**
     * @type {String}
     */
    parentBlockType;
    /**
     * 
     * @param {xmldom} blockDom 本地块xml配置中的block节点
     * @param {xmldom} providerDom 本地块xml配置中的provider节点
     */
    init(blockDom, providerDom) {
        let property = providerDom.getAttribute('property');
        let f = 'let p = ' + property + ';return p;';
        let optionValues = new Function(f)();
        if (typeof (optionValues) == 'function') {
            this.options = optionValues;
        } else if (!Array.isArray(optionValues)) {
            throw Error(OpenBlock.i('没有从设定的属性中得到数组:') + Blockly.Xml.domToText(property));
        } else {
            this.options = optionValues.map(x => {
                // 兼容blockly标准的表达方式
                if (Array.isArray(x)) {
                    return x;
                }
                // OpenBlock定义的拆分值和国际化的表达方式
                return [OpenBlock.i(x), x]
            });
        }
        this.arg = providerDom.getAttribute('arg');
        this.parentBlockType = blockDom.getAttribute('nativeCall');
    }
    /**
     * 
     * @param {Blockly.Workspace} workspace
     * @param {String} checkType 需要的类型
     * @param {String} inputName input名称
     * @param {Blockly.Input} input input对象
     */
    makeBlock(workspace, checkType, inputName, input) {
        if (checkType && checkType !== 'String') {
            throw Error('dropdown 供给只支持字符串类型');
        }
        let blk = workspace.newBlock('empty_provider');
        blk.mutation = JSON.stringify({ parentType: this.parentBlockType, argName: this.arg, checkType });
        blk.updateBlock();
        return blk;
    }
}
class OB_FileProvider extends OB_NativeBlockArgumentProvider {
    /**
     * 下拉列表的选项
     * @type {Array.<Object.<string,String>>|Function} 国际化->返回值的键值对
     */
    options;
    /**
     * @type {String}
     */
    arg;
    /**
     * @type {String}
     */
    parentBlockType;
    mediaType;
    /**
     * 
     * @param {xmldom} blockDom 本地块xml配置中的block节点
     * @param {xmldom} providerDom 本地块xml配置中的provider节点
     */
    init(blockDom, providerDom) {
        this.mediaType = providerDom.getAttribute('mediaType');
        this.arg = providerDom.getAttribute('arg');
        this.parentBlockType = blockDom.getAttribute('nativeCall');
        this.options = this._options.bind(this);
    }
    /**
     * 
     * @param {Blockly.Workspace} workspace
     * @param {String} checkType 需要的类型
     * @param {String} inputName input名称
     * @param {Blockly.Input} input input对象
     */
    makeBlock(workspace, checkType, inputName, input) {
        if (checkType && checkType !== 'String') {
            throw Error('dropdown 供给只支持字符串类型');
        }
        let blk = workspace.newBlock('empty_provider');
        blk.mutation = JSON.stringify({ parentType: this.parentBlockType, argName: this.arg, checkType });
        blk.updateBlock();
        return blk;
    }
    _options() {
        let ret = [];
        VFS.partition.assets.allFiles((arr) => {
            arr.forEach(f => {
                if (OpenBlock.Utils.mediaType(f.name) == this.mediaType) {
                    ret.push([f.name, f.name]);
                }
            });
        });
        if (ret.length == 0) {
            ret.push(['', '']);
        }
        return ret;
    }
}
(function () {
    /**
     * 参数 provider 映射
     * 名称->类
     * @type {Object.<string,typeof(OB_NativeBlockArgumentProvider)>}
     */
    OpenBlock.NativeFieldProviders = {
        'fsm': OB_FSMNameProvider,
        'dropdown': OB_DropdownProvider,
        'file': OB_FileProvider
    };
    let providerInstance = [];
    /**
     * 
     * @param {String} name 
     * @param {Type} clazz 
     */
    OpenBlock.registerFieldProvider = function (name, clazz) {
        if (OpenBlock.NativeFieldProviders[name]) {
            console.warn('Provider already exist:' + name);
        }
        OpenBlock.NativeFieldProviders[name] = clazz;
    }
    /**
     * 本地函数名 -> 参数名称 -> 供给
     * @type {Object.<string,Object.<string,OB_NativeBlockArgumentProvider>>}
     */
    OpenBlock.NativeBlockProviderConfig = {}
    let nativeBlockTree = [];
    let nativeEvents = [];
    function updateNativeCallElement(ele) {
        if (ele.tagName === 'block' && ele.hasAttribute("nativeCall")) {
            if (!ele.hasAttribute("type")) {
                ele.setAttribute("type", "native_call");
            }
            let nativeMethod = ele.getAttribute("nativeCall");

            let libs = OpenBlock.nativefunctions.custom;
            let nativeFunction;
            for (let libname in libs) {
                let lib = libs[libname];
                nativeFunction = lib.find((f) => f.fullname === nativeMethod);
                if (nativeFunction) {
                    break;
                }
            }
            if (nativeFunction) {
                let mutation = document.createElement('mutation');
                let txt = encodeURI(JSON.stringify({ func: nativeFunction, ignoreReturnValue: false }))
                mutation.textContent = txt;
                ele.appendChild(mutation);
                for (let i = 0; ele.children[i]; i++) {
                    let c = ele.children[i];
                    if (c.tagName === 'provider') {
                        let arg = c.getAttribute('arg');
                        if (!arg) {
                            console.warn('没有为参数供给提供参数名称' + Blockly.Xml.domToText(ele));
                            return;
                        }
                        let type = c.getAttribute('type');
                        if (!type) {
                            console.warn('没有设定供给类型' + Blockly.Xml.domToText(ele));
                            return;
                        }
                        // 创建 arg provider
                        let blockconfig = OpenBlock.NativeBlockProviderConfig[nativeMethod];
                        if (!blockconfig) {
                            blockconfig = {};
                            OpenBlock.NativeBlockProviderConfig[nativeMethod] = blockconfig;
                        }
                        let providerClass = OpenBlock.NativeFieldProviders[type];
                        let provider = new providerClass();
                        provider.init(ele, c);
                        blockconfig[arg] = provider;
                        providerInstance.push(provider);
                    }
                };
            } else {
                console.error('找不到本地函数 ' + nativeMethod);
                return;
            }
        } else {
            // debugger
        }
    }
    function updateNativeCall(dom) {
        let children = dom.children;
        for (let k = 0; k < children.length; k++) {
            let child = children[k];
            updateNativeCall(child);
        }
        updateNativeCallElement(dom);
    }
    OpenBlock.NativeBlocks = function (blocksXML) {
        let dom = Blockly.Xml.textToDom(blocksXML);
        updateNativeCall(dom);
        let children = dom.children;
        let n = [];
        for (let k = 0; k < children.length; k++) {
            let child = children[k];
            let txt = Blockly.Xml.domToText(child);
            n.push(txt);
        }
        nativeBlockTree = n;
    };
    OpenBlock.injectNativeCategory = function (xmlDom) {
        for (let k = 0; k < nativeBlockTree.length; k++) {
            let child = nativeBlockTree[k];
            let dom = Blockly.Xml.textToDom(child);
            xmlDom.append(dom);
        }
    };

    /**
     * 注册本地事件
     * @param {{name:string,argType:string,?style:string}[]} events 
     */
    OpenBlock.registerNativeEvents = function (events) {
        if (!Array.isArray(events)) {
            events = [events];
        }
        nativeEvents = nativeEvents.concat(events);
    };
    OpenBlock.clearNativeBlock = function () {
        nativeEvents = [];
    };
    /**
     * <block type="on_event">
     *    <mutation eventname="OnTriggerEnter" style="event_blocks" argtype="UnityEngine.Collider"></mutation>
     * </block>
     * @param {*} workspace 
     * @returns 
     */
    OpenBlock.Blocks.native_event_flyout = function (workspace) {
        var xmlList = [];
        var b = Blockly.utils.xml.createElement('block');
        b.setAttribute('type', 'on_event');
        var m = Blockly.utils.xml.createElement('mutation');
        m.setAttribute('eventname', "Start");
        m.setAttribute('style', "event_blocks");
        b.appendChild(m);
        xmlList.push(b);

        b = Blockly.utils.xml.createElement('block');
        b.setAttribute('type', 'on_event');
        m = Blockly.utils.xml.createElement('mutation');
        m.setAttribute('eventname', "Restore");
        m.setAttribute('style', "event_blocks");
        b.appendChild(m);
        xmlList.push(b);

        nativeEvents.forEach(e => {
            var b = Blockly.utils.xml.createElement('block');
            b.setAttribute('type', 'on_event');
            var m = Blockly.utils.xml.createElement('mutation');
            m.setAttribute('eventname', e.name);
            m.setAttribute('style', e.style || "event_blocks");
            if (e.argType) {
                m.setAttribute('argtype', e.argType);
            }
            b.appendChild(m);
            xmlList.push(b);
        });
        return xmlList;
    };
    function assets(workspace) {
        let xmlList = [];
        let str_dom = [];
        var testWorkspace = new Blockly.Workspace();
        testWorkspace.targetWorkspace = workspace;
        providerInstance.forEach(pd => {
            let b = pd.makeBlock(testWorkspace);
            let d = (Blockly.Xml.blockToDom(b));
            d.removeAttribute('id');
            let t = Blockly.Xml.domToText(d);
            if (str_dom.indexOf(t) < 0) {
                str_dom.push(t);
            } else { return; }
            xmlList.push(d);
        });
        testWorkspace.dispose();
        return xmlList;
    }
    OpenBlock.Blocks.build_native_event_flyout = function (workspace) {
        workspace.registerToolboxCategoryCallback('NATIVE_EVENT_CATEGROY', OpenBlock.Blocks.native_event_flyout);
        workspace.registerToolboxCategoryCallback('ASSETS', assets);
    };
    OpenBlock.wsBuildCbs.push(OpenBlock.Blocks.build_native_event_flyout);
})();