const system = client.registerSystem(0, 0);

var player = null;

system.initialize = function () {
    this.listenForEvent("minecraft:client_entered_world", event => {
        player = event.player;
        this.broadcastEvent("eggwatch:player_joined_world", event);
    });
    
    this.listenForEvent("eggwatch:player_chat", event => {
        if (player) {
            if (player.id === event.player)
                this.broadcastEvent("minecraft:display_chat_event", event.text);
        }
    });
}