/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
 (function () {
    OpenBlock.onInited(() => {
        let showing;
        function collect(workspace) {
            showing = {};
            var xmlList = [];
            let src = workspace._openblock_env && workspace._openblock_env._openblock_src;
            if (!src) {
                return xmlList;
            }
            let coll = src.collected;
            if (!coll) {
                return xmlList;
            }
            coll.forEach(item => {
                try {
                    let dom = Blockly.Xml.textToDom(item);
                    let id = dom.getAttribute('id');
                    showing[id] = item;
                    xmlList.push(dom);
                } catch (e) {
                    console.warn(e);
                }
            });
            return xmlList;
        }
        Blockly.ContextMenuRegistry.registry.register({
            id: "openblock-collect",
            scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            displayText(scope) {
                let block = scope.block;
                if (block.isInFlyout) {
                    return OpenBlock.i('取消收藏');
                } else {
                    return OpenBlock.i('收藏');
                }
            },
            preconditionFn(c) {
                if (!showing) {
                    return 'hidden';
                }
                let blocksvg = c.block;
                let isInFlyout = blocksvg.isInFlyout;
                if (isInFlyout && !showing[blocksvg.id]) {
                    return 'hidden';//'disabled';
                }
                return 'enabled';
            },
            weight: 15,
            callback(e) {
                let blocksvg = e.block;
                if (blocksvg.isInFlyout) {
                    let id = blocksvg.id;
                    let txt = showing[id];
                    let src = blocksvg.workspace.targetWorkspace._openblock_env._openblock_src;
                    let coll = src.collected;
                    if (coll) {
                        let idx = coll.indexOf(txt);
                        if (idx > -1) {
                            coll.splice(idx, 1);
                        }
                    }
                } else {
                    let txt = Blockly.Xml.domToText(Blockly.Xml.blockToDom(blocksvg));
                    let src = blocksvg.workspace._openblock_env._openblock_src;
                    let coll = src.collected;
                    if (!coll) {
                        coll = [];
                        src.collected = coll;
                    }
                    coll.push(txt);
                }
            }
        });
        OpenBlock.wsBuildCbs.push(workspace => {
            workspace.registerToolboxCategoryCallback('COLLECT', collect);
            collect(workspace);
        });

    });
})();