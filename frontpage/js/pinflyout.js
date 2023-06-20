const PIN_FLYOUT_SVG_DATAURI = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAyOTcgMjk3IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAyOTcgMjk3OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPHBhdGggZD0iTTEyMy40MTksMTU3LjA4OWwxNC41MjEsMTMwLjY5MmMwLjU4Myw1LjI0OCw1LjAyLDkuMjE5LDEwLjMwMSw5LjIxOWM1LjI4MSwwLDkuNzE3LTMuOTcxLDEwLjMtOS4yMTlsMTQuNTIxLTEzMC42OTIKCQlIMTIzLjQxOXoiLz4KCTxwYXRoIGQ9Ik0yMzIuNzg2LDk2LjM5YzAtMi4yNDMtMC43MjItNS4zMjEtMi4wNjctNy4xMTZsLTIyLjg4NC0zNC4wOHYtNDQuODNDMjA3LjgzNSw0LjY0MSwyMDMuMTk0LDAsMTk3LjQ3MSwwSDk5LjE1NgoJCWMtNS43MjMsMC0xMC4zNjMsNC42NDEtMTAuMzYzLDEwLjM2M3Y0NC44M2wtMjIuNTA2LDM0LjA4Yy0xLjM0NiwxLjc5NS0yLjA3Myw0Ljg3My0yLjA3Myw3LjExNnYzNi4zNDQKCQljMCw1LjcyNCw0LjY0MSwxMC4zNjQsMTAuMzY0LDEwLjM2NGgxNDcuODQ0YzUuNzI0LDAsMTAuMzY0LTQuNjQxLDEwLjM2NC0xMC4zNjRWOTYuMzl6Ii8+CjwvZz4KPC9zdmc+';
class PinFlyout {

    /**
     * The unique id for this component.
     * @type {string}
     */
    id = 'PinFlyout';
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

    /**
     * Handle click event.
     * @private
     */
    onClick_() {
        let flyout = this.workspace_.getFlyout();
        flyout.autoClose = !flyout.autoClose;
        if (flyout.autoClose) {
            Blockly.utils.dom.removeClass(this.svgGroup_, "noAutoClose");
        } else {
            Blockly.utils.dom.addClass(this.svgGroup_, "noAutoClose");
        }
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
            'class': 'pinflyout',
        });
        this.svgGroup_.setAttributeNS(Blockly.utils.dom.XLINK_NS, 'xlink:href',
            PIN_FLYOUT_SVG_DATAURI);

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

OpenBlock.onInited(() => {
    Blockly.Css.register(
        `.pinflyout {
            opacity: .2;
          }
        .pinflyout:hover {
          opacity: .4;
        }
        .pinflyout:active {
          opacity: .6;
        }
        .pinflyout.noAutoClose{
            opacity: 1;
        }
        `
    );
    OpenBlock.wsBuildCbs.push((ws) => {
        new PinFlyout(ws).init();
    });
});