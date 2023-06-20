/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

(function () {
    OpenBlock.onInited(() => {
        StructField.prototype.getValue = function (data) {
            let rtype = this.type.registerType();
            let register = data.registers[rtype];
            let value = register[this.registerIndex];
            return value;
        }
        StructField.prototype.component = function () {
            if (this.type instanceof StructFieldTypeStruct) {
                return 'data-viewer-cell-struct';
            }
            return 'data-viewer-cell-base';
        }
    });
    Vue.component('data-viewer-cell-struct', {
        props: ['value', "field"],
        data() {
            if (this.field.type.isCollection()) {
                let obj = this.field.getValue(this.value);
                return { id: Object.keys(obj), name: this.field.type.elementType.name };
            } else {
                let obj = this.field.getValue(this.value);
                let registers = obj.registers;
                if (!registers) {
                    debugger
                }
                let integerR = registers.integer;
                let id = integerR[0];
                return { id, name: this.field.type.name };
            }
        },
        template: '<a @click="$root.openDataTab(name)"><icon type="md-filing"></icon>{{name}}:{{id}}</a>'
    });
    Vue.component('data-viewer-cell-base', {
        props: ['value', "field"],
        data() {
            return {};
        },
        template: '<span>{{field.getValue(value)}}</span>'
    });
    let template;
    axios({
        url: 'js/DataViewer.html',
        responseType: 'text',
        async: false,
    }).then(({ data }) => {
        template = data;
        Vue.component('data-viewer', {
            props: ['value', 'builder', 'beforedestroy'],
            data: function () {
                let sn = OpenBlock.Utils.makeSN()
                Vue.nextTick(function () {
                    let dom = document.getElementById(sn);
                    self.dom = dom;
                });

                // let content = OpenBlock.DataImporter.dataReorganizingContext.compiled[this.value];
                // let structDef = OpenBlock.DataImporter.dataReorganizingContext.structAST[this.value];
                return {
                    sn,
                    dom: null,
                    // content,
                    // structDef
                    importer: OpenBlock.DataImporter,
                    page: {
                        current: 1,
                        size: 10,
                        sizeOpt: [10, 20, 30, 50, 70, 100, 500, 2000, 10000]
                    }
                };
            },
            computed: {
            },
            methods: {
                onpagechange(p) {
                    this.page.current = p;
                },
                onpagesizechange(s) {
                    this.page.size = s;
                }
            },
            beforeDestroy() {
                if (this.beforedestroy) {
                    this.beforedestroy(this.content);
                }
            },
            template
        });
    });
})();