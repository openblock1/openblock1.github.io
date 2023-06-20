/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
// ++++ for OpenHarmony +++
// import util from '@ohos.util'
// let _TextDecoder = util.TextDecoder;
// ---- for OpenHarmony ---

// ++++ for nodejs +++
// import util from 'util'
// let _TextDecoder = util.TextDecoder;
// ---- for nodejs ---

let _TextDecoder = TextDecoder;
let _TextEncoder = TextEncoder;

/**
 *   let url= arrayBufferToBase64(response);
 *   document.getElementById('img').src='data:image/jpeg;base64,'+url;
 * @param {ArrayBuffer} buffer 
 * @returns 
 */
function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
/**
 * 
 * @param {String} name 
 * @param {String[]} suffixs 
 * @returns 
 */
function endsWith(name, suffixs) {
    for (i = 0; i < suffixs.length; i++) {
        if (name.endsWith(suffixs[i])) {
            return true;
        }
    }
    return false;
}
/**
 * 
 * @param {String} name 必须小写
 * @returns 
 */
function mediaType(name) {
    /**
     * @type String
     */
    if (OpenBlock.Utils.endsWith(name, soundsuffixs)) {
        return 'sound';
    }
    if (OpenBlock.Utils.endsWith(name, imgsuffixs)) {
        return 'image';
    }
    if (OpenBlock.Utils.endsWith(name, videosuffixs)) {
        return 'video';
    }
    console.warn('Unknown mediaType:' + filename);
    return 'Unknown';
}
/**
 * 
 * @param {String} filename 必须小写
 * @returns 
 */
function fileType(filename) {
    let idx = filename.lastIndexOf('.');
    if (idx >= 0) {
        return filename.substring(idx);
    } else {
        return "";
    }
}
export { _TextDecoder as TextDecoder, _TextEncoder as TextEncoder, arrayBufferToBase64, fileType, mediaType, endsWith };