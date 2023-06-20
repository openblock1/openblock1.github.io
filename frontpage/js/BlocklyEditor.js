/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

 (function () {
    Vue.component('blockly-editor', {
        props: ['value', 'builder', 'beforedestroy'],
        data: function () {
            let self = this;
            Vue.nextTick(function () {
                let dom = document.getElementById(self.sn);
                let builder = self.builder;
                let content = builder(dom, self);
                self.dom = dom;
                self.content = content;
            });
            return {
                sn: OpenBlock.Utils.makeSN(),
                dom: null,
                content: null
            };
        },
        computed: {
        },
        methods: {
        },
        beforeDestroy() {
            if (this.beforedestroy) {
                this.beforedestroy(this.content);
            }
        },
        template: '<div class="blocklyWorkspace" :id="sn">{{sn}},{{value.name}}</div>'
    });
})();