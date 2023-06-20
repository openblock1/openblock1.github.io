class CreateFSMCMD {
    /**
     * @type {String}
     */
    blockId;
    /**
     * @type {String}
     */
    targetFSMName;
    /**
     * @type {CreateFSM}
     */
    init(code) {
        this.blockId = code.blockId;
        this.targetFSMName = code.fsmTypeName.text;
        return this;
    }
}
Serializable(CreateFSMCMD);