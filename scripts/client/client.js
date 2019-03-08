const system = client.registerSystem(0, 0);

system.initialize = function () {
    this.listenForEvent("minecraft:client_entered_world", () =>
        this.broadcastEvent("minecraft:display_chat_event", "It works!"))
}