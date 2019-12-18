import React, { ChangeEvent, Ref } from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, PlayerModel, SpriteModel, ObjectModel, EnemyModel, BulletModel, ScriptModel, StageEnemyData, BossModel } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point, { PointLike } from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import ScriptEngine, { BossScriptContext, BossScriptResult, BossScriptMethodCollection, EnemyScriptContext, EnemyScriptMethodCollection, EnemyScriptResult, ScriptResult, ScriptMethodCollection, BulletScriptMethodCollection, BulletScriptContext, BulletScriptResult } from '../../../../../utils/ScriptEngine';
import { obj_copy, numberArray } from '../../../../../utils/utils';
const { dialog } = require("electron").remote;

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    time: number;
    refresh: boolean;
    selectedEntityIndex: number;
    editMode: "enemy" | "boss";
    onInstanceCount: (instances: number, bullets: number) => any;
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
        requestAnimationFrame(this.renderStage);
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
            ImageCache.getImage(sprite.path, (img, wasCached) =>
            {
                this.canvas?.drawImage(img, pos.minus(Point.fromSizeLike(img).dividedBy(2)));
                if (hilite)
                {
                    this.canvas?.drawRect(new Rectangle(pos.minus(Point.fromSizeLike(img).dividedBy(2)), Point.fromSizeLike(img)), "red", 1 / this.ratio, false);
                }
                this.dirty = !wasCached; // draw order likely fucked up so let's
            });
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
                    // console.time("catchup loop");
                    for (let _time = minTime; _time < this.props.time && _time < maxTime; _time += delta)
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
                        // console.timeEnd("method call");
                        
                        // console.time("eat results");
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
                                break;
                            }
                        }
                        // console.timeEnd("eat results");
                    }
                    // console.timeEnd("catchup loop");
                    // console.time("render sprite");
                    if (!isDead)
                    {
                        
                        this.renderSpriteHaver(enemy.spriteId, Point.fromPointLike(scriptInfo.position), isSelected);
                        if (isSelected)
                        {
                            instanceCounter++;
                        }
                    }
                    // console.timeEnd("render sprite");
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
            // console.time("catchup loop");
            for (let _time = minTime; _time < this.props.time && _time < maxTime; _time += delta)
            {
                // console.time("method call");
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
                // console.timeEnd("method call");
                
                // console.time("eat results");
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
                        break;
                    }
                }
                // console.timeEnd("eat results");
            }
            // console.timeEnd("catchup loop");
            // console.time("render sprite");
            if (!isDead)
            {
                this.renderSpriteHaver(form.spriteId, Point.fromPointLike(scriptInfo.position), false);
            }
            // console.timeEnd("render sprite");
        }

        return bullets;
    }

    private get playerSpeed(): number
    {
        const player = ObjectHelper.getObjectWithId<PlayerModel>(this.props.stage.playerId, this.props.project);
        if (player)
        {
            return player.moveSpeed;
        }
        else
        {
            return 0;
        }
    }

    renderStage()
    {
        if (!this.canvas || !this.dirty || this.rendering)
        {
            requestAnimationFrame(this.renderStage);
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
            bullets = this.renderBoss(delta, gameSize);
            instanceCounter = 0;
        }

        const maxTime = this.props.stage.lengthSeconds;
        bullets.forEach((bullet) =>
        {
            const age = this.props.time - bullet.spawnTime;
            if (age > maxTime)
            {
                return; // TODO: SHOW ERROR
            }

            let scriptInfo = {
                position: bullet.spawnPosition
            };

            let alive = true;

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

            if (alive)
            {
                this.renderSpriteHaver(bullet.obj.spriteId, Point.fromPointLike(scriptInfo.position), false);

                if (bullet.count)
                {
                    bulletCounter++;
                }
            }
        });
        
        this.props.onInstanceCount(instanceCounter, bulletCounter);

        this.rendering = false;
        requestAnimationFrame(this.renderStage);
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
