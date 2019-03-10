const system = server.registerSystem(0, 0);

const pets = [
    {
        kind: "cat",
        greeting: "Meow!",
        food: ["fish", "salmon"],
    },
    {
        kind: "donkey",
        greeting: "Eee-aaaah!",
        food: ["wheat", "sugar", "apple", "golden_carrot", "golden_apple"],
    },
    {
        kind: "horse",
        greeting: "Houyhnhnm!",
        food: ["wheat", "sugar", "apple", "golden_carrot", "golden_apple"],
    },
    {
        kind: "llama",
        greeting: "Buh-whaaaaa!",
        food: ["wheat"],
    },
    {
        kind: "wolf",
        greeting: "Arf!",
        food: ["bone"],
    }
]

const ticksPerSecond = 20;

var ticks = 0;

var gameSetup = false;

var players = [];

var queryAll = null;

system.initialize = function () {
    this.listenForEvent("eggwatch:player_joined_world", event => players.push({
        entity: event.player,
        name: this.getComponent(event.player, "minecraft:nameable").data.name,
        pet: { state: "none" },
        joinedAt: ticks,
    }));

    queryAll = this.registerQuery();
}

system.update = function () {
    ticks++;

    if (gameSetup) {
        this.gameUpdate();
    } else if (players.length > 0) {
        this.broadcastEvent("minecraft:execute_command", "/gamerule doMobLoot false");
        this.broadcastEvent("minecraft:execute_command", "/gamerule doMobSpawning false");
        this.broadcastEvent("minecraft:execute_command", "/gamerule doWeatherCycle false");
        this.broadcastEvent("minecraft:execute_command", "/gamerule doDaylightCycle false");

        this.gameCleanup();

        gameSetup = true
    }
}

system.gameUpdate = function () {
    for (let player of players) {
        if (player.pet.state == "none" && player.joinedAt + ticksPerSecond * 3 == ticks) {
            const pet = pets[random(0, pets.length - 1)];

            const name = generateName();
            const entity = this.createEntity("entity", "minecraft:" + pet.kind);

            const nameable = this.getComponent(entity, "minecraft:nameable");
            nameable.data.name = name;
            nameable.data.alwaysShow = true;
            this.applyComponentChanges(entity, nameable);

            // this.broadcastEvent("minecraft:execute_command",
            //     "/tp @a[name=Wigglewip] ~ ~ ~ facing @e[name=" + name + "]");

            this.playerMessage(player.entity,
                "Your " + bold(rainbow("Eggwatch")) + " pet " + pet.kind + " " + bold(name) +
                " has been summoned!");

            const lookat = this.createComponent(player.entity, "minecraft:lookat");
            lookat.data.filters = entity;
            this.applyComponentChanges(player.entity, lookat);

            player.pet = {
                template: pet,
                entity: entity,
                name: name,
                state: "wild",
            };
        } else if (player.pet.state == "wild" && player.joinedAt + ticksPerSecond * 5 == ticks) {
            this.playerMessage(player.entity, bold(player.pet.name) + " says " + player.pet.template.greeting);
        } else if (player.pet.state == "wild" && player.joinedAt + ticksPerSecond * 8 == ticks) {
            const food = player.pet.template.food[random(0, player.pet.template.food.length)];

            this.broadcastEvent("minecraft:execute_command",
                "/give " + player.name + " " + food + " 10");

            this.playerMessage(player.entity,
                "Use the " + bold(food.replace("_", " ")) + " that you have been given to tame " +
                bold(player.pet.name) + "!");
        }
    }
}

system.gameCleanup = function () {
    this.broadcastEvent("minecraft:execute_command", "/clear @p");

    const entities = this.getEntitiesFromQuery(queryAll);

    for (let entity of entities) {
        if (entity.__identifier__ !== "minecraft:player")
            this.destroyEntity(entity);
    }
}

system.playerMessage = function (player, text) {
    this.broadcastEvent("eggwatch:player_chat", { player: player.id, text: text });
}

function random(min, max) {
    return Math.floor(Math.random() * max) + min;
}

function generateName(min = 2, max = 8) {
    const vowels = "aeiou";
    const cnsnts = "bdgknptvz";
    let name = "";
    for (let i = 0; i < random(min, max); i++) {
        name += i % 2 ? vowels[random(0, vowels.length - 1)] :
            cnsnts[random(0, cnsnts.length - 1)];
    }
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
}

function rainbow(text) {
    const codes = "12345679abcdef";
    let colored = "";
    for (let i = 0; i < text.length; i++) {
        colored += "§" +
            codes[i - (Math.floor(i / codes.length) * codes.length)] + text[i];
    }
    return colored + "§r";
}

function bold(text) {
    return "§l" + text + "§r";
}