import { PointLike } from "./point";
import { BossModel, ScriptHaver, SpriteHaver, BulletHaver, ProjectModel, BulletModel, SpriteModel, StageModel, PlayerModel, EnemyModel, ObjectMap, StageEnemyData } from "./datatypes";
import ScriptEngine from "./ScriptEngine";
import ObjectHelper from "./ObjectHelper";
import ImageCache from "./ImageCache";
import { obj_copy, array_remove_multiple, array_last, array_copy, deepCopy } from "./utils";

type GameEntityType = "player" | "enemy" | "boss" | "enemyBullet" | "playerBullet";

export interface GameEntity
{
    obj: ScriptHaver & SpriteHaver & BulletHaver;
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
    offsetStageAge: number;
    isLastUpdate: boolean;
};

export interface GameState
{
    entities: GameEntity[];
    stageAge: number;
    bossFormIndex: number;
    mode: EngineMode;
    playerEntity: GameEntity | null;
};

type EngineMode = "previewEnemies" | "previewBoss" | "full";

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
    private playerEntity: GameEntity | null = null;
    private bossFormIndex: number = -1;
    private mode: EngineMode = "full";
    private cacheInterval: number = 30;

    // time, mode, bossFormIndex
    private cache: Map<number, Map<EngineMode, Map<number, GameState>>> = new Map();

    constructor()
    {
    }

    private toGameState(): GameState
    {
        return {
            bossFormIndex: this.bossFormIndex,
            entities: deepCopy(this.entities),
            mode: this.mode,
            playerEntity: this.playerEntity,
            stageAge: this.stageAge
        };
    }

    private loadGameState(gameState: GameState)
    {
        this.bossFormIndex = gameState.bossFormIndex;
        this.entities = deepCopy(gameState.entities);
        this.mode = gameState.mode;
        this.playerEntity = gameState.playerEntity;
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
            this.cache.set(frame, new Map());
        }

        const map2 = this.cache.get(frame) as Map<EngineMode, Map<number, GameState>>;
        if (!map2.has(this.mode))
        {
            map2.set(this.mode, new Map());
        }

        const map3 = map2.get(this.mode) as Map<number, GameState>;
        if (!map3.has(this.bossFormIndex))
        {
            map3.set(this.bossFormIndex, this.toGameState());
        }
    }

    private retrieveFromCache(frame: number): GameState | null
    {
        if (!this.cache.has(frame))
        {
            return null;
        }

        const map2 = this.cache.get(frame) as Map<EngineMode, Map<number, GameState>>;
        if (!map2.has(this.mode))
        {
            return null;
        }

        const map3 = map2.get(this.mode) as Map<number, GameState>;
        return map3.get(this.bossFormIndex) || null;
    }

    public reset(stage: StageModel, project: ProjectModel, mode: EngineMode, bossFormIndex: number)
    {
        this.entities = [];
        this.stageAge = 0;
        this.bossFormIndex = bossFormIndex;
        this.mode = mode;

        const player = ObjectHelper.getObjectWithId<PlayerModel>(stage.playerId, project);
        if (player)
        {
            this.playerEntity = {
                age: 0,
                alive: true,
                bulletsFired: 0,
                index: 0,
                obj: player,
                position: obj_copy(stage.playerSpawnPosition),
                spawnPosition: obj_copy(stage.playerSpawnPosition),
                spawnFrame: 0,
                lifetime: -1,
                tags: [],
                type: "player",
                store: {}
            };

            this.entities.push(this.playerEntity);
        }

        if (mode === "full")
        {
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
                        store: {}
                    });

                    spawnFrame += form.lifetime + GameEngine.bossTransitionFrames;
                });
            }
        }
        else if (mode === "previewBoss")
        {
            const boss = ObjectHelper.getObjectWithId<BossModel>(stage.bossId, project);
            if (boss && bossFormIndex >= 0)
            {
                let spawnFrame = stage.length;
                boss.forms.forEach((form, i) =>
                {
                    if (i === bossFormIndex)
                    {
                        this.entities.push({
                            age: 0,
                            alive: true,
                            bulletsFired: 0,
                            index: i,
                            obj: form,
                            position: obj_copy(stage.bossSpawnPosition),
                            spawnPosition: obj_copy(stage.bossSpawnPosition),
                            spawnFrame: spawnFrame,
                            lifetime: form.lifetime,
                            tags: [],
                            type: "boss",
                            store: {}
                        });
                        
                        this.stageAge = spawnFrame;
                    }

                    spawnFrame += form.lifetime + GameEngine.bossTransitionFrames;
                });
            }
        }

        if (mode !== "previewBoss")
        {
            stage.enemies.forEach((enemyData: StageEnemyData) =>
            {
                const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id, project);
                if (enemy)
                {
                    for (let i = 0; i < enemyData.spawnAmount; i++)
                    {
                        this.entities.push({
                            age: 0,
                            alive: enemyData.spawnFrame === 0,
                            bulletsFired: 0,
                            index: i,
                            obj: enemy,
                            position: obj_copy(enemyData.spawnPosition),
                            spawnPosition: obj_copy(enemyData.spawnPosition),
                            spawnFrame: enemyData.spawnFrame + i * enemyData.spawnRate,
                            lifetime: -1,
                            tags: [],
                            type: "enemy",
                            store: {}
                        });
                    }
                }
            });
        }

        this.entities.forEach((entity) =>
        {
            if (entity.obj.scriptId >= 0)
            {
                const methods = ScriptEngine.parseScript(entity.obj.scriptId, project);
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
                            age: 0,
                            size: stage.size
                        }
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
                    }
                }
            }
        });

        this.gameSize = stage.size;
        this.project = project;
        this.stage = stage;
        this.hasReset = true;
    }

    private get offsetFrames(): number
    {
        if (this.mode === "previewBoss")
        {
            const boss = this.entities.find(e => e.type === "boss");
            if (boss)
            {
                return boss.spawnFrame;
            }

            return 0;
        }
        
        return 0;
    }

    public fastForwardTo(frame: number): UpdateResult
    {
        // handle 0 frame //
        if (frame === 0)
        {
            return {
                entities: this.entities,
                isLastUpdate: false,
                offsetStageAge: 0,
                playerAlive: true,
                stageAge: this.offsetFrames
            };
        }

        // start from closest cached frame //
        let startFrame = 0;
        const cachedFrame = Math.floor(frame / this.cacheInterval) * this.cacheInterval;
        const cached = this.retrieveFromCache(cachedFrame);
        if (cached)
        {
            this.loadGameState(cached);
            startFrame = cachedFrame;

            if (startFrame === frame)
            {
                return {
                    entities: this.entities,
                    isLastUpdate: startFrame === this.stageAge - this.offsetFrames - 1,
                    offsetStageAge: this.stageAge - this.offsetFrames,
                    playerAlive: true,
                    stageAge: this.stageAge
                };
            }
        }

        // update loop //
        let ret;
        const emptyMap = new Map();
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
        if (!this.hasReset) throw new Error("reset engine before use");

        let playerAlive = true;
        let isLastUpdate = false;

        for (let i = 0; i < this.entities.length; i++)
        {
            const entity = this.entities[i];

            if (!entity.alive && entity.spawnFrame === this.stageAge)
            {
                entity.alive = true;
            }
            else if (entity.spawnFrame > this.stageAge)
            {
                continue;
            }

            if (entity.type === "player")
            {
                this.updatePlayer(entity, context);
            }

            if (entity.obj.scriptId >= 0)
            {
                this.updateEntity(entity, context);
            }

            if (entity.type === "enemyBullet" && this.playerEntity && !context.playerInvincible)
            {
                if (this.doBulletCollision(entity, context))
                {
                    playerAlive = false;
                }
            }
        }

        this.stageAge++;
        let offsetTime = this.stageAge;

        if (this.stage)
        {
            if (this.mode === "previewEnemies")
            {
                if (this.stageAge === this.stage.length - 1)
                {
                    isLastUpdate = true;
                }
                else if (this.stageAge >= this.stage.length)
                {
                    throw new Error("advanced beyond stage length");
                }
            }
            else if (this.mode === "previewBoss")
            {
                const boss = this.entities.find(e => e.type === "boss");
                if (boss)
                {
                    offsetTime -= boss.spawnFrame;
                    if (this.stageAge === boss.spawnFrame + boss.lifetime - 1)
                    {
                        isLastUpdate = true;
                    }
                    else if (this.stageAge >= boss.spawnFrame + boss.lifetime)
                    {
                        throw new Error("advanced beyond stage length");
                    }
                }
                else
                {
                    throw new Error("no boss?");
                }
            }
            // TODO: full
        }

        const ret = {
            playerAlive: playerAlive,
            entities: this.entities,
            stageAge: this.stageAge,
            isLastUpdate: isLastUpdate,
            offsetStageAge: offsetTime
        };
        
        return ret;
    }

    private updatePlayer(entity: GameEntity, context: UpdateContext)
    {
        let speed = 0;
        const player = ObjectHelper.getObjectWithId<PlayerModel>((this.stage as StageModel).playerId, this.project as ProjectModel);
        if (player)
        {
            speed = context.keys.get("Shift") ? player.focusedMoveSpeed : player.moveSpeed;
        }

        if (context.keys.get("ArrowLeft"))
        {
            entity.position.x -= speed;
        }
        if (context.keys.get("ArrowRight"))
        {
            entity.position.x += speed;
        }
        if (context.keys.get("ArrowUp"))
        {
            entity.position.y -= speed;
        }
        if (context.keys.get("ArrowDown"))
        {
            entity.position.y += speed;
        }
    }

    private updateEntity(entity: GameEntity, context: UpdateContext)
    {
        const methods = ScriptEngine.parseScript(entity.obj.scriptId, this.project as ProjectModel);
        const results = methods.update({
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
            }
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
                            store: results.fireStores ? results.fireStores[i] || {} : {}
                        });
                    }
                }
            }

            if (!results.alive)
            {
                entity.alive = false;
            }
        }

        entity.age++;
    }

    /**
     * @returns Whether or not the bullet collides with the player
     * @param entity Bullet entity
     * @param context Update context
     */
    private doBulletCollision(entity: GameEntity, context: UpdateContext): boolean
    {
        const bulletSprite = ObjectHelper.getObjectWithId<SpriteModel>(entity.obj.spriteId, this.project as ProjectModel);
        const playerSprite = ObjectHelper.getObjectWithId<SpriteModel>((this.playerEntity as GameEntity).obj.spriteId, this.project as ProjectModel);
        if (bulletSprite && playerSprite)
        {
            const bulletSpriteImage = ImageCache.getImageSync(bulletSprite.path);
            const playerSpriteImage = ImageCache.getImageSync(playerSprite.path);
            
            const bulletSpriteLocalCenter = {
                x: bulletSpriteImage.width / 2,
                y: bulletSpriteImage.height / 2
            };
            const playerSpriteLocalCenter = {
                x: playerSpriteImage.width / 2,
                y: playerSpriteImage.height / 2
            };
            
            const hitboxes = bulletSprite.hitboxes;
            const playerHitboxes = playerSprite.hitboxes;

            const shouldDie = hitboxes.some((hitbox) => 
            {
                return playerHitboxes.some((playerHitbox) => 
                {
                    const hitboxPoint = {
                        x: hitbox.position.x + entity.position.x - bulletSpriteLocalCenter.x,
                        y: hitbox.position.y + entity.position.y - bulletSpriteLocalCenter.y
                    };
                    const playerHitboxPoint = {
                        x: playerHitbox.position.x + (this.playerEntity as GameEntity).position.x - playerSpriteLocalCenter.x,
                        y: playerHitbox.position.y + (this.playerEntity as GameEntity).position.y - playerSpriteLocalCenter.y
                    };

                    const d = hitbox.radius + playerHitbox.radius
                    const ret = Math.sqrt(Math.pow(hitboxPoint.x - playerHitboxPoint.x, 2) + Math.pow(hitboxPoint.y - playerHitboxPoint.y, 2)) < d;

                    return ret;
                });
            });
            
            return shouldDie;
        }

        return false;
    }
}