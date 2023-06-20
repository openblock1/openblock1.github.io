/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

axios({
    url: 'js/htmls/logic/htmls.html',
    responseType: 'text',
    async: false
}).then(({ data }) => {
    let componentName = 'ob-logic-sider';
    let template = data;
    Vue.component(componentName, {
        data: function () {
            return {
                chartWindowTitle: null,
                chart: null,
                fsmCreateSeries: null
            }
        },
        methods: {
            clear() {
                this.chartWindowTitle = null;
                if (this.chart) {
                    this.chart.dispose();
                    this.chart = null;
                }
            },
            /**
             * 
             * @param {*} fsm 
             * @param {StateAnalysesResultFSM} analysed 
             * @returns {{stateNodes:Object[],links:Object[]}}
             */
            makeStateSeries(src, fsm, analysed) {
                /**
                 * 
                 * nodes:
                {
                    label() {
                        return "Point A";
                    },
                    tooltip() {
                        return "tooltip A"
                    },
                    onclick() {
                        alert("A");
                    },
                    "id": "0",
                    "name": "A",
                    "category": 0
                }
                * links:
                                {
                                    "source": "1",
                                    "target": "0",
                                    label() {
                                        return "1-0";
                                    },
                                    tooltip() {
                                        return "TOOLTIP 1-0";
                                    },
                                    onclick() {
                                        alert("1-0");
                                    }
                                }
                 */
                let stateNodes = [];
                let links = []
                let root = this.$root;
                let self = this;
                Object.values(fsm.states).forEach(s => {
                    s.category = s === fsm.states[0] ? 0 : 1;
                    s.id = s.name;
                    let onclick = () => {
                        root.selectState(src, fsm, s);
                    };
                    s.onclick = onclick;
                    stateNodes.push(s);
                    if (analysed.states[s.name]) {
                        let state = analysed.states[s.name];
                        let outlinks = state.relevantStates;
                        outlinks.forEach(target => {
                            let l = {
                                target,
                                source: s.name,
                                onclick,
                                symbolSize: 15,
                                lineStyle: {
                                    color: '#ccf'
                                },
                            }
                            links.push(l);
                            let targetState = analysed.states[target];
                            let targetState1 = OpenBlock.getStateByName(fsm, targetState.name);
                            if (targetState.popBack) {
                                l = {
                                    target: s.name,
                                    source: target,
                                    lineStyle: {
                                        color: '#cee'
                                    },
                                    onclick() {
                                        root.selectState(src, fsm, targetState1);
                                    },
                                }
                                links.push(l);
                            } else {
                                // l.symbol = ['none', 'arrow'];
                            }
                        });
                    }
                });
                return { stateNodes, links };
            },
            makeFSMCreateTreeSeries(series) {
                let compiled = OpenBlock.Compiler.compiled;
                // let allTree = {};
                let addedFSM = {};
                let data = [];
                let links = [];
                let that = this;
                Object.values(compiled).forEach(c => {
                    Object.keys(c.analysed.FSMCreateTree.staticFunctions).forEach(funcFullname => {
                        let staticFunc = c.analysed.FSMCreateTree.staticFunctions[funcFullname];
                        staticFunc.points.forEach(point => {
                            /**
                             * @type {FunctionTreeDataUtil}
                             */
                            let util = OpenBlock.FunctionTreeDataUtil;
                            let targetFSMFullname = point.targetFSMName;
                            let func = util.functions[funcFullname];
                            func.deepCalled.forEach(called => {
                                let caller = util.functions[called];
                                if (caller.fsmFullname) {
                                    let link = {
                                        "source": caller.fsmFullname,
                                        "target": targetFSMFullname,
                                        "lineStyle": {
                                            "type": [5, 10]
                                        }
                                    };
                                    links.push(link);
                                }
                            });
                        });
                    });
                    Object.keys(c.analysed.FSMCreateTree.fsm).forEach(fsmidx => {
                        let fsm1 = c.analysed.FSMCreateTree.fsm[fsmidx];
                        let fullname = c.header.name + '.' + fsmidx;
                        let node = addedFSM[fullname] || {
                            name: fullname, id: fullname, label: fullname,
                            onclick() {
                                that.showFSMCreateTree(c.header.name, fsmidx)
                            }
                        };
                        if (!addedFSM[fullname]) {
                            data.push(node);
                            addedFSM[fullname] = node;
                        }
                        Object.keys(fsm1).forEach(stateIdx => {
                            let state = fsm1[stateIdx];
                            state.points.forEach(code => {
                                let targetFSMFullname = code.targetFSMName;
                                let targetModule = targetFSMFullname.substring(0, targetFSMFullname.indexOf('.'));
                                let targetFSM = targetFSMFullname.substring(targetFSMFullname.indexOf('.') + 1);
                                if (!addedFSM[targetFSMFullname]) {
                                    let t = {
                                        name: targetFSMFullname,
                                        id: targetFSMFullname,
                                        label: targetFSMFullname,
                                        onclick() {
                                            that.showFSMCreateTree(targetModule, targetFSM)
                                        }
                                    };
                                    addedFSM[targetFSMFullname] = t;
                                    data.push(t);
                                }
                                let link = {
                                    "source": fullname,
                                    "target": targetFSMFullname,
                                };
                                links.push(link);
                            });
                        });
                    });
                });
                series.links = links;
                series.data = data;
                this.fsmCreateSeries = series;
            },
            showFSMCreateTree(file, fsm) {
                if (!OpenBlock.Compiler.compiled[file]) {
                    this.$Message.error(OpenBlock.i('编译失败'));
                    return;
                }
                if (!this.fsmCreateSeries) {
                    this.$Message.error(OpenBlock.i('需要编译'));
                    return;
                }
                if (!this.chart) {
                    var chartDom = this.$refs.chart;
                    // var myChart = echarts.init(chartDom);
                    var myChart = echarts.init(chartDom, null, { renderer: 'canvas' });

                    myChart.on('click', function (params) {
                        if (params.data.onclick && typeof (params.data.onclick) === 'function') {
                            params.data.onclick();
                        }
                    });
                    this.chart = myChart;
                }
                let fullname = file + '.' + fsm;
                this.fsmCreateSeries.data.forEach(node => {
                    if (node.name === fullname) {
                        node.itemStyle = {
                            color: '#f66'
                        }
                    } else {
                        delete node.itemStyle;
                    }
                });
                this.fsmCreateSeries.links.forEach(link => {
                    if (link.source === fullname) {
                        link.lineStyle = link.lineStyle || {};
                        link.lineStyle.color = '#cee'
                        link.lineStyle.width = 4;
                        link.symbolSize = 15;
                        link.value = 10;
                    } else if (link.target === fullname) {
                        link.lineStyle = link.lineStyle || {};
                        link.lineStyle.color = '#ccf'
                        link.lineStyle.width = 4;
                        link.symbolSize = 15;
                        link.value = 10;
                    } else {
                        if (link.lineStyle) {
                            delete link.lineStyle.color;
                            delete link.lineStyle.width;
                        }
                        link.symbolSize = 8;
                        link.value = 1;
                    }
                });
                let option = { series: this.fsmCreateSeries };
                this.chart.setOption(option);
                this.chartWindowTitle = OpenBlock.i('构建图谱');
            },
            showStateTransition(file, fsm) {
                if (!OpenBlock.Compiler.compiled[file.name]) {
                    this.$Message.error(OpenBlock.i('编译失败'));
                    return;
                }
                let analysed_m = OpenBlock.Compiler.compiled[file.name].analysed.StateTransition;
                let analysed = analysed_m.fsm[fsm.name];
                let series = this.makeStateSeries(file, fsm, analysed);
                this.chartWindowTitle = OpenBlock.i('状态转换概览');

                var chartDom = this.$refs.chart;
                var myChart = echarts.init(chartDom, null, { renderer: 'canvas' });
                var option = {
                    title: {
                        text: file.name + "." + fsm.name,
                        top: 'bottom',
                        left: 'right'
                    },
                    // tooltip: {},
                    tooltip: {
                        show: true,
                        formatter(param) {
                            if (param.data) {
                                let t = typeof (param.data.tooltip);
                                if (t === 'function') {
                                    return param.data.tooltip();
                                }
                                return param.data.tooltip;
                            }
                        }
                    },
                    series: [
                        {
                            name: fsm.name,
                            type: 'graph',
                            // initLayout: 'circular',
                            layout: 'force',
                            force: {
                                // initLayout: 'circular',
                                repulsion: 800
                            },
                            edgeSymbol: ['none', 'arrow'],
                            roam: true,
                            symbolSize: 30,
                            edgeSymbolSize: [4, 10],
                            lineStyle: {
                                opacity: 0.9,
                                width: 2,
                                curveness: 0.2
                            },
                            edgeLabel: {
                                show: false,
                                formatter(param) {
                                    if (param.data) {
                                        let t = typeof (param.data.label);
                                        if (t === 'function') {
                                            return param.data.label();
                                        }
                                        return param.data.name;
                                    }
                                }
                            },
                            label: {
                                show: true,
                                // position: "right"
                                formatter(param) {
                                    if (param.data) {
                                        let t = typeof (param.data.label);
                                        if (t === 'function') {
                                            return param.data.label();
                                        }
                                        return param.data.name;
                                    }
                                }
                            },
                            // 高亮样式。
                            emphasis: {
                                focus: 'adjacency',
                                itemStyle: {
                                    // 高亮时点的颜色。
                                    // color: 'blue'
                                },
                                label: {
                                    show: true,
                                    // 高亮时标签的文字。
                                    // formatter: 'This is a emphasis label.'
                                },
                                lineStyle: {
                                    // width: 10
                                },
                                edgeLabel: {
                                    show: true,
                                    // width: 10,
                                    formatter(param) {
                                        if (param.data) {
                                            let t = typeof (param.data.label);
                                            if (t === 'function') {
                                                return param.data.label();
                                            }
                                            return param.data.label;
                                        }
                                    }
                                },
                            },
                            data: series.stateNodes,
                            links: series.links,
                            categories: [
                                {
                                    name: '初始状态'
                                },
                                {
                                    name: '状态'
                                },
                                {
                                    name: '消息'
                                },
                                {
                                    name: '事件'
                                },
                                {
                                    name: '函数'
                                },
                            ],
                        }
                    ]
                };
                // 使用刚指定的配置项和数据显示图表。
                myChart.setOption(option);

                myChart.on('click', function (params) {
                    if (params.data.onclick && typeof (params.data.onclick) === 'function') {
                        params.data.onclick();
                    }
                });
                this.chart = myChart;
            }
        },
        template: template,
        mounted() {
            let that = this;
            OpenBlock.Linker.onFinished(() => {
                let series = {
                    name: '',
                    type: 'graph',
                    // initLayout: 'circular',
                    layout: 'force',// 'circular',//'force',
                    force: {
                        // initLayout: 'circular',
                        autoCurveness: true,
                        repulsion: 500,
                        // gravity: 1,
                        edgeLength: [10, 100],
                    },
                    draggable: true,
                    edgeSymbol: ['none', 'arrow'],
                    roam: true,
                    symbolSize: 30,
                    edgeSymbolSize: [4, 10],
                    lineStyle: {
                        opacity: 1,
                        width: 2,
                        curveness: 0.1,
                        color: '#eee',
                    },
                    edgeLabel: {
                        show: false,
                        formatter(param) {
                            if (param.data) {
                                let t = typeof (param.data.label);
                                if (t === 'function') {
                                    return param.data.label();
                                }
                                return param.data.name;
                            }
                        }
                    },
                    label: {
                        show: true,
                        // position: "right"
                        formatter(param) {
                            if (param.data) {
                                let t = typeof (param.data.label);
                                if (t === 'function') {
                                    return param.data.label();
                                }
                                return param.data.name;
                            }
                        }
                    },
                    // 高亮样式。
                    emphasis: {
                        focus: 'adjacency',
                        itemStyle: {
                            // 高亮时点的颜色。
                            // color: 'blue'
                        },
                        label: {
                            show: true,
                            // 高亮时标签的文字。
                            // formatter: 'This is a emphasis label.'
                        },
                        lineStyle: {
                            // width: 10
                        },
                        edgeLabel: {
                            show: true,
                            // width: 10,
                            formatter(param) {
                                if (param.data) {
                                    let t = typeof (param.data.label);
                                    if (t === 'function') {
                                        return param.data.label();
                                    }
                                    return param.data.label;
                                }
                            }
                        },
                    },
                };
                that.makeFSMCreateTreeSeries(series);
            });
        }
    });
    OpenBlock.onInited(() => {
        UB_IDE.addSiderComponent({ name: componentName, icon: 'md-analytics', tooltip: '逻辑', priority: 0 });
        UB_IDE.siderUsing = componentName;
    });
});