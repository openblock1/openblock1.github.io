/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
OpenBlock.loadJSAsync("../iframeconnector/iframeconnector.js").then(function () {
    OpenBlock.onInited(() => {
        let simulator = new Simulator();
        OpenBlock.addConnector(simulator);
        UB_IDE.$Message.info(OpenBlock.i('正在打开工程，请稍后'));
        OpenBlock.Utils.handleUrlHash(() => {
            simulator.loading = true;
            showOverallLoading();
        }, () => {
            simulator.loading = false;
            hideOverallLoading();
            UB_IDE.$Message.success(OpenBlock.i('工程加载完成'));
        });
    });
});