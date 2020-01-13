import React from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, SpriteModel } from '../../../../../utils/datatypes';
import Point, { PointLike } from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import GameEngine, { GameEntity, DrawSpriteInfo } from '../../../../../utils/GameEngine';
import update from "immutability-helper";
import * as PIXI from "pixi.js";
import PathHelper from '../../../../../utils/PathHelper';
import SoundHelper from '../../../../../utils/SoundHelper';

interface Props
{
    obj: StageModel;
    update: (obj: Partial<StageModel>) => any;

    frame: number;
    refresh: boolean;
    onInstanceCount: (instances: number, bullets: number) => any;
    onPlayerDie: () => any;
    onPlayFrame: (frame: number, isLastFrame: boolean) => any;
    onFinalFrameCalculate: (finalFrame: number) => any;
    playing: boolean;
    playerInvincible: boolean;
    muted: boolean;
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

    get stage(): StageModel
    {
        return this.props.obj;
    }

    public static createTextureCache(project: ProjectModel, callback: () => any)
    {
        PIXI.Loader.shared.removeAllListeners();
        PIXI.Loader.shared.reset();

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
            width: this.stage.size.x,
            height: this.stage.size.y
        });
        this.canvas = new Canvas({
            canvasElement: this.canvasRef.current!,
            opaque: true,
            align: {
                horizontal: false,
                vertical: false
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
        const prevStage = prevProps.obj;
        const stage = this.stage;

        if (prevStage && (prevStage.size.x !== stage.size.x || prevStage.size.y !== stage.size.y))
        {
            this.handleResize();
        }

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
            SoundHelper.stopAll();
            if (this.props.obj.musicId !== -1)
            {
                SoundHelper.playSoundById(this.props.obj.musicId, this.props.frame / ObjectHelper.project!.settings.fps);
            }
        }

        if (!this.props.playing && (stage !== prevStage || this.props.refresh !== prevProps.refresh))
        {
            this.resetEngine();
            this.engine.invalidateCache();
            this.props.onFinalFrameCalculate(this.engine.finalFrame);
        }

        const lastMuted = this.engine.muted;
        this.engine.muted = !this.props.playing || this.props.muted;
        if (!this.engine.muted && lastMuted)
        {
            if (this.props.obj.musicId !== -1)
            {
                SoundHelper.playSoundById(this.props.obj.musicId, this.props.frame / ObjectHelper.project!.settings.fps);
            }
        }
        this.dirty = true;
    }

    handleResize = () =>
    {
        if (this.containerRef.current && this.canvas)
        {
            const containerSize = Point.fromSizeLike(this.containerRef.current.getBoundingClientRect());
            const stageSize = Point.fromPointLike(this.stage.size);
            
            const cr = containerSize.ratio;
            const sr = stageSize.ratio;

            if (cr < sr)
            {
                this.canvas.canvas.style.width = "100%";
                this.canvas.canvas.style.height = "";
            }
            else
            {
                this.canvas.canvas.style.height = "100%";
                this.canvas.canvas.style.width = "";
            }
            //this.canvas.scale(ratio, "translate(-50%,-50%)", "");
            /*if ((ratio >= 1 && this.ratio < 1) || (ratio < 1 && this.ratio >= 1))
            {
                this.canvas.pixelated = ratio >= 1;
            }*/
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
        SoundHelper.stopAll();
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
            const containsPoint = (spriteId: number | null | undefined, spawnPosition: PointLike): boolean =>
            {
                if (spriteId === null || spriteId === undefined) return false;
                const sprite = ObjectHelper.getObjectWithId<SpriteModel>(spriteId);
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
            if (player && containsPoint(player.spriteId, this.stage.playerSpawnPosition))
            {
                this.selectedEntityType = "player";
                this.selectedEntityPos = new Point(player.spawnPositionX, player.spawnPositionY);
                this.selectedIndex = -1;
                return;
            }

            const enemies = this.entities.filter(e => e.alive && e.type === "enemy");
            const found = enemies.find((e) =>
            {
                return containsPoint(e.spriteId, { x: e.positionX, y: e.positionY });
            });
            if (found)
            {
                this.selectedEntityType = "enemy";
                this.selectedEntityPos = new Point(found.spawnPositionX, found.spawnPositionY);
                this.selectedIndex = this.stage.enemies.findIndex(e => e.id === found.id);
                if (this.selectedIndex === -1)
                {
                    throw new Error("bad index iodk");
                }
                // this.props.onSelectEnemy(this.selectedIndex);
                return;
            }
            
            const form = this.entities.find(e => e.alive && e.type === "boss");
            if (form && containsPoint(form.spriteId, { x: form.positionX, y: form.positionY }))
            {
                this.selectedEntityType = "boss";
                this.selectedEntityPos = new Point(form.spawnPositionX, form.spawnPositionY);
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

    resetEngine = () =>
    {
        SoundHelper.stopAll();
        this.engine.reset(this.stage);
    }

    renderEntities = () =>
    {
        const container = new PIXI.Container();

        // console.time("==== background");
        const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.stage.backgroundId);
        if (background)
        {
            const texture = StageRenderer.textureCache.get(background.id)![0];
            const psprite = new PIXI.Sprite(texture);
            psprite.position = new PIXI.Point(0, 0);
            psprite.width = this.canvas!.width;
            psprite.height = this.canvas!.height;
            container.addChild(psprite);
        }
        // console.timeEnd("==== background");

        // console.time("==== entities");
        this.entities.forEach((entity) =>
        {            
            if (entity.alive)
            {
                const sprite = ObjectHelper.getObjectWithId<SpriteModel>(entity.spriteId);
                if (sprite)
                {
                    const pos = new Point(entity.positionX, entity.positionY);
                    // console.time("== fetching");
                    const img = ImageCache.getCachedImage(sprite.path);
                    const currentCell = Math.floor(entity.age / (sprite.framesPerCell || entity.age)) % sprite.numCells;
                    const cellSize = new Point(Math.floor(img.width / sprite.numCells), img.height);
                    const offsetPos = pos.minus(cellSize.dividedBy(2));
        
                    const texture = StageRenderer.textureCache.get(entity.spriteId)![currentCell];
                    const psprite = new PIXI.Sprite(texture);
                    psprite.position = offsetPos;
                    psprite.alpha = entity.opacity;
                    psprite.scale = new PIXI.Point(entity.scaleX, entity.scaleY);
                    psprite.tint = entity.tint;
                    container.addChild(psprite);
                    // console.timeEnd("== fetching");
                }
            }
        });
        // console.timeEnd("==== entities");

        this.engine.spritesToDraw.forEach((info) =>
        {
            const sprite = ObjectHelper.getObjectWithName<SpriteModel>(info.name);
            if (sprite && sprite.type === "sprite")
            {
                const pos = new Point(info.x, info.y);
                // console.time("== fetching");
                const img = ImageCache.getCachedImage(sprite.path);
                const currentCell = info.frame;
                const cellSize = new Point(Math.floor(img.width / sprite.numCells), img.height);
                const offsetPos = pos.minus(cellSize.dividedBy(2));
    
                const texture = StageRenderer.textureCache.get(sprite.id)![currentCell];
                const psprite = new PIXI.Sprite(texture);
                psprite.position = offsetPos;
                psprite.alpha = info.opacity;
                psprite.scale = new PIXI.Point(info.scaleX, info.scaleY);
                psprite.tint = info.tint;
                container.addChild(psprite);
                // console.timeEnd("== fetching");
            }
        });

        this.renderer!.render(container);
    };

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
            // console.time(">>> render stage play");
            // console.time("engine stuff");
            const r = this.engine.advanceFrame({
                keys: this.keyDownMap,
                playerInvincible: this.props.playerInvincible
            });
            // console.timeEnd("engine stuff");

            // console.time("render stuff");
            this.entities = r.entities;
            // console.time("== onplayframe");
            this.props.onPlayFrame(r.stageAge, r.isLastUpdate);
            // console.timeEnd("== onplayframe");
            if (!r.playerAlive)
            {
                this.props.onPlayerDie();
                dirtyBuffer = true;
            }
            
            // console.time("== render entities");
            this.renderEntities();
            // console.timeEnd("== render entities");
            // console.timeEnd("render stuff");
            // console.timeEnd(">>> render stage play");
        }
        else
        {
            if (this.selectedEntityType !== "none")
            {
                const pt = this.selectedEntityPos.plus(this.mouseDelta).times(100).rounded.dividedBy(100).toObject();
                let stage = this.stage;

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

                this.props.update(stage);
            }
            
            if (this.dirty)
            {
                // console.time(">>> render stage");
                //this.canvas?.clear();
                // console.time("engine stuff");
                // console.time("== reset");
                this.resetEngine();
                // console.timeEnd("== reset");
                // console.time("== fast forward");
                const r = this.engine.fastForwardTo(this.props.frame);
                // console.timeEnd("== fast forward");
                // console.timeEnd("engine stuff");
                // console.time("render stuff");
                this.entities = r.entities;
                this.renderEntities();
                // console.timeEnd("render stuff");
                // console.timeEnd(">>> render stage");
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
