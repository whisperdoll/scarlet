import React from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, PlayerModel, SpriteModel, EnemyModel, BulletModel, StageEnemyData, BossModel, Hitbox } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point, { PointLike } from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import ScriptEngine, { BossScriptContext, BossScriptResult, EnemyScriptContext, EnemyScriptResult, ScriptMethodCollection, BulletScriptContext, BulletScriptResult } from '../../../../../utils/ScriptEngine';
import { obj_copy } from '../../../../../utils/utils';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    time: number;
    refresh: boolean;
    selectedEntityIndex: number;
    editMode: "enemy" | "boss";
    onInstanceCount: (instances: number, bullets: number) => any;
    onPlayerDie: () => any;
    playing: boolean;
}

interface State
{
}

interface BulletInfo
{
    index: number;
    spawnTime: number;
    spawnPosition: {
        x: number,
        y: number
    };
    methods: ScriptMethodCollection<BulletScriptContext, BulletScriptResult>;
    count: boolean;
    obj: BulletModel;
};

export default class StageRenderer extends React.PureComponent<Props, State>
{
    private canvas: Canvas | null = null;
    private containerRef: React.RefObject<HTMLDivElement>;
    private dirty: boolean = true;
    private rendering: boolean = false;
    private ratio: number = 1;
    private keyDownMap: Map<string, boolean> = new Map();
    private playerPos: PointLike;
    private animationFrameHandle: number | null = null;

    constructor(props: Props)
    {
        super(props);

        this.playerPos = obj_copy(props.stage.playerSpawnPosition);

        this.grabCanvas = this.grabCanvas.bind(this);
        this.renderStage = this.renderStage.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);

        window.addEventListener("resize", this.handleResize);

        this.containerRef = React.createRef();
    }

    componentDidUpdate(prevProps: Props)
    {
        if (!this.props.playing)
        {
            this.playerPos = obj_copy(this.props.stage.playerSpawnPosition);
        }

        this.handleResize();
    }

    handleResize()
    {
        if (this.containerRef.current && this.canvas)
        {
            const containerSize = Point.fromSizeLike(this.containerRef.current.getBoundingClientRect());
            const stageSize = Point.fromPointLike(this.props.stage.size);
            const ratio = containerSize.dividedBy(stageSize).min;
            this.canvas.scale(ratio, "translate(-50%,-50%)", "");
            if ((ratio >= 1 && this.ratio < 1) || (ratio < 1 && this.ratio >= 1))
            {
                this.canvas.pixelated = ratio >= 1;
            }
            this.ratio = ratio;
            this.dirty = true;
        }
    }

    componentDidMount()
    {
        this.handleResize();
        this.animationFrameHandle = requestAnimationFrame(this.renderStage);
    }

    componentWillUnmount()
    {
        if (this.animationFrameHandle !== null)
        {
            cancelAnimationFrame(this.animationFrameHandle);
        }
    }

    grabCanvas(canvas: Canvas)
    {
        this.canvas = canvas;
        this.canvas.canvas.tabIndex = -1;
        this.canvas.canvas.addEventListener("keydown", (e) =>
        {
            this.keyDownMap.set(e.key, true);
        });
        this.canvas.canvas.addEventListener("keyup", (e) =>
        {
            this.keyDownMap.set(e.key, false);
        });
        this.canvas.canvas.addEventListener("blur", () =>
        {
            this.keyDownMap.clear();
        });
    }

    renderSpriteHaver(spriteId: number, pos: Point, hilite: boolean)
    {
        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(spriteId, this.props.project);
        if (sprite)
        {
            const img = ImageCache.getImageSync(sprite.path);
            this.canvas?.drawImage(img, pos.minus(Point.fromSizeLike(img).dividedBy(2)));
            if (hilite)
            {
                this.canvas?.drawRect(new Rectangle(pos.minus(Point.fromSizeLike(img).dividedBy(2)), Point.fromSizeLike(img)), "red", 1 / this.ratio, false);
            }
        }
    }

    renderEnemies(delta: number, gameSize: PointLike): { bullets: BulletInfo[], instances: number }
    {
        const bullets: BulletInfo[] = [];
        let instanceCounter = 0;

        this.props.stage.enemies.forEach((_enemyData, enemyIndex) =>
        {
            const enemyData: StageEnemyData = obj_copy(_enemyData);
            const enemy = ObjectHelper.getObjectWithId<EnemyModel>(enemyData.id, this.props.project);
            if (!enemy) return;

            const isSelected = this.props.selectedEntityIndex >= 0 && this.props.stage.enemies[this.props.selectedEntityIndex].id === enemy.id;

            if (enemy.scriptId < 0)
            {
                this.renderSpriteHaver(enemy.spriteId, Point.fromPointLike(enemyData.spawnPosition), isSelected);
                return;
            }
            const enemyMethods = ScriptEngine.parseScript<EnemyScriptContext, EnemyScriptResult>(enemy.scriptId, this.props.project);

            let bulletMethods: ScriptMethodCollection<BulletScriptContext, BulletScriptResult> | null = null;
            let enemyBullet = ObjectHelper.getObjectWithId<BulletModel>(enemy.bulletId, this.props.project);
            if (enemyBullet)
            {
                bulletMethods = ScriptEngine.parseScript(enemyBullet.scriptId, this.props.project);
            }
            
            for (let i = 0; i < enemyData.spawnAmount; i++)
            {
                let bulletIndexCounter = 0;
                const minTime = enemyData.spawnTime + (1 / enemyData.spawnRate) * i;
                const maxTime = this.props.stage.lengthSeconds;

                if (minTime <= this.props.time)
                {
                    let isDead = this.props.time >= maxTime;
                    let scriptInfo = {
                        position: enemyData.spawnPosition
                    };

                    const doStuff = (delta: number, _time: number) =>
                    {
                        // console.time("method call");
                        const results = enemyMethods.update({
                            enemy: {
                                age: _time - minTime,
                                position: scriptInfo.position,
                                spawnPosition: enemyData.spawnPosition
                            },
                            stage: {
                                age: _time,
                                size: gameSize
                            },
                            index: i,
                            delta: delta
                        });
                        
                        if (results)
                        {
                            if (results.position)
                            {
                                scriptInfo.position = results.position;
                            }
                            if (results.fire && enemyBullet && bulletMethods)
                            {
                                bullets.push({
                                    index: bulletIndexCounter++,
                                    spawnPosition: scriptInfo.position,
                                    spawnTime: _time,
                                    count: isSelected,
                                    methods: bulletMethods,
                                    obj: enemyBullet
                                });
                            }
                            if (!results.alive)
                            {
                                isDead = true;
                            }
                        }
                    };

                    let _time;

                    for (_time = minTime; _time < this.props.time && _time < maxTime; _time += delta)
                    {
                        doStuff(delta, _time);
                        if (isDead) break;
                    }

                    if (!isDead)
                    {
                        _time -= delta;
                        doStuff(Math.min(this.props.time, maxTime) - _time, Math.min(this.props.time, maxTime));
                    }

                    if (!isDead)
                    {
                        
                        this.renderSpriteHaver(enemy.spriteId, Point.fromPointLike(scriptInfo.position), isSelected);
                        if (isSelected)
                        {
                            instanceCounter++;
                        }
                    }
                }
            }
        });

        return { bullets: bullets, instances: instanceCounter };
    }

    renderBoss(delta: number, gameSize: PointLike): BulletInfo[]
    {
        const bullets: BulletInfo[] = [];
        const boss = ObjectHelper.getObjectWithId<BossModel>(this.props.stage.bossId, this.props.project);
        if (!boss) return [];
        
        const form = boss.forms[this.props.selectedEntityIndex];
        if (!form) return [];

        if (form.scriptId < 0)
        {
            this.renderSpriteHaver(form.spriteId, Point.fromPointLike(this.props.stage.bossSpawnPosition), false);
            return [];
        }
        const bossMethods = ScriptEngine.parseScript<BossScriptContext, BossScriptResult>(form.scriptId, this.props.project);

        let bulletMethods: ScriptMethodCollection<BulletScriptContext, BulletScriptResult> | null = null;
        let bossBullet = ObjectHelper.getObjectWithId<BulletModel>(form.bulletId, this.props.project);
        if (bossBullet)
        {
            bulletMethods = ScriptEngine.parseScript(bossBullet.scriptId, this.props.project);
        }

        let bulletIndexCounter = 0;
        const minTime = 0;
        const maxTime = form.lifetime;
        
        let totalAge = 0;
        for (let i = 0; i < this.props.selectedEntityIndex; i++)
        {
            totalAge += boss.forms[i].lifetime;
        }

        if (minTime <= this.props.time)
        {
            let isDead = this.props.time >= maxTime;
            let scriptInfo = {
                position: this.props.stage.bossSpawnPosition
            };

            const doStuff = (delta: number, _time: number) =>
            {
                const results = bossMethods.update({
                    boss: {
                        formAge: _time - minTime,
                        position: scriptInfo.position,
                        spawnPosition: { x: 64, y: 64 },
                        formIndex: this.props.selectedEntityIndex,
                        totalAge: totalAge + (_time - minTime)
                    },
                    stage: {
                        age: _time,
                        size: gameSize
                    },
                    delta: delta
                });
                
                if (results)
                {
                    if (results.position)
                    {
                        scriptInfo.position = results.position;
                    }
                    if (results.fire && bossBullet && bulletMethods)
                    {
                        bullets.push({
                            index: bulletIndexCounter++,
                            spawnPosition: scriptInfo.position,
                            spawnTime: _time,
                            count: true,
                            methods: bulletMethods,
                            obj: bossBullet
                        });
                    }
                    if (!results.alive)
                    {
                        isDead = true;
                    }
                }
            };

            let _time;

            for (_time = minTime; _time < this.props.time && _time < maxTime; _time += delta)
            {
                doStuff(delta, _time);
                if (isDead) break;
            }

            if (!isDead)
            {
                _time -= delta;
                doStuff(Math.min(this.props.time, maxTime) - _time, Math.min(this.props.time, maxTime));
            }

            if (!isDead)
            {
                this.renderSpriteHaver(form.spriteId, Point.fromPointLike(scriptInfo.position), false);
            }
        }

        return bullets;
    }

    private renderBullets(bullets: BulletInfo[], delta: number, gameSize: PointLike): { count: number, playerDie: boolean }
    {
        let bulletCounter = 0;
        let playerDie = false;
        const player = ObjectHelper.getObjectWithId<PlayerModel>(this.props.stage.playerId, this.props.project);
        const playerSprite = ObjectHelper.getObjectWithId<SpriteModel>(player ? player.spriteId : -1, this.props.project);
        let playerSpriteSize: Point | null = null;
        if (playerSprite)
        {
            playerSpriteSize = Point.fromSizeLike(ImageCache.getImageSync(playerSprite.path));
        }

        const maxTime = this.props.stage.lengthSeconds;
        for (let i = 0; i < bullets.length; i++)
        {
            const bullet = bullets[i];

            const age = this.props.time - bullet.spawnTime;
            if (age > maxTime)
            {
                throw new Error("bad");
            }

            let scriptInfo = {
                position: bullet.spawnPosition
            };

            let alive = true;

            // console.time("bullet loop");
            for (let _time = bullet.spawnTime; _time < bullet.spawnTime + age; _time += delta)
            {
                const results = bullet.methods.update({
                    bullet: {
                        age: _time - bullet.spawnTime,
                        position: scriptInfo.position,
                        spawnPosition: bullet.spawnPosition
                    },
                    stage: {
                        age: _time,
                        size: gameSize
                    },
                    delta: delta,
                    index: bullet.index
                });

                if (results)
                {
                    if (!results.alive)
                    {
                        alive = false;
                        break;
                    }
                    if (results.position) scriptInfo.position = results.position;
                }
            }
            // console.timeEnd("bullet loop");

            if (alive)
            {
                this.renderSpriteHaver(bullet.obj.spriteId, Point.fromPointLike(scriptInfo.position), false);

                if (bullet.count)
                {
                    bulletCounter++;
                }
                
                // console.time("bullet collision");
                if (!playerDie)
                {
                    // console.time("bullet fetching");
                    const bulletSprite = ObjectHelper.getObjectWithId<SpriteModel>(bullet.obj.spriteId, this.props.project);
                    if (bulletSprite && playerSpriteSize)
                    {
                        // console.time("spriteimage");
                        const bulletSpriteImage = ImageCache.getImageSync(bulletSprite.path);
                        // console.timeEnd("spriteimage");
                        // console.time("localcenter");
                        const bulletSpriteLocalCenter = Point.fromSizeLike(bulletSpriteImage).dividedBy(2);
                        // console.timeEnd("localcenter");
                        // console.time("fetch hitbox");
                        const hitboxes = bulletSprite.hitboxes;
                        const playerHitboxes = this.playerHitboxes;
                        // console.timeEnd("fetch hitbox");
                        // console.timeEnd("bullet fetching");
    
                        // console.time("bullett hitboxes");
                        const shouldDie = hitboxes.some((hitbox) => 
                        {
                            return playerHitboxes.some((playerHitbox) => 
                            {
                                // console.time("* make points");
                                const hitboxPoint = {
                                    x: hitbox.position.x + scriptInfo.position.x - bulletSpriteLocalCenter.x,
                                    y: hitbox.position.y + scriptInfo.position.y - bulletSpriteLocalCenter.y
                                };

                                const playerHitboxPoint = {
                                    x: playerHitbox.position.x + this.playerPos.x - (playerSpriteSize as Point).x / 2,
                                    y: playerHitbox.position.y + this.playerPos.y - (playerSpriteSize as Point).y / 2
                                };
                                // console.timeEnd("* make points");

                                // console.time("* calculate");
                                const d = hitbox.radius + playerHitbox.radius
                                const ret = Math.sqrt(Math.pow(hitboxPoint.x - playerHitboxPoint.x, 2) + Math.pow(hitboxPoint.y - playerHitboxPoint.y, 2)) < d;
                                // console.timeEnd("* calculate");

                                return ret;
                            });
                        });
                        // console.timeEnd("bullett hitboxes");
    
                        if (shouldDie)
                        {
                            playerDie = true;
                        }
                    }
                }
                // console.timeEnd("bullet collision");
            }
        }

        return {
            count: bulletCounter,
            playerDie: playerDie
        };
    }

    private get playerSpeed(): number
    {
        const player = ObjectHelper.getObjectWithId<PlayerModel>(this.props.stage.playerId, this.props.project);
        if (player)
        {
            return this.keyDownMap.get("Shift") ? player.focusedMoveSpeed : player.moveSpeed;
        }
        else
        {
            return 0;
        }
    }

    private get playerHitboxes(): Hitbox[]
    {
        const player = ObjectHelper.getObjectWithId<PlayerModel>(this.props.stage.playerId, this.props.project);
        if (player)
        {
            const sprite = ObjectHelper.getObjectWithId<SpriteModel>(player.spriteId, this.props.project);
            if (sprite)
            {
                return sprite.hitboxes;
            }
        }

        return [];
    }

    renderStage()
    {
        if (!this.canvas || !this.dirty || this.rendering)
        {
            this.animationFrameHandle = requestAnimationFrame(this.renderStage);
            return;
        }

        const delta = 1 / 60;
        const gameSize = obj_copy(this.props.stage.size);

        // console.time("> stage render");
        this.rendering = true;
        this.dirty = false;
        // console.time("clear canvas");
        this.canvas.clear();
        // console.timeEnd("clear canvas");

        // console.time("fetch background");
        const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.props.stage.backgroundId, this.props.project);
        // console.timeEnd("fetch background");
        if (background)
        {
            ImageCache.getImage(background.path, (img, wasCached) =>
            {
                this.canvas?.drawImage(img, new Rectangle(new Point(0), this.canvas.size));
                this.dirty = !wasCached;
            });
        }

        const player = ObjectHelper.getObjectWithId<PlayerModel>(this.props.stage.playerId, this.props.project);
        if (player)
        {
            if (this.keyDownMap.get("ArrowLeft"))
            {
                this.playerPos.x -= delta * this.playerSpeed;
            }
            if (this.keyDownMap.get("ArrowRight"))
            {
                this.playerPos.x += delta * this.playerSpeed;
            }
            if (this.keyDownMap.get("ArrowUp"))
            {
                this.playerPos.y -= delta * this.playerSpeed;
            }
            if (this.keyDownMap.get("ArrowDown"))
            {
                this.playerPos.y += delta * this.playerSpeed;
            }
            this.renderSpriteHaver(player.spriteId, Point.fromPointLike(this.playerPos), false);
        }

        let instanceCounter = 0;
        let bulletCounter = 0;

        let bullets: BulletInfo[] = [];
        
        if (this.props.editMode === "enemy")
        {
            // console.time("enemies");
            const enemyRenderResult = this.renderEnemies(delta, gameSize);
            bullets = enemyRenderResult.bullets;
            instanceCounter = enemyRenderResult.instances;
            // console.timeEnd("enemies");
        }
        else if (this.props.editMode === "boss")
        {
            // console.time("boss");
            bullets = this.renderBoss(delta, gameSize);
            instanceCounter = 0;
            // console.timeEnd("boss");
        }

        // console.time("bullets");
        const bulletRenderResult = this.renderBullets(bullets, delta, gameSize);
        bulletCounter = bulletRenderResult.count;
        // console.timeEnd("bullets");
        
        if (bulletRenderResult.playerDie)
        {
            this.props.onPlayerDie();
        }
        this.props.onInstanceCount(instanceCounter, bulletCounter);

        this.rendering = false;
        this.animationFrameHandle = requestAnimationFrame(this.renderStage);
        // console.timeEnd("> stage render");
    }

    handleUpdate()
    {
        this.dirty = true;
    }
    
    render()
    {
        return (
            <div className="stageRenderer" ref={this.containerRef}>
                <PureCanvas
                    canvasGrabber={this.grabCanvas}
                    canvasOptions={{
                        align: {
                            horizontal: true,
                            vertical: true
                        },
                        deepCalc: true,
                        opaque: true,
                        pixelated: true
                    }}
                    size={Point.fromPointLike(this.props.stage.size)}
                    onUpdate={this.handleUpdate}
                />
            </div>
        );
    }
}
