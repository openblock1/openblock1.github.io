(function () {
    VFS.partition.config = new VFS(new VFSMemoryCache());
    VFS.partition.config.put('project.json', { name: '' });
})();
