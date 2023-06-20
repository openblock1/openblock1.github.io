/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

let ui_data = {
    /**
  * @type {ResultBlock[]} blocks
  */
    blocks: [],
    byID: [],
    searchCallback: null,
    show: false,
    searching: ""
}

Vue.component('searchblock', (resolve) => {
    axios.get('js/htmls/searchblock/searchblock.html').then(({ data }) => {
        resolve({
            props: [],
            data() { return ui_data },
            methods: {
                onVisibleChange(v) {
                    this.show = v;
                    if (!v) {
                        this.blocks = [];
                        setTimeout(() => {
                            UB_IDE.removeExtComponent('subwindows', 'searchblock');
                        }, 0);
                    }
                }
            },
            mounted() {
            },
            template: data
        });
    });
});
OpenBlock.onInited(() => {
    OpenBlock.wsBuildCbs.push(function (workspace) {
        new searchblockComponent(workspace).init();
    });
    Blockly.Css.register(
        `.searchblock_btn {
          opacity: .2;
        }
          .searchblock_btn:hover {
            opacity: .4;
          }
          .searchblock_btn:active {
            opacity: .6;
          }`
    );
});

const GOTO_BLOCK_SVG_DATAURI =
    'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSIwIDAgMTgzLjc5MiAxODMuNzkyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAxODMuNzkyIDE4My43OTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KCTxwYXRoIGQ9Ik01NC43MzQsOS4wNTNDMzkuMTIsMTguMDY3LDI3Ljk1LDMyLjYyNCwyMy4yODQsNTAuMDM5Yy00LjY2NywxNy40MTUtMi4yNzEsMzUuNjA2LDYuNzQzLDUxLjIyCgljMTIuMDIzLDIwLjgyMywzNC40NDEsMzMuNzU5LDU4LjUwOCwzMy43NTljNy41OTksMCwxNS4xMzktMS4zMDgsMjIuMjg3LTMuODE4bDMwLjM2NCw1Mi41OTJsMjEuNjUtMTIuNWwtMzAuMzU5LTUyLjU4MwoJYzEwLjI1NS04Ljc3NCwxNy42MzgtMjAuNDExLDIxLjIwNy0zMy43M2M0LjY2Ni0xNy40MTUsMi4yNy0zNS42MDUtNi43NDQtNTEuMjJDMTM0LjkxOCwxMi45MzYsMTEyLjQ5OSwwLDg4LjQzMywwCglDNzYuNjQ1LDAsNjQuOTkyLDMuMTMsNTQuNzM0LDkuMDUzeiBNMTI1LjI5LDQ2LjI1OWM1LjY3Niw5LjgzMSw3LjE4NCwyMS4yODUsNC4yNDYsMzIuMjVjLTIuOTM4LDEwLjk2NS05Ljk3MSwyMC4xMy0xOS44MDIsMjUuODA2CgljLTYuNDYyLDMuNzMxLTEzLjc5Myw1LjcwMy0yMS4xOTksNS43MDNjLTE1LjE2MywwLTI5LjI4Ni04LjE0Ni0zNi44NTctMjEuMjU5Yy01LjY3Ni05LjgzMS03LjE4NC0yMS4yODQtNC4yNDUtMzIuMjUKCWMyLjkzOC0xMC45NjUsOS45NzEtMjAuMTMsMTkuODAyLTI1LjgwN0M3My42OTYsMjYuOTcyLDgxLjAyNywyNSw4OC40MzMsMjVDMTAzLjU5NywyNSwxMTcuNzE5LDMzLjE0NiwxMjUuMjksNDYuMjU5eiIgLz4KPC9zdmc+';

class ResultBlock {
    id;
    type;
    dest;
    jumpCallback;
}
class searchblockComponent {

    /**
     * The unique id for this component.
     * @type {string}
     */
    id = 'searchblockComponent';
    /**
     * Whether this has been initialized.
     * @type {boolean}
     * @private
     */
    initialized_ = false;
    /**
     * Width of the  control.
     * @type {number}
     * @const
     * @private
     */
    WIDTH_ = 32;

    /**
     * Height of the  control.
     * @type {number}
     * @const
     * @private
     */
    HEIGHT_ = 32;

    /**
     * Distance between  control and bottom or top edge of workspace.
     * @type {number}
     * @const
     * @private
     */
    MARGIN_VERTICAL_ = 20;

    /**
     * Distance between  control and right or left edge of workspace.
     * @type {number}
     * @const
     * @private
     */
    MARGIN_HORIZONTAL_ = 20;
    workspace_;
    dom;

    search(text) {
        text = text.trim();
        ui_data.searching = text;
        console.log(text);
        if (!text) {
            let topblocks = this.workspace_.getTopBlocks();
            ui_data.blocks = this.result(topblocks);
            ui_data.byID = [];
        } else {
            let allblocks = this.workspace_.getAllBlocks();
            let matched = [];
            allblocks.forEach(b => {
                if (b.id.indexOf(text) >= 0) {
                    matched.push(b);
                } else if (b.type.indexOf(text) >= 0) {
                    matched.push(b);
                } else if (b.toString().indexOf(text) >= 0) {
                    matched.push(b);
                }
            });
            ui_data.blocks = this.result(matched);
            ui_data.byID = this.searchByID(text);
        }
    }
    /**
     * 
     * @param {String} text 
     * @returns 
     */
    searchByID(text) {
        let compiled = OpenBlock.Compiler.compiled;
        let target = [];
        Object.values(compiled).forEach(mod => {
            if (!mod.analysed) {
                return;
            }
            let blockIdMap = mod.analysed.blockIdMap;
            if (!blockIdMap) {
                return;
            }
            if (blockIdMap[text]) {
                target = target.concat(blockIdMap[text]);
            }
        });
        return target;
    }
    result(blocks) {
        let r = [];
        blocks.forEach(block => {
            let rb = new ResultBlock();
            rb.id = block.id;
            rb.dest = block.toString();
            rb.type = block.type;
            rb.jumpCallback = () => {
                if (!this.workspace_.isMovable()) {
                    console.warn(
                        'Tried to move a non-movable workspace. This could result' +
                        ' in blocks becoming inaccessible.');
                    return;
                }
                let block = this.workspace_.getBlockById(rb.id);
                if (block) {
                    block.select();
                    OpenBlock.Utils.centerOnSingleBlock(this.workspace_, block.id);
                }
            }
            r.push(rb);
        });
        return r;
    }
    /**
     * Handle click event.
     * @private
     */
    onClick_() {
        let topblocks = this.workspace_.getTopBlocks();
        ui_data.blocks = this.result(topblocks);
        ui_data.searchCallback = (e) => {
            this.search(e.target.value);
        };
        ui_data.show = true;
        UB_IDE.ensureExtComponent('subwindows', 'searchblock');
    }
    constructor(workspace) {
        this.workspace_ = workspace;
    }
    init() {

        this.workspace_.getComponentManager().addComponent({
            component: this,
            weight: 2,
            capabilities: [Blockly.ComponentManager.Capability.POSITIONABLE],
        });
        this.createDom_();
        this.initialized_ = true;
    }

    dispose() {
        if (this.dom) {
            Blockly.utils.dom.removeNode(this.dom);
        }
        if (this.searchblock_btn) {
            Blockly.unbindEvent_(this.searchblock_btn);
        }
    }



    /**
     * Creates DOM for ui element.
     * @private
     */
    createDom_() {
        this.svgGroup_ = Blockly.utils.dom.createSvgElement(
            Blockly.utils.Svg.IMAGE, {
            'height': this.HEIGHT_ + 'px',
            'width': this.WIDTH_ + 'px',
            'class': 'searchblock_btn',
        });
        this.svgGroup_.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
            GOTO_BLOCK_SVG_DATAURI);

        Blockly.utils.dom.insertAfter(
            this.svgGroup_, this.workspace_.getBubbleCanvas());

        // Attach listener.
        this.searchblock_btn = Blockly.browserEvents.conditionalBind(
            this.svgGroup_, 'mousedown', null, this.onClick_.bind(this));
    }

    /**
     * Positions the element. Called when the window is resized.
     * @param {!MetricsManager.UiMetrics} metrics The workspace metrics.
     * @param {!Array<!Rect>} savedPositions List of rectangles that
     *     are already on the workspace.
    */
    position(metrics, savedPositions) {
        if (!this.initialized_) {
            return;
        }
        const hasVerticalScrollbars = this.workspace_.scrollbar &&
            this.workspace_.scrollbar.canScrollHorizontally();
        const hasHorizontalScrollbars = this.workspace_.scrollbar &&
            this.workspace_.scrollbar.canScrollVertically();

        if (metrics.toolboxMetrics.position === Blockly.TOOLBOX_AT_LEFT ||
            (this.workspace_.horizontalLayout && !this.workspace_.RTL)) {
            // Right corner placement.
            this.left_ = metrics.absoluteMetrics.left + metrics.viewMetrics.width -
                this.WIDTH_ - this.MARGIN_HORIZONTAL_;
            if (hasVerticalScrollbars && !this.workspace_.RTL) {
                this.left_ -= Blockly.Scrollbar.scrollbarThickness;
            }
        } else {
            // Left corner placement.
            this.left_ = this.MARGIN_HORIZONTAL_;
            if (hasVerticalScrollbars && this.workspace_.RTL) {
                this.left_ += Blockly.Scrollbar.scrollbarThickness;
            }
        }

        const startAtBottom =
            metrics.toolboxMetrics.position !== Blockly.TOOLBOX_AT_BOTTOM;
        if (startAtBottom) {
            // Bottom corner placement
            this.top_ = metrics.absoluteMetrics.top + metrics.viewMetrics.height -
                this.HEIGHT_ - this.MARGIN_VERTICAL_;
            if (hasHorizontalScrollbars) {
                // The horizontal scrollbars are always positioned on the bottom.
                this.top_ -= Blockly.Scrollbar.scrollbarThickness;
            }
        } else {
            // Upper corner placement
            this.top_ = metrics.absoluteMetrics.top + this.MARGIN_VERTICAL_;
        }

        // Check for collision and bump if needed.
        let boundingRect = this.getBoundingRectangle();
        for (let i = 0, otherEl; (otherEl = savedPositions[i]); i++) {
            if (boundingRect.intersects(otherEl)) {
                if (startAtBottom) { // Bump up.
                    this.top_ = otherEl.top - this.HEIGHT_ - this.MARGIN_VERTICAL_;
                } else { // Bump down.
                    this.top_ = otherEl.bottom + this.MARGIN_VERTICAL_;
                }
                // Recheck other savedPositions
                boundingRect = this.getBoundingRectangle();
                i = -1;
            }
        }

        this.svgGroup_.setAttribute('transform',
            'translate(' + this.left_ + ',' + this.top_ + ')');
    }


    /**
     * Returns the bounding rectangle of the UI element in pixel units relative to
     * the Blockly injection div.
     * @return {?Rect} The UI elements's bounding box. Null if
     *   bounding box should be ignored by other UI elements.
     */
    getBoundingRectangle() {
        return new Blockly.utils.Rect(
            this.top_, this.top_ + this.HEIGHT_,
            this.left_, this.left_ + this.WIDTH_);
    }
}
