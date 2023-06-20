/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

 OpenBlock.StubToolbox = {};
/**
 * @param {Document} xml xml dom
 */
OpenBlock.StubToolbox.injectCategory = function (xml) {
    let mainCate = document.createElement('category')
    mainCate.setAttribute('name', '高级');
    mainCate.setAttribute('categorystyle','native_call_category');
    xml.appendChild(mainCate);
    let libs = OpenBlock.nativefunctions.custom;
    for (let libname in libs) {
        let lib = libs[libname];
        if (lib.length > 0) {
            let subCate = document.createElement('category')
            subCate.setAttribute('name', libname);
            mainCate.appendChild(subCate);
            {
                for (let idx = 0; idx < lib.length; idx++) {
                    let f = lib[idx];
                    let blk = document.createElement('block');
                    blk.setAttribute('type', 'native_call');
                    let mutation = document.createElement('mutation');
                    let txt = encodeURI(JSON.stringify({ func: f, ignoreReturnValue: false }))
                    mutation.textContent = txt;
                    blk.appendChild(mutation);
                    subCate.appendChild(blk);
                }
            }
        }
    }
}