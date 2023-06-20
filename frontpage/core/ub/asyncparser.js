/**
 * @license
 * Copyright 2021 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */

 (function () {
    OpenBlock.AsyncParser = {};

    /**
     * 异步分析的setTimeout
     */
    OpenBlock.AsyncParser.TimeoutHandler = 0;

    /**
     * 分析的延迟
     */
    OpenBlock.AsyncParser.WaitingTime = 10000;
    OpenBlock.AsyncParser.ParseNow = function (workspaceId) {
        clearTimeout(OpenBlock.AsyncParser.TimeoutHandler);
        OpenBlock.AsyncParser.TimeoutHandler = 0;
        var workspace = Blockly.Workspace.getById(workspaceId);
        if(workspace!=null){
            OpenBlock.BlocklyParser.parseFromWorkspace(workspace);
        }
    };
    OpenBlock.AsyncParser.SetTimeout = function (workspaceId) {
        clearTimeout(OpenBlock.AsyncParser.TimeoutHandler);
        OpenBlock.AsyncParser.TimeoutHandler =
            setTimeout(OpenBlock.AsyncParser.ParseNow, OpenBlock.AsyncParser.WaitingTime, workspaceId);
    };
})();