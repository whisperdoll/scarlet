function init(index, self, game)
{
    return {
        store: {
            age: 0
        }
    };
}

function update(index, self, game, delta, stageAge, store)
{
    const age = store.age + delta;
    
    return {
        position: {
            x: age * 100,
            y: self.position.y
        },
        store: {
            age: age
        }
    };
}