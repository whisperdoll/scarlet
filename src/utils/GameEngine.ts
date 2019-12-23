import { PointLike } from "./point";
import { BossModel, ScriptHaver, SpriteHaver, BulletHaver, ProjectModel, BulletModel, SpriteModel, StageModel, PlayerModel, EnemyModel, ObjectMap, StageEnemyData } from "./datatypes";
import ScriptEngine, { KeyContext } from "./ScriptEngine";
import ObjectHelper from "./ObjectHelper";
import ImageCache from "./ImageCache";
import { obj_copy, array_remove_multiple, array_last, array_copy, deepCopy } from "./utils";

type GameEntityType = "player" | "enemy" | "boss" | "enemyBullet" | "playerBullet";

export interface GameEntity
{
    obj: ScriptHaver & SpriteHaver & BulletHaver & { id?: number };
    index: number;
    spawnFrame: number;
    lifetime: number;
    age: number;
    spawnPosition: PointLike;
    position: PointLike;
    tags: string[];
    bulletsFired: number;
    alive: boolean;
    type: GameEntityType;
    store: ObjectMap<any>;
    hp: number;
};

type KeyStruct = Map<string, boolean>;

export interface UpdateContext
{
    playerInvincible: boolean;
    keys: KeyStruct;
};

export interface UpdateResult
{
    playerAlive: boolean;
    entities: GameEntity[];
    stageAge: number;
    isLastUpdate: boolean;
};

export interface GameState
{
    entities: GameEntity[];
    stageAge: number;
};

export default class GameEngine
{
    public static readonly frameLength: number = 1/60;
    public static readonly bossTransitionFrames: number = 2 * 60;

    private entities: GameEntity[] = [];
    private stageAge: number = 0;
    private gameSize: PointLike = { x: 0, y: 0 };
    private stage: StageModel | null = null;
    private project: ProjectModel | null = null;
    private hasReset: boolean = false;
    private cacheInterval: number = 30;
    private _finalFrame: number = 0;

    // time
    private cache: Map<number, GameState> = new Map();

    constructor()
    {
    }

    public get finalFrame(): number
    {
        return this._finalFrame;
    }

    private get playerEntity(): GameEntity | null
    {
        return this.entities.find(e => e.type === "player") || null;
    }

    private toGameState(): GameState
    {
        return {
            entities: deepCopy(this.entities),
            stageAge: this.stageAge
        };
    }

    private loadGameState(gameState: GameState)
    {
        this.entities = deepCopy(gameState.entities);
        this.stageAge = gameState.stageAge;
    }

    /**
     * Reset the engine sometime after calling this and before doing an update.
     */
    public invalidateCache()
    {
        this.cache.clear();
        
        /*if (this.mode === "previewBoss")
        {
            const boss = this.entities.find(e => e.type === "boss");
            if (boss)
            {
                this.fastForwardTo(boss.lifetime - 1);
            }
        }
        else if (this.mode === "previewEnemies" && this.stage)
        {
            this.fastForwardTo(this.stage.length - 1);
        }*/
    }

    private cacheSelf(frame: number)
    {
        if (!this.cache.has(frame))
        {
            this.cache.set(frame, this.toGameState());
        }
    }

    private retrieveFromCache(frame: number): GameState | null
    {
        return this.cache.get(frame) || null;
    }

    private getKeyContext(keyMap: Map<string, boolean>): KeyContext
    {
        const keys = [ "bomb", "fire", "left", "up", "down", "right", "left", "focus" ];
        const ret: ObjectMap<boolean> = {};
        keys.forEach((key) =>
        {
            ret[key] = !!this.project && !!keyMap.get(this.project.keyBindings[key]);
        });
        return ret as KeyContext;
    }

    public reset(stage: StageModel, project: ProjectModel)
    {
        this.entities = [];
        this.stageAge = 0;
        this._finalFrame = stage.length - 1;

        const player = ObjectHelper.getObjectWithId<PlayerModel>(stage.playerId, project);
        if (player)
        {
            this.entities.push({
                age: 0,
                alive: false,
                bulletsFired: 0,
                index: 0,
                obj: player,
                position: obj_copy(stage.playerSpawnPosition),
                spawnPosition: obj_copy(stage.playerSpawnPosition),
                spawnFrame: 0,
                lifetime: -1,
                tags: [],
                type: "player",
                store: {},
                hp: 0
            });
        }
        
        const boss = ObjectHelper.getObjectWithId<BossModel>(stage.bossId, project);
        if (boss)
        {
            let spawnFrame = stage.length;
            boss.forms.forEach((form, i) =>
            {
                this.entities.push({
                    age: 0,
                    alive: false,
                    bulletsFired: 0,
                    index: i,
                    obj: form,
                    position: obj_copy(stage.bossSpawnPosition),
                    spawnPosition: obj_copy(stage.bossSpawnPosition),
                    spawnFrame: spawnFrame,
                    lifetime: form.lifetime,
                    tags: [],
                    type: "boss",
                    store: {},
                    hp: form.hp
                });

                spawnFrame += form.lifetime + GameEngine.bossTransitionFrames;
            });

            this._finalFrame = spawnFrame - 1;
        }

        stage.enemies.forEach((enemyData: StageEnemyData) =>
        {
            const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id, project);
            if (enemy)
            {
                for (let i = 0; i < enemyData.spawnAmount; i++)
                {
                    this.entities.push({
                        age: 0,
                        alive: false,
                        bulletsFired: 0,
                        index: i,
                        obj: enemy,
                        position: obj_copy(enemyData.spawnPosition),
                        spawnPosition: obj_copy(enemyData.spawnPosition),
                        spawnFrame: enemyData.spawnFrame + i * enemyData.spawnRate,
                        lifetime: -1,
                        tags: [],
                        type: "enemy",
                        store: {},
                        hp: enemy.hp
                    });
                }
            }
        });

        this.gameSize = stage.size;
        this.project = project;
        this.stage = stage;
        this.hasReset = true;
    }

    public fastForwardTo(frame: number): UpdateResult
    {
        const emptyMap = new Map();

        // handle 0 frame //
        if (frame === 0)
        {
            this.entities.forEach(entity => this.trySpawnEntity(entity, emptyMap));
            
            return {
                entities: this.entities,
                isLastUpdate: false,
                playerAlive: true,
                stageAge: 0
            };
        }

        // start from closest cached frame //
        let startFrame = 0;
        let cachedFrame = Math.floor(frame / this.cacheInterval) * this.cacheInterval;
        while (!this.cache.has(cachedFrame) && cachedFrame > 0) cachedFrame -= this.cacheInterval;
        const cached = this.retrieveFromCache(cachedFrame);
        if (cached)
        {
            this.loadGameState(cached);
            startFrame = cachedFrame;

            if (startFrame === frame)
            {
                return {
                    entities: this.entities,
                    isLastUpdate: startFrame === this.finalFrame,
                    playerAlive: true,
                    stageAge: this.stageAge
                };
            }
        }

        // update loop //
        let ret;
        const context = {
            keys: emptyMap,
            playerInvincible: true
        };

        for (let i = startFrame; i < frame; i++)
        {
            if (i % this.cacheInterval === 0 && i !== 0)
            {
                this.cacheSelf(i);
            }
            ret = this.advanceFrame(context);
        }

        return ret as UpdateResult;
    }

    public advanceFrame(context: UpdateContext): UpdateResult
    {
        if (!this.hasReset || !this.project || !this.stage) throw new Error("reset engine before use");

        let playerAlive = true;
        let isLastUpdate = false;

        for (let i = 0; i < this.entities.length; i++)
        {
            const entity = this.entities[i];

            if (!this.trySpawnEntity(entity, context.keys) && (entity.spawnFrame > this.stageAge || !entity.alive))
            {
                continue;
            }

            if (entity.type === "player")
            {
                this.updatePlayer(entity, context);
            }
            else if (entity.type === "boss" && entity.spawnFrame + entity.lifetime === this.stageAge)
            {
                entity.alive = false;
                continue;
            }

            if (entity.obj.scriptId >= 0)
            {
                this.runEntityUpdateScript(entity, context);
            }

            entity.age++;
        }

        if (this.playerEntity)
        {
            if (!context.playerInvincible)
            {
                for (let i = 0; i < this.entities.length; i++)
                {
                    if (this.entities[i].alive && this.entities[i].type === "enemyBullet" && this.testCollision(this.entities[i], this.playerEntity))
                    {
                        playerAlive = false;
                        break;
                    }
                }
            }

            const playerBullet = ObjectHelper.getObjectWithId<BulletModel>(this.playerEntity.obj.bulletId, this.project);
            if (playerBullet)
            {
                this.entities.forEach((b) =>
                {
                    if (b.alive && b.type === "playerBullet")
                    {
                        const collidingEnemies = this.entities.filter(e => e.alive && (e.type === "enemy" || e.type === "boss") && this.testCollision(b, e));
                        collidingEnemies.forEach((e) =>
                        {
                            e.hp -= playerBullet.damage;
                            if (e.hp <= 0)
                            {
                                e.hp = -1;
                                e.alive = false;

                                const methods = ScriptEngine.parseScript(e.obj.scriptId, this.project as ProjectModel);
                                if (methods && methods.die)
                                {
                                    const results = methods.die({
                                        entity: {
                                            age: e.age,
                                            index: e.index,
                                            position: e.position,
                                            spawnPosition: e.spawnPosition,
                                            store: e.store
                                        },
                                        stage: {
                                            age: this.stageAge,
                                            size: (this.stage as StageModel).size
                                        },
                                        keys: this.getKeyContext(context.keys)
                                    });

                                    if (results.fire)
                                    {
                                        this.handleFire(e, results.fire, results.fireStores);
                                    }
                                }
                            }
                        });
                    }
                });
            }
        }

        this.stageAge++;

        if (this.stage)
        {
            if (this.stageAge === this.finalFrame)
            {
                isLastUpdate = true;
            }
            else if (this.stageAge > this.finalFrame)
            {
                throw new Error("advanced beyond final frame.. shame on u");
            }
        }

        const ret = {
            playerAlive: playerAlive,
            entities: this.entities,
            stageAge: this.stageAge,
            isLastUpdate: isLastUpdate
        };
        
        return ret;
    }

    private trySpawnEntity(entity: GameEntity, keys: Map<string, boolean>): boolean
    {
        if (!this.project || !this.stage) return false;

        if (!entity.alive && entity.spawnFrame === this.stageAge)
        {
            entity.alive = true;
            if (entity.obj.scriptId >= 0)
            {
                const methods = ScriptEngine.parseScript(entity.obj.scriptId, this.project);
                if (methods.init)
                {
                    const results = methods.init({
                        entity: {
                            age: 0,
                            index: entity.index,
                            position: entity.spawnPosition,
                            spawnPosition: entity.spawnPosition,
                            store: entity.store
                        },
                        stage: {
                            age: this.stageAge,
                            size: this.stage.size
                        },
                        keys: this.getKeyContext(keys)
                    });
    
                    if (results)
                    {
                        if (results.position)
                        {
                            entity.position = results.position;
                        }
                        if (results.store)
                        {
                            entity.store = results.store;
                        }
                        if (results.fire)
                        {
                            this.handleFire(entity, results.fire, results.fireStores);
                        }
                        if (results.alive === false)
                        {
                            entity.alive = false;
                        }
                    }
                }
            }

            return true;
        }

        return false;
    }

    private updatePlayer(entity: GameEntity, context: UpdateContext)
    {
        if (!this.project) return;

        let speed = 0;
        const player = ObjectHelper.getObjectWithId<PlayerModel>((this.stage as StageModel).playerId, this.project as ProjectModel);
        if (player)
        {
            speed = context.keys.get(this.project.keyBindings.focus) ? player.focusedMoveSpeed : player.moveSpeed;
        }

        if (context.keys.get(this.project.keyBindings.left))
        {
            entity.position.x -= speed;
        }
        if (context.keys.get(this.project.keyBindings.right))
        {
            entity.position.x += speed;
        }
        if (context.keys.get(this.project.keyBindings.up))
        {
            entity.position.y -= speed;
        }
        if (context.keys.get(this.project.keyBindings.down))
        {
            entity.position.y += speed;
        }
    }

    private runEntityUpdateScript(entity: GameEntity, context: UpdateContext)
    {
        const methods = ScriptEngine.parseScript(entity.obj.scriptId, this.project as ProjectModel);
        const results = methods.update ? methods.update({
            entity: {
                age: entity.age,
                index: entity.index,
                position: entity.position,
                spawnPosition: entity.spawnPosition,
                store: entity.store
            },
            stage: {
                age: this.stageAge,
                size: this.gameSize
            },
            keys: this.getKeyContext(context.keys)
        }) : null;

        if (results)
        {
            if (results.position)
            {
                entity.position = results.position;
            }

            if (results.store)
            {
                entity.store = results.store;
            }
            
            if (results.fire)
            {
                for (let i = 0; i < results.fire; i++)
                {
                    const bullet = ObjectHelper.getObjectWithId<BulletModel>(entity.obj.bulletId, this.project as ProjectModel);
                    if (bullet)
                    {
                        this.entities.push({
                            age: 0,
                            index: entity.bulletsFired++,
                            obj: {
                                bulletId: entity.obj.bulletId,
                                scriptId: bullet.scriptId,
                                spriteId: bullet.spriteId
                            },
                            position: entity.position,
                            spawnPosition: entity.position,
                            spawnFrame: this.stageAge,
                            lifetime: -1,
                            tags: [],
                            bulletsFired: 0,
                            alive: true,
                            type: entity.type === "player" ? "playerBullet" : "enemyBullet",
                            store: results.fireStores ? results.fireStores[i] || {} : {},
                            hp: 0
                        });
                    }
                }
            }

            if (!results.alive)
            {
                entity.alive = false;
            }

            if (results.fire)
            {
                this.handleFire(entity, results.fire, results.fireStores);
            }
        }
    }

    private handleFire(entity: GameEntity, num: number, stores?: any[])
    {
        for (let i = 0; i < num; i++)
        {
            const bullet = ObjectHelper.getObjectWithId<BulletModel>(entity.obj.bulletId, this.project as ProjectModel);
            if (bullet)
            {
                this.entities.push({
                    age: 0,
                    index: entity.bulletsFired++,
                    obj: {
                        bulletId: entity.obj.bulletId,
                        scriptId: bullet.scriptId,
                        spriteId: bullet.spriteId
                    },
                    position: entity.position,
                    spawnPosition: entity.position,
                    spawnFrame: this.stageAge,
                    lifetime: -1,
                    tags: [],
                    bulletsFired: 0,
                    alive: true,
                    type: entity.type === "player" ? "playerBullet" : "enemyBullet",
                    store: stores ? stores[i] || {} : {},
                    hp: 0
                });
            }
        }
    }

    private testCollision(entity1: GameEntity, entity2: GameEntity)
    {
        const entity1Sprite = ObjectHelper.getObjectWithId<SpriteModel>(entity1.obj.spriteId, this.project as ProjectModel);
        const entity2Sprite = ObjectHelper.getObjectWithId<SpriteModel>(entity2.obj.spriteId, this.project as ProjectModel);
        if (entity1Sprite && entity2Sprite)
        {
            const entity1SpriteImage = ImageCache.getImageSync(entity1Sprite.path);
            const entity2SpriteImage = ImageCache.getImageSync(entity2Sprite.path);
            
            const entity1SpriteLocalCenter = {
                x: entity1SpriteImage.width / 2,
                y: entity1SpriteImage.height / 2
            };
            const entity2SpriteLocalCenter = {
                x: entity2SpriteImage.width / 2,
                y: entity2SpriteImage.height / 2
            };
            
            const entity1Hitboxes = entity1Sprite.hitboxes;
            const entity2Hitboxes = entity2Sprite.hitboxes;

            const shouldDie = entity1Hitboxes.some((hitbox) => 
            {
                return entity2Hitboxes.some((entity2Hitbox) => 
                {
                    const entity1HitboxPoint = {
                        x: hitbox.position.x + entity1.position.x - entity1SpriteLocalCenter.x,
                        y: hitbox.position.y + entity1.position.y - entity1SpriteLocalCenter.y
                    };
                    const entity2HitboxPoint = {
                        x: entity2Hitbox.position.x + entity2.position.x - entity2SpriteLocalCenter.x,
                        y: entity2Hitbox.position.y + entity2.position.y - entity2SpriteLocalCenter.y
                    };

                    const d = hitbox.radius + entity2Hitbox.radius
                    const ret = Math.sqrt(Math.pow(entity1HitboxPoint.x - entity2HitboxPoint.x, 2) + Math.pow(entity1HitboxPoint.y - entity2HitboxPoint.y, 2)) < d;

                    return ret;
                });
            });
            
            return shouldDie;
        }

        return false;
    }
}