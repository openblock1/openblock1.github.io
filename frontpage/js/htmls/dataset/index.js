/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

Vue.component('ob-dataset-sider', (resolve, reject) => {
    axios({
        url: 'js/htmls/dataset/htmls.html',
        responseType: 'text'
    }).then(({ data }) => {
        let template = data;
        resolve({
            data: function () {
                return {
                    importer: OpenBlock.DataImporter
                }
            },
            template: template
        });
    });
}
);
OpenBlock.onInited(() => {
    UB_IDE.addSiderComponent({ name: 'ob-dataset-sider', icon: 'md-filing', tooltip: OpenBlock.i('数据'), priority: 1 });
});