function init(index, game, group)
{
    return {
        position: {
            x: game.player.position.x,
            y: game.player.position.y
        }
    };
}

function onUpdate(index, game, group, delta, stageAge, store)
{
    const fanLevel = Math.floor(index / 2);
    const sign = index % 2 ? 1 : -1;
    const angle = 15 * fanLevel * sign;
    const distance = delta * 5;
    
    return {
        position: {
            x: position.x + Math.cos(angle) * distance,
            y: position.y + Math.sin(angle) * distance
        }
    };
}