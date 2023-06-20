/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

 (function () {

    var openFileInputId = 0;

    /**
     * 
     * @param {string} fileName 
     * @param {string|Blob} content 
     */
    function SaveFile(fileName, content) {
        var aLink = document.createElement('a');
        var blob = typeof (content) === 'string' ? new Blob([content], {
            type: 'application/octet-stream'
        }) : content;
        aLink.download = fileName;
        aLink.innerHTML = "download";
        aLink.href = URL.createObjectURL(blob);
        document.body.appendChild(aLink);
        aLink.click();
        aLink.parentNode.removeChild(aLink);
    }
    var openFileInput = null;

    /**
     * 
     * @param {string} acceptType  file postfix
     * @param {string} filetype  "text"/"ArrayBuffer/File"
     * @param {function(data)} callback filetype text:string , filetype ArrayBuffer:ArrayBuffer , File File
     */
    function createOpenFileInput(acceptType, filetype, callback, multiple) {
        openFileInput = document.createElement('input');
        openFileInput.setAttribute('type', 'file');
        openFileInput.setAttribute('style', 'display:none');
        openFileInput.setAttribute('accept', acceptType);
        if (multiple) {
            openFileInput.setAttribute('multiple', true);
        }

        document.body.append(openFileInput);
        openFileInput.addEventListener('change', function () {
            if (openFileInput.files.length === 0) {
                return;
            }
            if (filetype === 'File') {
                if (multiple) {
                    let files = [];
                    for (let i = 0; i < openFileInput.files.length; i++) {
                        files.push(openFileInput.files[i]);
                    }
                    openFileInput.remove();
                    callback(files);
                } else {
                    openFileInput.remove();
                    callback(openFileInput.files[0]);
                }
                return;
            }
            if (multiple) {
                let files = [];
                let f = function (ProgressEvent) {
                    let file = this;
                    let reader = ProgressEvent.currentTarget
                    let r = reader.result;
                    let fileName = file.name;
                    files.push({ name: fileName, content: r });
                    if (files.length === openFileInput.files.length) {
                        openFileInput.remove();
                        callback(files);
                    }
                };
                for (let i = openFileInput.files.length - 1; i >= 0; i--) {
                    let reader;
                    let file;
                    switch (filetype) {
                        case 'text':
                            reader = new FileReader();
                            file = openFileInput.files[i];
                            reader.onloadend = f.bind(file);
                            reader.readAsText(file);
                            break;
                        case 'ArrayBuffer':
                            reader = new FileReader();
                            file = openFileInput.files[i];
                            reader.onloadend = f.bind(file);
                            reader.readAsArrayBuffer(file);
                            break;
                    }
                }
            } else {
                let r = function (f) {
                    var reader = new FileReader();
                    reader.onloadend = function (e) {
                        openFileInput.remove();
                        callback({ name: openFileInput.files[0].name, content: reader.result });
                    };
                    switch (filetype) {
                        case 'text':
                            reader.readAsText(f);
                            break;
                        case 'ArrayBuffer':
                            reader.readAsArrayBuffer(f);
                            break;
                    }
                }
                r(openFileInput.files[0]);
            }
            // createOpenFileInput(acceptType, filetype, callback, multiple);
        });
    }

    /**
     * 
     * @param {string} acceptType  file postfix
     * @param {string} filetype  "text"/"ArrayBuffer/File"
     * @param {function(data)} callback filetype text:string , filetype ArrayBuffer:ArrayBuffer , File File
     * @param {bool} multiple allow mutiple files
     */
    function OpenFile(acceptType, filetype, callback, multiple) {
        createOpenFileInput(acceptType, filetype, callback, !!multiple);
        openFileInput.click();
    }

    var FileOD = {};

    /**
     * 
     * @param {string} acceptType  file postfix
     * @param {string} filetype  "text"/"ArrayBuffer/File"
     * @param {function(data)} callback filetype text:string , filetype ArrayBuffer:ArrayBuffer , File File
     * @param {bool} multiple allow mutiple files
     */
    FileOD.Open = OpenFile;
    /**
     * 
     * @param {string} fileName 
     * @param {string} content 
     */
    FileOD.Save = SaveFile;
    window.FileOD = FileOD;
})();