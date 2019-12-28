import React from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, SpriteModel, PlayerModel, BossModel } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point, { PointLike } from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import GameEngine, { UpdateResult, GameEntity } from '../../../../../utils/GameEngine';
import update from "immutability-helper";
import * as PIXI from "pixi.js";
import PathHelper from '../../../../../utils/PathHelper';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    frame: number;
    refresh: boolean;
    selectedEntityIndex: number;
    onInstanceCount: (instances: number, bullets: number) => any;
    onPlayerDie: () => any;
    onPlayFrame: (frame: number, isLastFrame: boolean) => any;
    onUpdateStage: (stage: StageModel) => any;
    onSelectEnemy: (index: number) => any;
    onFinalFrameCalculate: (finalFrame: number) => any;
    playing: boolean;
    playerInvincible: boolean;
}

interface State
{
}

export default class StageRenderer extends React.PureComponent<Props, State>
{
    private static textureCache: Map<number, PIXI.Texture[]> = new Map();

    private canvas: Canvas | null = null;
    private renderer: PIXI.Renderer | null = null;
    private containerRef: React.RefObject<HTMLDivElement>;
    private canvasRef : React.RefObject<HTMLCanvasElement>;
    private dirty: boolean = true;
    private rendering: boolean = false;
    private ratio: number = 1;
    private keyDownMap: Map<string, boolean> = new Map();
    private animationFrameHandle: number | null = null;
    private engine: GameEngine;
    private selectedEntityType: "none" | "player" | "enemy" | "boss";
    private selectedEntityPos: Point;
    private selectedIndex: number;
    private entities: GameEntity[] = [];
    private mouseDelta = new Point();

    constructor(props: Props)
    {
        super(props);

        this.selectedEntityPos = new Point();
        this.selectedEntityType = "none";
        this.selectedIndex = -1;
        
        this.engine = new GameEngine();
        window.addEventListener("resize", this.handleResize);
        this.containerRef = React.createRef();
        this.canvasRef = React.createRef();
    }

    public static createTextureCache(project: ProjectModel, callback: () => any)
    {
        PIXI.Loader.shared.removeAllListeners();

        const cellNums: Map<number, number> = new Map();

        project.objects.forEach((obj) =>
        {
            if (obj.type === "sprite" || obj.type === "background")
            {
                const path = PathHelper.resolveObjectFileName((obj as any).path);
                PIXI.Loader.shared.add(obj.id.toString(), path);
                if (obj.type === "sprite")
                {
                    const s = obj as SpriteModel;
                    cellNums.set(s.id, Math.max(s.numCells, 1));
                }
                else
                {
                    cellNums.set(obj.id, 1);
                }
            }
        });

        PIXI.Loader.shared.load((loader, resources) =>
        {
            for (let key in resources)
            {
                const texture = resources[key]!.texture;
                const id = parseInt(key);
                const numCells = cellNums.get(id)!;
                const cellWidth = Math.floor(texture.width / numCells);

                const texturesToCache: PIXI.Texture[] = [];

                for (let i = 0; i < numCells; i++)
                {
                    const subTexture = new PIXI.Texture(texture.baseTexture, new PIXI.Rectangle(cellWidth * i, 0, cellWidth, texture.height));
                    texturesToCache.push(subTexture);
                }

                this.textureCache.set(id, texturesToCache);
            }

            callback();
        });
    }

    componentDidMount = () =>
    {
        this.renderer = new PIXI.Renderer({
            view: this.canvasRef.current!,
            width: this.props.stage.size.x,
            height: this.props.stage.size.y
        });
        this.canvas = new Canvas({
            canvasElement: this.canvasRef.current!,
            opaque: true,
            align: {
                horizontal: true,
                vertical: true
            }
        });
        this.grabCanvas(this.canvas);
        (window as any).c = this.renderer;

        this.handleResize();
        this.resetEngine();
        this.engine.invalidateCache();
        this.props.onFinalFrameCalculate(this.engine.finalFrame);
        this.requestRender();
    }

    componentWillUnmount = () =>
    {
        if (this.animationFrameHandle !== null)
        {
            cancelAnimationFrame(this.animationFrameHandle);
        }
    }

    requestRender = () =>
    {
        this.animationFrameHandle = requestAnimationFrame(this.renderStage);
    }

    componentDidUpdate = (prevProps: Props) =>
    {
        this.handleResize();

        if (this.props.playing && !prevProps.playing)
        {
            this.startPlaying();
        }
        else if (!this.props.playing && prevProps.playing)
        {
            this.stopPlaying();
        }

        if (this.props.playing && this.props.frame < prevProps.frame)
        {
            // we looped //
            this.startPlaying();
        }

        if (this.props.project !== prevProps.project
            || this.props.refresh !== prevProps.refresh
            || this.props.stage !== prevProps.stage)
        {
            this.resetEngine();
            this.engine.invalidateCache();
            this.props.onFinalFrameCalculate(this.engine.finalFrame);
        }

        this.dirty = true;
    }

    handleResize = () =>
    {
        if (this.containerRef.current && this.canvas)
        {
            const containerSize = Point.fromSizeLike(this.containerRef.current.getBoundingClientRect());
            const stageSize = Point.fromPointLike(this.props.stage.size);
            const ratio = containerSize.dividedBy(stageSize).min;
            this.canvas.scale(ratio, "translate(-50%,-50%)", "");
            /*if ((ratio >= 1 && this.ratio < 1) || (ratio < 1 && this.ratio >= 1))
            {
                this.canvas.pixelated = ratio >= 1;
            }*/
            this.ratio = ratio;
            this.dirty = true;
        }
    }

    startPlaying = () =>
    {
        console.log("play start");
        this.resetEngine();
        this.engine.fastForwardTo(this.props.frame);
    }

    stopPlaying = () =>
    {
        console.log("play stop");
    }

    grabCanvas = (canvas: Canvas) =>
    {
        this.canvas = canvas;
        this.canvas.canvas.tabIndex = -1;

        this.canvas.canvas.addEventListener("keydown", (e) =>
        {
            this.keyDownMap.set(e.key.toLowerCase(), true);
        });
        this.canvas.canvas.addEventListener("keyup", (e) =>
        {
            this.keyDownMap.set(e.key.toLowerCase(), false);
        });
        this.canvas.canvas.addEventListener("blur", () =>
        {
            this.keyDownMap.clear();
        });

        this.canvas.addEventListener("mousedown", (mousePos, e) =>
        {
            const containsPoint = (data: { spriteId: number } | null | undefined, spawnPosition: PointLike): boolean =>
            {
                if (!data) return false;
                const sprite = ObjectHelper.getObjectWithId<SpriteModel>(data.spriteId, this.props.project);
                if (sprite)
                {
                    const img = ImageCache.getCachedImage(sprite.path);
                    const imgSize = Point.fromSizeLike(img);
                    const bounds = new Rectangle(Point.fromPointLike(spawnPosition), imgSize).translated(imgSize.dividedBy(-2));
                    return bounds.containsPoint(mousePos);
                }

                return false;
            };

            const player = this.entities.find(e => e.type === "player");
            if (player && containsPoint(player.obj, this.props.stage.playerSpawnPosition))
            {
                this.selectedEntityType = "player";
                this.selectedEntityPos = Point.fromPointLike(player.spawnPosition);
                this.selectedIndex = -1;
                return;
            }

            const enemies = this.entities.filter(e => e.alive && e.type === "enemy");
            const found = enemies.find((e) =>
            {
                return containsPoint(e.obj, e.position);
            });
            if (found)
            {
                this.selectedEntityType = "enemy";
                this.selectedEntityPos = Point.fromPointLike(found.spawnPosition);
                this.selectedIndex = this.props.stage.enemies.findIndex(e => e.id === found.obj.id);
                if (this.selectedIndex === -1)
                {
                    throw new Error("bad index iodk");
                }
                // this.props.onSelectEnemy(this.selectedIndex);
                return;
            }
            
            const form = this.entities.find(e => e.alive && e.type === "boss");
            if (form && containsPoint(form.obj, form.position))
            {
                this.selectedEntityType = "boss";
                this.selectedEntityPos = Point.fromPointLike(form.spawnPosition);
                this.selectedIndex = -1;
                return;
            }
        });
        this.canvas.addEventListener("mousemove", (pos, mouseDown, lastPos, ogPos, e) =>
        {
            this.mouseDelta = pos.minus(ogPos);
        });
        this.canvas.addEventListener("mouseup", () =>
        {
            this.selectedEntityType = "none";
        });
        this.canvas.addEventListener("mouseleave", () =>
        {
            this.selectedEntityType = "none";
        });
    }

    renderSpriteHaver = (spriteId: number, pos: Point, age: number, hilite: boolean) =>
    {
        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(spriteId, this.props.project);
        if (sprite)
        {
            /*const img = ImageCache.getCachedImage(sprite.path);
            const currentCell = Math.floor(age / (sprite.framesPerCell || age)) % sprite.numCells;
            const cellSize = new Point(Math.floor(img.width / sprite.numCells), img.height);

            this.canvas?.drawCroppedImage(img, pos.minus(cellSize.dividedBy(2)), new Rectangle(cellSize.times(new Point(currentCell, 0)), cellSize));
            if (hilite)
            {
                this.canvas?.drawRect(new Rectangle(pos.minus(Point.fromSizeLike(img).dividedBy(2)), Point.fromSizeLike(img)), "red", 1 / this.ratio, false);
            }*/
            
            console.time("== fetching");
            const img = ImageCache.getCachedImage(sprite.path);
            const currentCell = Math.floor(age / (sprite.framesPerCell || age)) % sprite.numCells;
            const cellSize = new Point(Math.floor(img.width / sprite.numCells), img.height);
            const offsetPos = pos.minus(cellSize.dividedBy(2));

            const texture = StageRenderer.textureCache.get(spriteId)![currentCell];
            const psprite = new PIXI.Sprite(texture);
            psprite.position = offsetPos;
            console.timeEnd("== fetching");
            console.time("== rendering");
            psprite.render(this.renderer!);
            console.timeEnd("== rendering");

        }
    }

    resetEngine = () =>
    {
        this.engine.reset(this.props.stage, this.props.project);
    }

    drawBackground = () =>
    {
        /*if (this.canvas)
        {
            const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.props.stage.backgroundId, this.props.project);
            if (background)
            {
                const img = ImageCache.getCachedImage(background.path);
                this.canvas.drawImage(img, new Rectangle(new Point(0), Point.fromPointLike(this.props.stage.size)));
            }
        }*/
    }

    renderStage = (time: number) =>
    {
        if (this.rendering)
        {
            this.requestRender();
            return;
        }
        
        this.rendering = true;
        let dirtyBuffer = false;

        if (this.props.playing)
        {
            console.time(">>> render stage play");
            //this.canvas?.clear();
            this.drawBackground();
            const r = this.engine.advanceFrame({
                keys: this.keyDownMap,
                playerInvincible: this.props.playerInvincible
            });

            this.entities = r.entities;
            this.props.onPlayFrame(r.stageAge, r.isLastUpdate);
            if (!r.playerAlive)
            {
                this.props.onPlayerDie();
                dirtyBuffer = true;
            }

            this.entities.forEach((entity) =>
            {
                entity.alive && this.renderSpriteHaver(entity.obj.spriteId, Point.fromPointLike(entity.position), entity.age, false);
            });
            this.renderer?.batch.flush();
            console.timeEnd(">>> render stage play");
        }
        else
        {
            if (this.selectedEntityType !== "none")
            {
                const pt = this.selectedEntityPos.plus(this.mouseDelta).times(100).rounded.dividedBy(100).toObject();
                let stage = this.props.stage;

                if (this.keyDownMap.get("shift"))
                {
                    pt.x = this.canvas!.width / 2;
                }

                switch (this.selectedEntityType)
                {
                    case "player":
                        stage = update(stage, {
                            playerSpawnPosition: {
                                $set: pt
                            }
                        });
                        break;
                    case "enemy":
                        stage = update(stage, {
                            enemies: {
                                [this.selectedIndex]: {
                                    spawnPosition: {
                                        $set: pt
                                    }
                                }
                            }
                        });
                        break;
                    case "boss":
                        stage = update(stage, {
                            bossSpawnPosition: {
                                $set: pt
                            }
                        });
                        break;
                }

                this.props.onUpdateStage(stage);
            }
            
            if (this.dirty)
            {
                console.time(">>> render stage");
                //this.canvas?.clear();
                this.drawBackground();
                console.time("engine stuff");
                // console.time("== reset");
                this.resetEngine();
                // console.timeEnd("== reset");
                // console.time("== fast forward");
                const r = this.engine.fastForwardTo(this.props.frame);
                // console.timeEnd("== fast forward");
                console.timeEnd("engine stuff");
                // console.time("entity stuff");
                this.entities = r.entities;

                const container = new PIXI.Container();
                this.entities.forEach((entity) =>
                {            
                    if (entity.alive)
                    {
                        const sprite = ObjectHelper.getObjectWithId<SpriteModel>(entity.obj.spriteId, this.props.project);
                        if (sprite)
                        {
                            const pos = Point.fromPointLike(entity.position);
                            // console.time("== fetching");
                            const img = ImageCache.getCachedImage(sprite.path);
                            const currentCell = Math.floor(entity.age / (sprite.framesPerCell || entity.age)) % sprite.numCells;
                            const cellSize = new Point(Math.floor(img.width / sprite.numCells), img.height);
                            const offsetPos = pos.minus(cellSize.dividedBy(2));
                
                            const texture = StageRenderer.textureCache.get(entity.obj.spriteId)![currentCell];
                            const psprite = new PIXI.Sprite(texture);
                            psprite.position = offsetPos;
                            container.addChild(psprite);
                            // console.timeEnd("== fetching");
                        }
                    }
                });
                this.renderer!.render(container);
                // console.timeEnd("entity stuff");
                console.timeEnd(">>> render stage");
            }
        }

        this.dirty = dirtyBuffer;
        this.rendering = false;
        this.requestRender();
    }

    handleUpdate = () =>
    {
        this.dirty = true;
    }

    handleClick = () =>
    {
        this.canvas?.canvas.focus();
    }
    
    render = () =>
    {
        return (
            <div
                className="stageRenderer"
                ref={this.containerRef}
                onClick={this.handleClick}
            >
                <canvas id="renderer" ref={this.canvasRef}></canvas>
            </div>
        );
    }
}
