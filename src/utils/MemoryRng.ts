export class MemoryRng
{
    private cache: number[] = [];
    public index: number = 0;

    constructor()
    {

    }

    public reseed()
    {
        this.cache = [];
        this.index = 0;
    }

    public reset()
    {
        this.index = 0;
    }

    public random()
    {
        if (this.index < this.cache.length)
        {
            return this.cache[this.index++];
        }
        else
        {
            const ret = Math.random();
            this.cache[this.index++] = ret;
            return ret;
        }
    }

    public randomInt(lowInc: number, highExc: number): number
    {
        const delta = highExc - lowInc;
        return Math.floor(this.random() * delta) + lowInc;
    }
}