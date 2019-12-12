function onCreate(index, game, group)
{
    return {
        x: game.player.position.x,
        y: game.player.position.y
    };
}

function onUpdate(index, game, group, position, delta, age, globalAge)
{
    let player = game.player;

    let fanLevel = Math.floor(index / 2);
    let sign = index % 2 ? 1 : -1;

    let angle = 15 * fanLevel * sign;

    let distance = delta * 5;
    
    return {
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance
    };
}