/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

(function () {
    let componentName = 'openblock-help';
    let Help = Object.create(null);
    OpenBlock.Help = Help;
    Help.docCache = Object.create(null);
    Help.blocklyHelpUrl = Object.create(null);
    Help.docPath = [];
    Help.enabled = true;
    Help.currentDoc = "";
    function loadHelpDoc(type) {
        // 设置为true以防止连续请求时一直加载
        Vue.set(Help.docCache, type, true);
        let pathIdx = 0;
        function r() {
            if (pathIdx >= Help.docPath.length) {
                Vue.set(Help.docCache, type, false);
                return;
            }
            let path = Help.docPath[pathIdx];
            pathIdx++;
            OpenBlock.Utils.requestText(path + type + ".md", (data) => {
                if (!data) {
                    r();
                } else {
                    Vue.set(Help.docCache, type, { path, data });
                }
            });
        }
        r();
    }
    function checkHelpDoc(type) {
        if (!Help.docCache[type]) {
            loadHelpDoc(type);
        }
    }
    Help.openHelpWindow = function (block_type) {
        checkHelpDoc(block_type)
        Help.currentDoc = block_type;
        Help.enabled = true;
        UB_IDE.ensureExtComponent('subwindows', componentName);
    };
    var reader = new commonmark.Parser();
    var writer = new commonmark.HtmlRenderer();


    axios({
        url: 'js/htmls/help/htmls.html',
        responseType: 'text',
        async: false
    }).then(({ data }) => {
        let template = data;
        Vue.component(componentName, {
            data() { return Help; },
            template: template,
            computed: {
                marked() {
                    let d = Help.docCache[Help.currentDoc];
                    var parsed = reader.parse(d.data);
                    var walker = parsed.walker();

                    var event, node;

                    while ((event = walker.next())) {
                        node = event.node;
                        if (node.type === 'image') {
                            if (node.destination.startsWith('.')) {
                                node.destination = d.path + node.destination.substring(1);
                            }
                        }
                    }
                    writer.link = (function (node, entering) {
                        var attrs = this.attrs(node);
                        if (entering) {
                            if (!(this.options.safe && potentiallyUnsafe(node.destination))) {
                                // 修改api文档路径
                                if (node.destination.startsWith('apiBasePath/')) {
                                    node.destination = '#' + apiBasePath + node.destination.substring('apiBasePath/'.length);
                                } else if (node.destination.startsWith('./')) {
                                    node.destination = basepath + node.destination.substring(2);
                                }
                                if (node.destination.endsWith('.md')) {
                                    // 将 md 文件处理为加载内容，而不是跳转
                                    attrs.push(['onclick', "loadDoc('" + node.destination + "');"]);
                                    node.destination = "";
                                } else {
                                    // 将其他目标类型的链接在新窗口中打开
                                    attrs.push(['target', '_blank']);
                                    attrs.push(["href", this.esc(node.destination)]);
                                }
                            }
                            if (node.title) {
                                attrs.push(["title", this.esc(node.title)]);
                            }
                            this.tag("a", attrs);
                        } else {
                            this.tag("/a");
                        }
                    }).bind(writer);
                    var result = writer.render(parsed);
                    return result;
                }
            }
        });
    });
    OpenBlock.onInited(() => {
        let origNewBlock = Blockly.WorkspaceSvg.prototype.newBlock;
        Blockly.WorkspaceSvg.prototype.newBlock = function (prototypeName, opt_id) {
            let nb = origNewBlock.call(this, prototypeName, opt_id);
            if (OpenBlock.BlocklyParser.BlockToAST[prototypeName]) {
                if (nb.helpUrl && !Help.blocklyHelpUrl[prototypeName]) {
                    let url = nb.helpUrl;
                    Vue.set(Help.blocklyHelpUrl, prototypeName, url);
                }
                nb.setHelpUrl();
            }
            return nb;
        };
        Help.docPath.push(OpenBlock.bootPath + "docs/../../../block-docs/" + OpenBlock.language + "/");
        Help.docPath.push(OpenBlock.bootPath + "docs/../../../block-docs/");
        Blockly.ContextMenuRegistry.registry.register({
            id: "openblock-help",
            scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            displayText: Blockly.Msg.HELP,
            preconditionFn() {
                return 'enabled';
            },
            weight: 15,
            callback(blocksvg) {
                let type = blocksvg.block.type;
                if (type === 'native_call') {
                    type = blocksvg.block.mutationData.func.fullname;
                }
                Help.openHelpWindow(type);
            }
        });

    });
})();