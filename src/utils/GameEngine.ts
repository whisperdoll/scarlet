import { PointLike } from "./point";
import { BossModel, BulletModel, SpriteModel, StageModel, PlayerModel, EnemyModel, StageEnemyData, BossFormModel, ScriptModel, SoundModel } from "./datatypes";
import ScriptEngine, { KeyContext, ScriptMethodCollection } from "./ScriptEngine";
import ObjectHelper from "./ObjectHelper";
import ImageCache from "./ImageCache";
import copy from "fast-copy";
import { array_ensureOne } from "./utils";
import SoundHelper from "./SoundHelper";

type GameEntityType = "player" | "enemy" | "boss" | "enemyBullet" | "playerBullet";

export interface GameEntity extends Record<string, any>
{
    readonly scriptId: number;
    readonly spriteId: number;
    readonly id: number;
    readonly index: number;
    readonly spawnFrame: number;
    readonly type: GameEntityType;
    readonly spawnPositionX: number;
    readonly spawnPositionY: number;
    readonly lifetime: number;
    readonly scriptName: string; // used for errors etc

    age: number;
    positionX: number;
    positionY: number;
    alive: boolean;
    store: Record<string, any>;
    hp: number;
    opacity: number;
    scaleX: number;
    scaleY: number;
    tint: number;
};

type KeyStruct = Map<string, boolean>;

export interface DrawSpriteInfo
{
    name: string;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    opacity: number;
    tint: number;
    frame: number;
};

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
    spritesToDraw: DrawSpriteInfo[];
    globalStore: Record<string, any>;
};

export default class GameEngine
{
    public static readonly frameLength: number = 1/60;
    public static readonly bossTransitionFrames: number = 2 * 60;

    private entities: GameEntity[] = [];
    private globalStore: Record<string, any> = {};
    private stageAge: number = 0;
    private points: number = 0;
    private stageSize: PointLike = { x: 0, y: 0 };
    private stage: StageModel | null = null;
    private hasReset: boolean = false;
    private cacheInterval: number = 15;
    private _finalFrame: number = 0;
    private currentKeyContext: KeyContext = this.getKeyContext(new Map());
    private cache: Map<number, GameState> = new Map();
    public spritesToDraw: DrawSpriteInfo[] = [];
    private _muted: boolean = false;
    public onUpdateEntity: ((entity: GameEntity) => any) | null = null;
    public onAddEntity: ((entity: GameEntity) => any) | null = null;
    public onKillEntity: ((entity: GameEntity) => any) | null = null;
    public onUpdatePoints: ((points: number) => any) | null = null;

    private readonly scriptHelperFunctions: Readonly<Record<string, Function>> =
    {
        fireBullet: (name: string, isFriendly: boolean, spawnX: number, spawnY: number, store?: Record<string, any>): GameEntity | null =>
        {
            const bullet = ObjectHelper.getObjectWithName<BulletModel>(name);
            if (bullet && bullet.type === "bullet")
            {
                return this.handleFire(bullet, isFriendly ? "playerBullet" : "enemyBullet", spawnX, spawnY, store)
            }

            return null;
        },
        drawSprite: (name: string, x: number, y: number, scaleX: number, scaleY: number, opacity: number, tint: number, frame: number) =>
        {
            this.spritesToDraw.push({ name, x, y, scaleX, scaleY, opacity, tint, frame });
        },
        playSound: (name: string) =>
        {
            if (this.muted) return;
            
            const sound = ObjectHelper.getObjectWithName<SoundModel>(name);
            if (sound && sound.type === "sound")
            {
                SoundHelper.playSoundById(sound.id);
            }
        },
        addPoints: (points: number) =>
        {
            this.points += points;
            this.onUpdatePoints && this.onUpdatePoints(this.points);
        }
    };

    public errors: string[] = [];

    constructor()
    {
        Object.freeze(this.scriptHelperFunctions);
    }

    public get muted(): boolean
    {
        return this._muted;
    }

    public set muted(muted: boolean)
    {
        this._muted = muted;

        if (muted)
        {
            SoundHelper.stopAll();
        }
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
            entities: copy(this.entities),
            stageAge: this.stageAge,
            spritesToDraw: this.spritesToDraw,
            globalStore: copy(this.globalStore)
        };
    }

    private loadGameState(gameState: GameState)
    {
        this.entities = copy(gameState.entities);
        this.stageAge = gameState.stageAge;
        this.spritesToDraw = this.spritesToDraw
        this.globalStore = copy(gameState.globalStore);
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
        const ret: Record<string, boolean> = {};
        keys.forEach((key) =>
        {
            ret[key] = !!ObjectHelper.project && !!keyMap.get(ObjectHelper.project.settings.keyBindings[key]);
        });
        return ret as KeyContext;
    }

    private prepareEntity(entity: GameEntity): GameEntity
    {
        const toFreeze = [
            "scriptId",
            "spriteId",
            "id",
            "index",
            "spawnFrame",
            "type",
            "spawnPositionX",
            "spawnPositionY",
            "lifetime"
        ];
        
        toFreeze.forEach(prop => Object.defineProperty(entity, prop, {
            configurable: false,
            writable: false,
            value: entity[prop]
        }));

        return entity;
    }

    private prepareAndAddEntity(entity: GameEntity): GameEntity
    {
        const e = this.prepareEntity(entity);
        this.entities.push(e);
        this.onAddEntity && this.onAddEntity(entity);
        return e;
    }

    public reset(stage: StageModel)
    {
        this.entities = [];
        this.stageAge = 0;
        this.points = 0;
        this._finalFrame = stage.length - 1;
        this.stageSize = {
            x: ObjectHelper.project!.settings.stageResolutionX,
            y: ObjectHelper.project!.settings.stageResolutionY
        };

        const player = ObjectHelper.getObjectWithId<PlayerModel>(stage.playerId);
        if (player)
        {
            this.prepareAndAddEntity({
                age: 0,
                alive: false,
                bulletsFired: 0,
                index: 0,
                positionX: stage.playerSpawnPosition.x,
                positionY: stage.playerSpawnPosition.y,
                scriptId: player.scriptId,
                scriptName: ObjectHelper.getObjectWithId<ScriptModel>(player.scriptId)?.name || "",
                spawnPositionX: stage.playerSpawnPosition.x,
                spawnPositionY: stage.playerSpawnPosition.y,
                spawnFrame: 0,
                lifetime: -1,
                type: "player",
                store: {},
                hp: 0,
                spriteId: player.spriteId,
                id: player.id,
                opacity: 1,
                scaleX: 1,
                scaleY: 1,
                tint: 0xFFFFFF
            });
        }
        
        const boss = ObjectHelper.getObjectWithId<BossModel>(stage.bossId);
        if (boss)
        {
            let spawnFrame = stage.length;
            boss.formIds.forEach((formId, i) =>
            {
                const form = ObjectHelper.getObjectWithId<BossFormModel>(formId);
                if (form)
                {
                    this.prepareAndAddEntity({
                        age: 0,
                        alive: false,
                        bulletsFired: 0,
                        index: i,
                        spawnFrame: spawnFrame,
                        lifetime: form.lifetime,
                        type: "boss",
                        store: {},
                        hp: form.hp,
                        positionX: stage.bossSpawnPosition.x,
                        positionY: stage.bossSpawnPosition.y,
                        scriptId: form.scriptId,
                        scriptName: ObjectHelper.getObjectWithId<ScriptModel>(form.scriptId)?.name || "",
                        spawnPositionX: stage.bossSpawnPosition.x,
                        spawnPositionY: stage.bossSpawnPosition.y,
                        spriteId: form.spriteId,
                        opacity: 1,
                        scaleX: 1,
                        scaleY: 1,
                        id: form.id,
                        tint: 0xFFFFFF
                    });
    
                    spawnFrame += form.lifetime + GameEngine.bossTransitionFrames;
                }
            });

            this._finalFrame = spawnFrame - 1;
        }

        stage.enemies.forEach((enemyData: StageEnemyData) =>
        {
            const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id);
            if (enemy)
            {
                for (let i = 0; i < enemyData.spawnAmount; i++)
                {
                    this.prepareAndAddEntity({
                        age: 0,
                        alive: false,
                        bulletsFired: 0,
                        index: i,
                        spawnFrame: enemyData.spawnFrame + i * enemyData.spawnRate,
                        lifetime: -1,
                        type: "enemy",
                        store: {},
                        hp: enemy.hp,
                        positionX: enemyData.spawnPosition.x,
                        positionY: enemyData.spawnPosition.y,
                        scriptId: enemy.scriptId,
                        scriptName: ObjectHelper.getObjectWithId<ScriptModel>(enemy.scriptId)?.name || "",
                        spawnPositionX: enemyData.spawnPosition.x,
                        spawnPositionY: enemyData.spawnPosition.y,
                        spriteId: enemy.spriteId,
                        id: enemy.id,
                        opacity: 1,
                        scaleX: 1,
                        scaleY: 1,
                        tint: 0xFFFFFF
                    });
                }
            }
        });

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
        // console.time("== cache search");
        let startFrame = 0;
        let cachedFrame = Math.floor(frame / this.cacheInterval) * this.cacheInterval;
        while (!this.cache.has(cachedFrame) && cachedFrame > 0) cachedFrame -= this.cacheInterval;
        const cached = this.retrieveFromCache(cachedFrame);
        if (cached)
        {
            // console.log("cached frame found: ", cachedFrame);
            // console.time("== load game state");
            this.loadGameState(cached);
            // console.timeEnd("== load game state");
            startFrame = cachedFrame;

            if (startFrame === frame)
            {
                // console.timeEnd("== cache search");
                return {
                    entities: this.entities,
                    isLastUpdate: startFrame === this.finalFrame,
                    playerAlive: true,
                    stageAge: this.stageAge
                };
            }
        }
        // console.timeEnd("== cache search");

        // update loop //
        let ret;
        const context = {
            keys: emptyMap,
            playerInvincible: true
        };

        // console.time("== update loop");
        for (let i = startFrame; i < frame; i++)
        {
            if (i % this.cacheInterval === 0 && i !== 0)
            {
                this.cacheSelf(i);
            }
            ret = this.advanceFrame(context);
        }
        // console.timeEnd("== update loop");

        return ret as UpdateResult;
    }

    private killEntity(entity: GameEntity)
    {
        entity.alive = false;
        /*Object.defineProperty(entity, "alive", {
            writable: false,
            configurable: false,
            value: false
        });*/

        const methods = ScriptEngine.parseScript(entity.scriptId);
        this.tryCallScriptMethod(methods, "die", entity);
        this.onKillEntity && this.onKillEntity(entity);
    }

    public advanceFrame(context: UpdateContext): UpdateResult
    {
        if (!this.hasReset || !ObjectHelper.project || !this.stage) throw new Error("reset engine before use");

        if (this.stageAge >= this.finalFrame)
        {
            if (this.stageAge === this.finalFrame)
            {
                console.warn("tried advancing beyond final frame");
                this.stageAge++;
            }

            return {
                entities: this.entities,
                isLastUpdate: true,
                playerAlive: true,
                stageAge: this.finalFrame - 1
            };
        }

        let playerAlive = true;
        let isLastUpdate = false;
        this.currentKeyContext = this.getKeyContext(context.keys);
        let bossSpawned = false;
        this.spritesToDraw = [];

        // console.time("==== update entities");
        for (let i = 0; i < this.entities.length; i++)
        {
            const entity = this.entities[i];
            let alreadyUpdated = false;

            // console.time("====== try spawn");
            const didSpawn = !(!this.trySpawnEntity(entity, context.keys) && (entity.spawnFrame > this.stageAge || !entity.alive));
            if (didSpawn && entity.type === "boss")
            {
                // console.timeEnd("====== try spawn");
                bossSpawned = true;
            }
            else if (!didSpawn)
            {
                // console.timeEnd("====== try spawn");
                continue;
            }
            // console.timeEnd("====== try spawn");

            if (entity.type === "player")
            {
                // console.time("====== update player");
                this.updatePlayer(entity, context);
                // console.timeEnd("====== update player");
            }
            else if (entity.type === "boss" && entity.spawnFrame + entity.lifetime === this.stageAge)
            {
                this.killEntity(entity);
                alreadyUpdated = true;
            }
            else if (entity.type === "enemyBullet")
            {
                if (playerAlive && this.playerEntity && !context.playerInvincible)
                {
                    // console.time("====== update enemy byullet");
                    this.runEntityUpdateScript(entity, context);
                    if (this.testCollision(entity, this.playerEntity))
                    {
                        playerAlive = false;
                    }
                    alreadyUpdated = true;
                    // console.timeEnd("====== update enemy byullet");
                }

                if (bossSpawned)
                {
                    this.killEntity(entity);
                    alreadyUpdated = true;
                }
            }
            else if (entity.type === "enemy" && bossSpawned)
            {
                this.killEntity(entity);
                alreadyUpdated = true;
            }
            else if (entity.type === "playerBullet")
            {
                const bullet = ObjectHelper.getObjectWithId<BulletModel>(entity.id)!;
                // console.time("====== update player byullet");
                const collidingEnemies = this.entities.filter(e => e.alive && (e.type === "enemy" || e.type === "boss") && this.testCollision(entity, e));
                collidingEnemies.forEach((e) =>
                {
                    e.hp -= bullet.damage;
                    if (e.hp <= 0)
                    {
                        e.hp = 0;
                        this.killEntity(e);
                        alreadyUpdated = true;
                    }
                });
                // console.timeEnd("====== update player byullet");
            }

            if (!alreadyUpdated)
            {
                // console.time("====== run entyity script");
                this.runEntityUpdateScript(entity, context);
                // console.timeEnd("====== run entyity script");
            }

            entity.age++;
        }
        // console.timeEnd("==== update entities");

        // console.time("==== wrap up");
        this.stageAge++;

        if (this.stage)
        {
            if (this.stageAge === this.finalFrame)
            {
                isLastUpdate = true;
            }
            // else if (this.stageAge > this.finalFrame)
            // {
            //     throw new Error("advanced beyond final frame.. shame on u");
            // }
        }

        const ret = {
            playerAlive: playerAlive,
            entities: this.entities,
            stageAge: this.stageAge,
            isLastUpdate: isLastUpdate
        };
        // console.timeEnd("==== wrap up");
        
        return ret;
    }

    private reportError(context: string, message: string)
    {
        array_ensureOne(this.errors, "an error occured during " + context + ":\n" + message);
        console.error("an error occured during " + context + ":\n" + message);
    }

    private tryCallScriptMethod(methods: ScriptMethodCollection | null, method: keyof ScriptMethodCollection, entity: GameEntity)
    {
        if (methods && methods[method])
        {
            try
            {
                methods[method]!({
                    entity: entity,
                    stage: {
                        age: this.stageAge,
                        width: this.stageSize.x,
                        height: this.stageSize.y
                    },
                    keys: this.currentKeyContext,
                    helpers: this.scriptHelperFunctions,
                    globalStore: this.globalStore
                });
            }
            catch (e)
            {
                this.reportError(entity.scriptName + ":" + method, e.message);
            }
        }
    }

    private trySpawnEntity(entity: GameEntity, keys: Map<string, boolean>): boolean
    {
        if (!ObjectHelper.project || !this.stage) return false;

        if (!entity.alive && entity.spawnFrame === this.stageAge)
        {
            entity.alive = true;
            const methods = ScriptEngine.parseScript(entity.scriptId);
            this.tryCallScriptMethod(methods, "init", entity);
            return true;
        }

        return false;
    }

    private updatePlayer(entity: GameEntity, context: UpdateContext)
    {
        if (!ObjectHelper.project) return;

        let speed = 0;
        const player = ObjectHelper.getObjectWithId<PlayerModel>((this.stage as StageModel).playerId);
        if (player)
        {
            speed = context.keys.get(ObjectHelper.project.settings.keyBindings.focus) ? player.focusedMoveSpeed : player.moveSpeed;
        }

        if (context.keys.get(ObjectHelper.project.settings.keyBindings.left))
        {
            entity.positionX -= speed;
        }
        if (context.keys.get(ObjectHelper.project.settings.keyBindings.right))
        {
            entity.positionX += speed;
        }
        if (context.keys.get(ObjectHelper.project.settings.keyBindings.up))
        {
            entity.positionY -= speed;
        }
        if (context.keys.get(ObjectHelper.project.settings.keyBindings.down))
        {
            entity.positionY += speed;
        }
    }

    private runEntityUpdateScript(entity: GameEntity, context: UpdateContext)
    {
        const methods = ScriptEngine.parseScript(entity.scriptId);
        this.tryCallScriptMethod(methods, "update", entity);
        this.tryCallScriptMethod(methods, "draw", entity);
        this.onUpdateEntity && this.onUpdateEntity(entity);
    }

    private handleFire(bullet: number | BulletModel | null, bulletType: "playerBullet" | "enemyBullet", posX: number, posY: number, store: any): GameEntity | null
    {
        if (typeof(bullet) === "number")
        {
            bullet = ObjectHelper.getObjectWithId<BulletModel>(bullet);
        }

        if (!bullet) return null;
        
        return this.prepareAndAddEntity({
            age: 0,
            index: 0,
            id: bullet.id,
            scriptId: bullet.scriptId,
            scriptName: ObjectHelper.getObjectWithId<ScriptModel>(bullet.scriptId)?.name || "",
            spriteId: bullet.spriteId,
            positionX: posX,
            positionY: posY,
            spawnPositionX: posX,
            spawnPositionY: posY,
            spawnFrame: this.stageAge,
            lifetime: -1,
            bulletsFired: 0,
            alive: true,
            type: bulletType,
            store: store || {},
            hp: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            tint: 0xFFFFFF
        });
    }

    private testCollision(entity1: GameEntity, entity2: GameEntity)
    {
        const entity1Sprite = ObjectHelper.getObjectWithId<SpriteModel>(entity1.spriteId);
        const entity2Sprite = ObjectHelper.getObjectWithId<SpriteModel>(entity2.spriteId);
        if (entity1Sprite && entity2Sprite)
        {
            const entity1SpriteImage = ImageCache.getCachedImage(entity1Sprite.path);
            const entity2SpriteImage = ImageCache.getCachedImage(entity2Sprite.path);
            
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
                        x: hitbox.position.x + entity1.positionX - entity1SpriteLocalCenter.x,
                        y: hitbox.position.y + entity1.positionY - entity1SpriteLocalCenter.y
                    };
                    const entity2HitboxPoint = {
                        x: entity2Hitbox.position.x + entity2.positionX - entity2SpriteLocalCenter.x,
                        y: entity2Hitbox.position.y + entity2.positionY - entity2SpriteLocalCenter.y
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