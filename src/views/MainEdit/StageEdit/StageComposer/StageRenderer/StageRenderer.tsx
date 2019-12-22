import React from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, SpriteModel } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import GameEngine, { UpdateResult, GameEntity } from '../../../../../utils/GameEngine';

interface Props
{
    project: ProjectModel;
    stage: StageModel;
    frame: number;
    refresh: boolean;
    selectedEntityIndex: number;
    editMode: "enemy" | "boss";
    onInstanceCount: (instances: number, bullets: number) => any;
    onPlayerDie: () => any;
    onPlayFrame: (frame: number, isLastFrame: boolean) => any;
    playing: boolean;
    playerInvincible: boolean;
}

interface State
{
}

export default class StageRenderer extends React.PureComponent<Props, State>
{
    private canvas: Canvas | null = null;
    private containerRef: React.RefObject<HTMLDivElement>;
    private dirty: boolean = true;
    private rendering: boolean = false;
    private ratio: number = 1;
    private keyDownMap: Map<string, boolean> = new Map();
    private animationFrameHandle: number | null = null;
    private engine: GameEngine;

    constructor(props: Props)
    {
        super(props);
        
        this.engine = new GameEngine();
        window.addEventListener("resize", this.handleResize);
        this.containerRef = React.createRef();
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
            if ((ratio >= 1 && this.ratio < 1) || (ratio < 1 && this.ratio >= 1))
            {
                this.canvas.pixelated = ratio >= 1;
            }
            this.ratio = ratio;
            this.dirty = true;
        }
    }

    componentDidMount = () =>
    {
        this.handleResize();
        this.requestRender();
        this.resetEngine();
        this.engine.invalidateCache();
    }

    componentWillUnmount = () =>
    {
        if (this.animationFrameHandle !== null)
        {
            cancelAnimationFrame(this.animationFrameHandle);
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

    renderSpriteHaver = (spriteId: number, pos: Point, hilite: boolean) =>
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

    resetEngine = () =>
    {
        this.engine.reset(this.props.stage, this.props.project, this.props.editMode === "enemy" ? "previewEnemies" : "previewBoss", this.props.selectedEntityIndex);
    }

    drawBackground = () =>
    {
        if (this.canvas)
        {
            const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.props.stage.backgroundId, this.props.project);
            if (background)
            {
                const img = ImageCache.getImageSync(background.path);
                this.canvas.drawImage(img, new Rectangle(new Point(0), Point.fromPointLike(this.props.stage.size)));
            }
        }
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

        let entities: GameEntity[] = [];

        if (this.props.playing)
        {
            this.canvas?.clear();
            this.drawBackground();
            const r = this.engine.advanceFrame({
                keys: this.keyDownMap,
                playerInvincible: this.props.playerInvincible
            });

            entities = r.entities;
            this.props.onPlayFrame(r.offsetStageAge, r.isLastUpdate);
            if (!r.playerAlive)
            {
                this.props.onPlayerDie();
                dirtyBuffer = true;
            }
        }
        else if (this.dirty)
        {
            this.canvas?.clear();
            this.drawBackground();
            this.resetEngine();
            const r = this.engine.fastForwardTo(this.props.frame);
            entities = r.entities;
        }

        entities.forEach((entity) =>
        {
            this.renderSpriteHaver(entity.obj.spriteId, Point.fromPointLike(entity.position), false);
        });

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
