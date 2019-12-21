import React from 'react';
import './StageRenderer.scss';
import { StageModel, ProjectModel, BackgroundModel, SpriteModel } from '../../../../../utils/datatypes';
import PureCanvas from "../../../../../components/PureCanvas/PureCanvas";
import Point from '../../../../../utils/point';
import { Canvas } from '../../../../../utils/canvas';
import ImageCache from '../../../../../utils/ImageCache';
import ObjectHelper from '../../../../../utils/ObjectHelper';
import Rectangle from '../../../../../utils/rectangle';
import GameEngine, { UpdateResult } from '../../../../../utils/GameEngine';

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
    onPlayFrame: (time: number, delta: number, isLastFrame: boolean) => any;
    playing: boolean;
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
    private lastTime: number = -1;
    private playingDone: boolean = false;

    constructor(props: Props)
    {
        super(props);
        
        this.engine = new GameEngine();

        this.grabCanvas = this.grabCanvas.bind(this);
        this.renderStage = this.renderStage.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleUpdate = this.handleUpdate.bind(this);

        window.addEventListener("resize", this.handleResize);

        this.containerRef = React.createRef();
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

        if (this.props.playing && this.props.time < prevProps.time)
        {
            // we looped //
            this.startPlaying();
        }
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
        this.animationFrameHandle = requestAnimationFrame(this.renderStage);
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
        this.engine.reset(this.props.stage, this.props.project, this.props.editMode === "enemy" ? "previewEnemies" : "previewBoss", this.props.selectedEntityIndex);
        const r = this.engine.fastForwardTo(this.props.time);
        this.lastTime = performance.now();
        this.playingDone = false;
    }

    stopPlaying = () =>
    {

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

    renderStage = (time: number) =>
    {
        if (!this.canvas || !this.dirty || this.rendering || (this.props.playing && this.playingDone))
        {
            this.animationFrameHandle = requestAnimationFrame(this.renderStage);
            return;
        }

        // console.time("> stage render");

        this.rendering = true;
        this.canvas.clear();
    
        const background = ObjectHelper.getObjectWithId<BackgroundModel>(this.props.stage.backgroundId, this.props.project);
        if (background)
        {
            const img = ImageCache.getImageSync(background.path);
            this.canvas.drawImage(img, new Rectangle(new Point(0), this.canvas.size));
        }

        let results: UpdateResult;

        if (this.props.playing)
        {
            const delta = (time - this.lastTime) / 1000;

            results = this.engine.update({
                delta: delta,
                keys: this.keyDownMap,
                playerInvincible: false
            });

            this.props.onPlayFrame(results.offsetStageAge, results.delta, results.isLastUpdate);
            this.lastTime = time;
            this.playingDone = results.isLastUpdate;
            this.dirty = !results.isLastUpdate;
        }
        else
        {
            this.dirty = false;
            // console.time("reset engine");
            this.resetEngine();
            // console.timeEnd("reset engine");
    
            // console.time("loop");
            results = this.engine.fastForwardTo(this.props.time);
            // console.timeEnd("loop");
        }
    
        // console.time("render entities");
        results.entities.forEach((entity) =>
        {
            if (entity.alive)
            {
                this.renderSpriteHaver(entity.obj.spriteId, Point.fromPointLike(entity.position), false);
            }
        });
        // console.timeEnd("render entities");
        
        if (!results.playerAlive)
        {
            this.props.onPlayerDie();
        }
        this.props.onInstanceCount(0, 0);
    
        this.rendering = false;
        this.animationFrameHandle = requestAnimationFrame(this.renderStage);
        // console.timeEnd("> stage render");
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
