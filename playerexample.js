function init(game)
{
    return {
        store: {
            lastLeft: 0,
            lastRight: 0
        }
    };
}

function onUpdate(game, keys, delta, stageAge, store)
{
    let player = game.player;
    
    if (keys.left === 2 && player.position.x === 0)
    {
        const now = Date.now();
        const lastLeft = store.lastLeft;
        store.lastLeft = now;

        if (now - lastLeft < 200)
        {
            return {
                position: {
                    x: game.size.x,
                    y: player.position.y
                }
            };
        }
    }
    else if (keys.right === 2 && player.position.x === game.size.x - 1)
    {
        const now = Date.now();
        const lastRight = store.lastRight;
        store.lastRight = now;

        if (now - lastRight < 200)
        {
            return {
                position: {
                    x: 0,
                    y: player.position.y
                }
            };
        }
    }
}