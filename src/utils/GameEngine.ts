import { PointLike } from "./point";
import { BossModel, ScriptHaver, SpriteHaver, BulletHaver, ProjectModel, BulletModel, SpriteModel, StageModel, PlayerModel, EnemyModel } from "./datatypes";
import ScriptEngine from "./ScriptEngine";
import ObjectHelper from "./ObjectHelper";
import ImageCache from "./ImageCache";
import { obj_copy, array_remove_multiple } from "./utils";

type GameEntityType = "player" | "enemy" | "boss" | "enemyBullet" | "playerBullet";

export interface GameEntity
{
    obj: ScriptHaver & SpriteHaver & BulletHaver;
    index: number;
    spawnTime: number;
    lifetime: number;
    age: number;
    spawnPosition: PointLike;
    position: PointLike;
    tags: string[];
    bulletsFired: number;
    alive: boolean;
    type: GameEntityType;
};

type KeyStruct = Map<string, boolean>;

export interface UpdateContext
{
    delta: number;
    playerInvincible: boolean;
    keys: KeyStruct;
};

export interface UpdateResult
{
    playerAlive: boolean;
    entities: GameEntity[];
    delta: number;
    stageAge: number;
    offsetStageAge: number;
    isLastUpdate: boolean;
};

type EngineMode = "previewEnemies" | "previewBoss" | "full";

export default class GameEngine
{
    public static readonly defaultDelta: number = 1/60;
    public static readonly bossTransitionTime: number = 2;

    private entities: GameEntity[] = [];
    private stageAge: number = 0;
    private gameSize: PointLike = { x: 0, y: 0 };
    private entitiesToAdd: GameEntity[] = [];
    private stage: StageModel | null = null;
    private project: ProjectModel | null = null;
    private hasReset: boolean = false;
    private playerEntity: GameEntity | null = null;
    private bossFormIndex: number = -1;
    private mode: EngineMode = "full";

    constructor()
    {
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
                spawnTime: 0,
                lifetime: -1,
                tags: [],
                type: "player"
            };

            this.entities.push(this.playerEntity);
        }

        if (mode === "full")
        {
            const boss = ObjectHelper.getObjectWithId<BossModel>(stage.bossId, project);
            if (boss)
            {
                let spawnTime = stage.lengthSeconds;
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
                        spawnTime: spawnTime,
                        lifetime: form.lifetime,
                        tags: [],
                        type: "boss"
                    });

                    spawnTime += form.lifetime + GameEngine.bossTransitionTime;
                });
            }
        }
        else if (mode === "previewBoss")
        {
            const boss = ObjectHelper.getObjectWithId<BossModel>(stage.bossId, project);
            if (boss && bossFormIndex >= 0)
            {
                let spawnTime = stage.lengthSeconds;
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
                            spawnTime: spawnTime,
                            lifetime: form.lifetime,
                            tags: [],
                            type: "boss"
                        });
                        
                        this.stageAge = spawnTime;
                    }

                    spawnTime += form.lifetime + GameEngine.bossTransitionTime;
                });
            }
        }

        if (mode !== "previewBoss")
        {
            stage.enemies.forEach((enemyData) =>
            {
                const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id, project);
                if (enemy)
                {
                    for (let i = 0; i < enemyData.spawnAmount; i++)
                    {
                        this.entities.push({
                            age: 0,
                            alive: enemyData.spawnTime === 0,
                            bulletsFired: 0,
                            index: i,
                            obj: enemy,
                            position: obj_copy(enemyData.spawnPosition),
                            spawnPosition: obj_copy(enemyData.spawnPosition),
                            spawnTime: enemyData.spawnTime + i * (1 / enemyData.spawnRate),
                            lifetime: -1,
                            tags: [],
                            type: "enemy"
                        });
                    }
                }
            });
        }

        this.gameSize = stage.size;
        this.project = project;
        this.stage = stage;
        this.hasReset = true;
    }

    private addQueuedEntities()
    {
        this.entities = this.entities.concat(this.entitiesToAdd);
        this.entitiesToAdd = [];
    }

    public fastForwardTo(time: number): UpdateResult
    {
        const emptyMap = new Map();
        let _time;

        const context = {
            delta: GameEngine.defaultDelta,
            keys: emptyMap,
            playerInvincible: true
        };

        for (_time = 0; _time < time - GameEngine.defaultDelta; _time += GameEngine.defaultDelta)
        {
            this.update(context);
        }

        return this.update({
            delta: time - _time,
            keys: emptyMap,
            playerInvincible: true
        });
    }

    public startGameLoop(startTime: number, callback: (result: UpdateResult) => any)
    {
        if (startTime > 0)
        {
            this.fastForwardTo(startTime);
        }
    }

    public stopGameLoop()
    {

    }

    public update(context: UpdateContext): UpdateResult
    {
        if (!this.hasReset) throw new Error("reset engine before use");

        let playerAlive = true;
        let isLastUpdate = false;

        const _sa = this.stageAge;
        this.stageAge += context.delta;
        let offsetTime = this.stageAge;

        if (this.stage)
        {
            if (this.mode === "previewEnemies" && this.stageAge >= this.stage.lengthSeconds)
            {
                this.stageAge = this.stage.lengthSeconds;
                context.delta = this.stageAge - _sa;
                isLastUpdate = true;
            }
            else if (this.mode === "previewBoss")
            {
                const boss = this.entities.find(e => e.type === "boss");
                if (boss)
                {
                    offsetTime -= boss.spawnTime;
                    //console.log(offsetTime, context);
                    if (this.stageAge >= boss.spawnTime + boss.lifetime)
                    {
                        this.stageAge = boss.spawnTime + boss.lifetime;
                        context.delta = this.stageAge - _sa;
                        isLastUpdate = true;
                    }
                }
                else
                {
                    throw new Error("no boss?");
                }
            }
        }

        this.entities.forEach((entity, i) =>
        {
            if (!entity.alive && entity.spawnTime <= this.stageAge)
            {
                if (entity.spawnTime + context.delta > this.stageAge)
                {
                    entity.alive = true;
                }
                else
                {
                    return;
                }
            }
            else if (entity.spawnTime > this.stageAge)
            {
                return;
            }

            entity.age += context.delta;

            // console.time("update player");
            if (entity.type === "player")
            {
                let speed = 0;
                const player = ObjectHelper.getObjectWithId<PlayerModel>((this.stage as StageModel).playerId, this.project as ProjectModel);
                if (player)
                {
                    speed = context.keys.get("Shift") ? player.focusedMoveSpeed : player.moveSpeed;
                }

                if (context.keys.get("ArrowLeft"))
                {
                    entity.position.x -= context.delta * speed;
                }
                if (context.keys.get("ArrowRight"))
                {
                    entity.position.x += context.delta * speed;
                }
                if (context.keys.get("ArrowUp"))
                {
                    entity.position.y -= context.delta * speed;
                }
                if (context.keys.get("ArrowDown"))
                {
                    entity.position.y += context.delta * speed;
                }
            }
            // console.timeEnd("update player");

            // console.time("run script");
            if (entity.obj.scriptId >= 0)
            {
                const methods = ScriptEngine.parseScript(entity.obj.scriptId, this.project as ProjectModel);
                const results = methods.update({
                    delta: context.delta,
                    entity: {
                        age: entity.age,
                        index: entity.index,
                        position: entity.position,
                        spawnPosition: entity.spawnPosition
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
                    
                    if (results.fire)
                    {
                        for (let i = 0; i < results.fire; i++)
                        {
                            const bullet = ObjectHelper.getObjectWithId<BulletModel>(entity.obj.bulletId, this.project as ProjectModel);
                            if (bullet)
                            {
                                this.entitiesToAdd.push({
                                    age: 0,
                                    index: entity.bulletsFired++,
                                    obj: {
                                        bulletId: entity.obj.bulletId,
                                        scriptId: bullet.scriptId,
                                        spriteId: bullet.spriteId
                                    },
                                    position: entity.position,
                                    spawnPosition: entity.position,
                                    spawnTime: this.stageAge,
                                    lifetime: -1,
                                    tags: [],
                                    bulletsFired: 0,
                                    alive: true,
                                    type: entity.type === "player" ? "playerBullet" : "enemyBullet"
                                });
                            }
                        }
                    }

                    if (!results.alive)
                    {
                        entity.alive = false;
                    }
                }
            }
            // console.timeEnd("run script");

            // console.time("bullet collision");
            if (entity.type === "enemyBullet" && this.playerEntity && !context.playerInvincible)
            {
                const bulletSprite = ObjectHelper.getObjectWithId<SpriteModel>(entity.obj.spriteId, this.project as ProjectModel);
                const playerSprite = ObjectHelper.getObjectWithId<SpriteModel>(this.playerEntity.obj.spriteId, this.project as ProjectModel);
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
                    
                    if (shouldDie)
                    {
                        playerAlive = false;
                    }
                }
            }
            // console.timeEnd("bullet collision");
        });

        // console.time("add queued");
        this.addQueuedEntities();
        // console.timeEnd("add queued");
        // console.time("remove queued");
        // console.timeEnd("remove queued");
        return {
            playerAlive: playerAlive,
            entities: this.entities,
            delta: context.delta,
            stageAge: this.stageAge,
            isLastUpdate: isLastUpdate,
            offsetStageAge: offsetTime
        };
    }
}