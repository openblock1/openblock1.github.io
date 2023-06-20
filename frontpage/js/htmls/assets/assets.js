
/**
 * @license
 * Copyright 2022 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
OpenBlock.onInited(() => {
    let acceptType = [OpenBlock.Utils.imgsuffixs.join(','), OpenBlock.Utils.soundsuffixs.join(','), OpenBlock.Utils.videosuffixs.join(',')].join(',');
    VFS.partition.assets = new VFS(new VFSMemoryCache());
    Vue.component('asset-item-image', (resolve) => {
        axios.get('js/htmls/assets/image.html').then(({ data }) => {
            resolve({
                template: data,
                props: ['file'],
                data() {
                    return {};
                },
                methods: {
                    makeSrc() {
                        let base64 = OpenBlock.Utils.arrayBufferToBase64(this.file.content);
                        let fileType = this.file.fileType.substring(1);
                        return 'data:image/' + fileType + ';base64,' + base64;
                    }
                }
            });
        });
    });
    Vue.component('assets-window', (resolve, reject) => {
        axios.get('js/htmls/assets/htmls.html').then(({ data }) => {
            resolve(
                {
                    data: function () {
                        return {
                            enabled: true,
                            search: {
                                name: "",
                                types: ['image', 'sound'/*, 'video'*/]
                            },
                            assetsList: [],
                        };
                    },
                    template: data,
                    methods: {
                        searchResult(file) {
                            if (file.name.indexOf(this.search.name) == -1) {
                                return false;
                            }
                            if (this.search.types.indexOf(file.mediaType) > -1) {
                                return true;
                            }
                            return false;
                        },
                        uploadFiles() {
                            FileInterface.uploadFiles(acceptType, 'ArrayBuffer', (arrayBufferArray) => {
                                console.log(arrayBufferArray);
                                VFS.partition.assets.putAll(arrayBufferArray);
                            }, true);
                        },
                        addFiles(filelist) {

                            filelist.forEach(file => {
                                let item = this.assetsList.find(i => i.name === file.name);
                                if (item) {
                                    item.content = file.content;
                                } else {
                                    item = { name: file.name, content: file.content };
                                    this.assetsList.push(item);
                                    /**
                                     * @type {String}
                                     */
                                    let filename = file.name;
                                    filename = filename.toLowerCase();
                                    item.mediaType = OpenBlock.Utils.mediaType(filename);
                                    item.fileType = OpenBlock.Utils.fileType(filename);
                                    item.componentName = 'asset-item-' + item.mediaType;
                                }
                            });
                        },
                        deleteFile(filename) {
                            VFS.partition.assets.delete(filename);
                        }
                    },
                    mounted() {
                        let assetsvfs = VFS.partition.assets;
                        assetsvfs.allFiles(filelist => {
                            this.addFiles(filelist);
                        });
                        assetsvfs.on('put', (filelist) => {
                            this.addFiles(filelist);
                        });
                        assetsvfs.on('delete', (fileinfo) => {
                            let idx = this.assetsList.findIndex(i => i.name === fileinfo.name);
                            if (idx >= 0) {
                                this.assetsList.splice(idx, 1);
                            }
                        });
                        assetsvfs.on('deleteAll', () => {
                            this.assetsList = [];
                        });
                    }
                });
        });
    });
    UB_IDE.ensureSiderComponent({ name: 'assets-window', icon: 'ios-folder', tooltip: OpenBlock.i('资源'), priority: 2 });
});