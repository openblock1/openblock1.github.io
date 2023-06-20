/**
 * @license
 * Copyright 2022 Du Tian Wei
 * SPDX-License-Identifier: Apache-2.0
 */
OpenBlock.registerNativeEvents([
    { "name": "animationframe" },
    { "name": "click", "argType": "Vector2" },
    { "name": "touchstart", "argType": "Vector2" },
    { "name": "touchmove", "argType": "Vector2" },
    { "name": "touchcancel", "argType": "Vector2" },
    { "name": "touchend", "argType": "Vector2" },
    { "name": "mousemove", "argType": "Vector2" },
    { "name": "longpress", "argType": "Vector2" },
    { "name": "swipe" },
    { "name": "windowResize" },
    { "name": "keydown", "argType": "String" },
    { "name": "keyup", "argType": "String" },
    { "name": "network_peer_join", "argType": "Network_target" },
    { "name": "network_peer_leave", "argType": "Network_target" },
]);
