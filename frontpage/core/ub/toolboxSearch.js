/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
(function () {
    let searching = "";
    function makeBlock(workspace, xml) {
        let block = Blockly.Xml.domToBlock(xml, workspace);
        return block;
    }
    function searchBlock_(workspace, content, result) {
        if ("TOOLBOX_SEARCH_CATEGROY" === content) {
            return;
        } else if (content instanceof Blockly.ToolboxSeparator) {
            return;
        } else if (Array.isArray(content)) {
            content.forEach(item => {
                searchBlock_(workspace, item, result);
            });
        } else if (typeof (content) === 'string') {
            let categorycallback = workspace.targetWorkspace.getToolboxCategoryCallback(content);
            let xmlList = categorycallback(workspace.targetWorkspace);
            xmlList.forEach(xml => {
                let type = xml.getAttribute('type');
                if (type) {
                    if (type.indexOf(searching) >= 0 || makeBlock(workspace, xml).toString().indexOf(searching) >= 0) {
                        result.push(workspace, xml);
                    }
                }
            });
        } else if (content.getToolboxItems) {
            let items = content.getToolboxItems();
            items.forEach(item => {
                searchBlock_(workspace, item, result);
            });
        } else if (content.kind === 'BLOCK') {
            if (content.type.indexOf(searching) >= 0 || makeBlock(workspace, content.blockxml).toString().indexOf(searching) >= 0) {
                result.push(workspace, content.blockxml);
            }
        } else if (content.getContents) {
            let content1 = content.getContents();
            searchBlock_(workspace, content1, result);
        } else {
        }
    }
    function searchBlock(workspace) {
        let result = [];
        if (searching) {
            let toolbox = workspace.getToolbox();
            var testWorkspace = new Blockly.Workspace();
            testWorkspace.targetWorkspace = workspace;
            searchBlock_(testWorkspace, toolbox, result);
            testWorkspace.dispose();
        }
        return result;
    }
    OpenBlock.Blocks.toolbox_search_flyout = function (workspace) {
        var xmlList = [];
        var button = document.createElement('button');
        button.setAttribute('text', '%{BKY_SEARCH}');
        button.setAttribute('callbackKey', 'INPUT_SEARCH_CONTENT');
        xmlList.push(button);

        button = document.createElement('button');
        button.setAttribute('text', '%{BKY_CLEAR}');
        button.setAttribute('callbackKey', 'CLEAR_SEARCH');
        xmlList.push(button);
        if (searching) {
            var button = document.createElement('label');
            button.setAttribute('text', searching);
            button.setAttribute('callbackKey', 'INPUT_SEARCH_CONTENT');
            xmlList.push(button);
            try {
                let result = searchBlock(workspace);
                xmlList = xmlList.concat(result);
            } catch (e) {
                console.error(e);
            }
        }

        return xmlList;
    };
    OpenBlock.Blocks.build_toolbox_search_flyout = function (workspace) {
        workspace.registerButtonCallback("INPUT_SEARCH_CONTENT", () => {
            let p = (OpenBlock.config.uiCallbacks.prompt || window.prompt)(OpenBlock.i('输入搜索关键字'));
            if (p instanceof Promise) {
                p.then((text) => {
                    searching = text;
                    workspace.refreshToolboxSelection();
                });
            } else {
                searching = p;
                workspace.refreshToolboxSelection();
            }
        });
        workspace.registerButtonCallback("CLEAR_SEARCH", () => {
            searching = "";
            workspace.refreshToolboxSelection();
        });
        workspace.registerToolboxCategoryCallback('TOOLBOX_SEARCH_CATEGROY', OpenBlock.Blocks.toolbox_search_flyout);
    };
    OpenBlock.wsBuildCbs.push(OpenBlock.Blocks.build_toolbox_search_flyout);
})();