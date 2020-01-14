import React from 'react';
import './MainMenuEdit.scss';
import { KeyBindings, ProjectSettings, MainMenu, ProjectModel } from '../../../utils/datatypes';
import update from "immutability-helper";
import ObjectHelper from '../../../utils/ObjectHelper';
import KeyBindEdit from '../KeyBindEdit/KeyBindEdit';
import ObjectSelect from '../../../components/ObjectSelect/ObjectSelect';
import PureCanvas from '../../../components/PureCanvas/PureCanvas';
import { Canvas } from '../../../utils/canvas';
import Point from '../../../utils/point';
import ImageCache from '../../../utils/ImageCache';
import Rectangle, { RectAnchor } from '../../../utils/rectangle';
import PathHelper from '../../../utils/PathHelper';
import { array_swap, array_copy } from '../../../utils/utils';
const { dialog } = require("electron").remote;

interface Props
{
    onBack: () => any;
}

interface State
{
    mainMenu: MainMenu;
    loading: boolean;
    selectedImageIndex: number;
}

export default class MainMenuEdit extends React.PureComponent<Props, State>
{
    private canvas: Canvas | null = null;
    private containerRef: React.RefObject<HTMLDivElement>;
    private mouseIsDown = false;
    private animationFrame: number | null = null;
    private mouseOriginalPos: Point = new Point();
    private mouseLastPos: Point = new Point();
    private mousePos: Point = new Point();
    private canvasScale = 1;
    private isResizing = false;
    private resizeHandle: RectAnchor = "ne";

    constructor(props: Props)
    {
        super(props);

        this.state = {
            mainMenu: ObjectHelper.project!.mainMenu,
            loading: true,
            selectedImageIndex: -1
        };
        
        ObjectHelper.subscribeToProject(this.handleProjectUpdate);
        this.containerRef = React.createRef();

        this.animationFrame = requestAnimationFrame(this.handleAnimationFrame);
    }

    handleAnimationFrame = () =>
    {
        if (this.mouseIsDown && this.state.selectedImageIndex !== -1 && this.canvas)
        {
            const image = this.state.mainMenu.images[this.state.selectedImageIndex];

            if (this.isResizing)
            {
                const anchor = Rectangle.anchorOpposite(this.resizeHandle);
                const imageRect = new Rectangle(Point.fromPointLike(image), Point.fromSizeLike(image));
                const resizeRect = Rectangle.between(imageRect.getPointFromAnchor(anchor), this.mousePos);
                imageRect.fitInsideGreedy(resizeRect, Rectangle.anchorOpposite(this.resizeHandle));
                image.x = imageRect.x;
                image.y = imageRect.y;
                image.width = imageRect.width;
                image.height = imageRect.height;
            }
            else
            {
                const delta = this.mousePos.minus(this.mouseLastPos);
                image.x += delta.x;
                image.y += delta.y;
                this.mouseLastPos = this.mousePos;
            }

            this.renderMainMenu();
        }

        if (this.animationFrame !== null)
        {
            this.animationFrame = requestAnimationFrame(this.handleAnimationFrame);
        }
    }

    componentDidMount = () =>
    {
        this.refreshImages();
    }

    refreshImages = () =>
    {
        ImageCache.updateCache(ObjectHelper.project!, () =>
        {
            this.setState(state => ({
                ...state,
                loading: false
            }));
        });
    }

    componentWillUnmount = () =>
    {
        ObjectHelper.subscribeToProject(this.handleProjectUpdate);
        if (this.animationFrame !== null)
        {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    componentDidUpdate = (prevProps: Props, prevState: State) =>
    {
        if (prevState.loading && !this.state.loading)
        {
            this.handleResize();
            window.addEventListener("resize", this.handleResize);
        }

        this.renderMainMenu();
    }

    handleProjectUpdate = (project: ProjectModel | null) =>
    {
        if (project)
        {
            this.setState(state => ({
                ...state,
                mainMenu: project.mainMenu
            }));
        }
    }

    grabCanvas = (canvas: Canvas) =>
    {
        this.canvas = canvas;
        canvas.resize(new Point(
            ObjectHelper.project!.settings.resolutionX,
            ObjectHelper.project!.settings.resolutionY
        ), false);
        canvas.fill("black");

        canvas.canvas.addEventListener("click", (e) =>
        {
            e.stopPropagation();
        });

        canvas.addEventListener("mousedown", (pos, e) =>
        {
            this.mouseIsDown = true;
            this.mouseOriginalPos = pos;

            if (this.state.selectedImageIndex !== -1)
            {
                const image = this.state.mainMenu.images[this.state.selectedImageIndex];
                const rect = new Rectangle(Point.fromPointLike(image), Point.fromSizeLike(image));
                const r = 5 * this.canvasScale;
    
                const handleRect = (pt: Point) =>
                {
                    return new Rectangle(
                        pt.minus(r),
                        new Point(r * 2)
                    );
                };
    
                const dict: Record<string, RectAnchor> = {
                    "topLeft": "nw",
                    "topCenter": "n",
                    "topRight": "ne",
                    "leftCenter": "w",
                    "rightCenter": "e",
                    "bottomLeft": "sw",
                    "bottomCenter": "s",
                    "bottomRight": "se"
                };
    
                for (const pt in dict)
                {
                    if (handleRect((rect as any)[pt]).containsPoint(pos))
                    {
                        this.isResizing = true;
                        this.resizeHandle = dict[pt];
                        break;
                    }
                }
            }

            if (!this.isResizing)
            {
                for (let i = this.state.mainMenu.images.length - 1; i >= 0; i--)
                {
                    const image = this.state.mainMenu.images[i];
                    if (new Rectangle(Point.fromPointLike(image), Point.fromSizeLike(image)).containsPoint(pos))
                    {
                        this.setState(state => ({
                            ...state,
                            selectedImageIndex: i
                        }), () =>
                        {
                            this.mouseLastPos = pos;
                        });
                        return;
                    }
                }

                this.setState(state => ({
                    ...state,
                    selectedImageIndex: -1
                }));
            }
        });

        canvas.addEventListener("mousemove", (pos) =>
        {
            this.mousePos = pos;

            let foundOne = false;

            if (this.state.selectedImageIndex !== -1)
            {
                const image = this.state.mainMenu.images[this.state.selectedImageIndex];
                const rect = new Rectangle(Point.fromPointLike(image), Point.fromSizeLike(image));
                const r = 5 * this.canvasScale;

                const handleRect = (pt: Point) =>
                {
                    return new Rectangle(
                        pt.minus(r),
                        new Point(r * 2)
                    );
                };

                const dict: Record<string, string> = {
                    "topLeft": "nwse",
                    "topCenter": "ns",
                    "topRight": "nesw",
                    "leftCenter": "ew",
                    "rightCenter": "ew",
                    "bottomLeft": "nesw",
                    "bottomCenter": "ns",
                    "bottomRight": "nwse"
                };

                for (const pt in dict)
                {
                    if (handleRect((rect as any)[pt]).containsPoint(pos))
                    {
                        this.canvas!.canvas.style.cursor = dict[pt] + "-resize";
                        foundOne = true;
                        break;
                    }
                }
            }

            if (!foundOne)
            {
                for (const image of this.state.mainMenu.images)
                {
                    if (new Rectangle(Point.fromPointLike(image), Point.fromSizeLike(image)).containsPoint(pos))
                    {
                        this.canvas!.canvas.style.cursor = "move";
                        foundOne = true;
                        break;
                    }
                }
            }

            if (!foundOne)
            {
                this.canvas!.canvas.style.cursor = "";
            }
        });

        canvas.addEventListener("mouseup", () => { this.mouseIsDown = this.isResizing = false });
        canvas.addEventListener("mouseleave", () => { this.mouseIsDown = this.isResizing = false });
    }

    renderMainMenu = () =>
    {
        if (!this.canvas) return;

        this.canvas.clear();
        
        let i = 0;
        for (const image of this.state.mainMenu.images)
        {
            const rect = new Rectangle(
                new Point(image.x, image.y),
                new Point(image.width, image.height)
            );

            this.canvas.drawImage(ImageCache.getCachedImage(image.path), rect);

            if (i === this.state.selectedImageIndex)
            {
                this.canvas.drawRect(rect, "red", 1.5 * this.canvasScale, false);

                const drawHandle = (pt: Point) =>
                {
                    this.canvas?.fillCircle(pt, 5 * this.canvasScale, "white");
                    this.canvas?.drawCircle(pt, 5 * this.canvasScale, "red", 1.5 * this.canvasScale);
                }

                drawHandle(rect.topLeft);
                drawHandle(rect.topCenter);
                drawHandle(rect.topRight);
                drawHandle(rect.leftCenter);
                drawHandle(rect.rightCenter);
                drawHandle(rect.bottomLeft);
                drawHandle(rect.bottomCenter);
                drawHandle(rect.bottomRight);
            }

            i++;
        }
    }

    handleResize = () =>
    {
        if (this.containerRef.current && this.canvas)
        {
            const containerSize = Point.fromSizeLike(this.containerRef.current.getBoundingClientRect());
            const gameSize = new Point(
                ObjectHelper.project!.settings.resolutionX,
                ObjectHelper.project!.settings.resolutionY,
            );
            
            const cr = containerSize.ratio;
            const sr = gameSize.ratio;

            if (cr < sr)
            {
                this.canvas.canvas.style.width = "100%";
                this.canvas.canvas.style.height = "";
                this.canvasScale = gameSize.x / containerSize.x;
            }
            else
            {
                this.canvas.canvas.style.height = "100%";
                this.canvas.canvas.style.width = "";
                this.canvasScale = gameSize.y / containerSize.y;
            }
            this.renderMainMenu();
            //this.canvas.scale(ratio, "translate(-50%,-50%)", "");
            /*if ((ratio >= 1 && this.ratio < 1) || (ratio < 1 && this.ratio >= 1))
            {
                this.canvas.pixelated = ratio >= 1;
            }*/
        }
    }

    handleAddImage = () =>
    {
        const paths = dialog.showOpenDialogSync({
            title: "Add Image...",
            filters:
            [
                {
                    name: "Image file",
                    extensions: [ "png", "jpg", "jpeg" ]
                },
                {
                    name: "All Files",
                    extensions: ["*"]
                }
            ],
            properties: [ "openFile" ]
        });

        if (paths && paths[0])
        {
            const destFilename = PathHelper.importObjectFileName(paths[0], "images");
            ImageCache.getImage(destFilename, (image) =>
            {
                ObjectHelper.project = update(ObjectHelper.project, {
                    mainMenu: {
                        images: {
                            $push: [{
                                 height: image.height,
                                 width: image.width,
                                 x: 0,
                                 y: 0,
                                 path: destFilename
                            }]
                        }
                    }
                });
            });
        }
    }

    handleClickImageItem = (e: React.MouseEvent) =>
    {
        const index = parseInt(e.currentTarget.getAttribute("data-index")!);

        this.setState(state => ({
            ...state,
            selectedImageIndex: index
        }));
    }

    handleMoveBackOne = () =>
    {
        if (this.state.selectedImageIndex === 0) return;

        const newArray = array_copy(this.state.mainMenu.images);
        array_swap(newArray, this.state.selectedImageIndex, this.state.selectedImageIndex - 1);

        ObjectHelper.project = update(ObjectHelper.project!, {
            mainMenu: {
                images: {
                    $set: newArray
                }
            }
        });

        this.setState(state => ({
            ...state,
            selectedImageIndex: state.selectedImageIndex - 1
        }));
    };

    handleMoveForwardOne = () =>
    {
        if (this.state.selectedImageIndex === this.state.mainMenu.images.length - 1) return;
        
        const newArray = array_copy(this.state.mainMenu.images);
        array_swap(newArray, this.state.selectedImageIndex, this.state.selectedImageIndex + 1);

        ObjectHelper.project = update(ObjectHelper.project!, {
            mainMenu: {
                images: {
                    $set: newArray
                }
            }
        });

        this.setState(state => ({
            ...state,
            selectedImageIndex: state.selectedImageIndex + 1
        }));
    };

    handleSendToBack = () =>
    {
        if (this.state.selectedImageIndex === 0) return;

        const newArray = array_copy(this.state.mainMenu.images);
        const image = newArray[this.state.selectedImageIndex];

        for (let i = this.state.selectedImageIndex - 1; i >= 0; i--)
        {
            newArray[i + 1] = newArray[i];
        }

        newArray[0] = image;

        ObjectHelper.project = update(ObjectHelper.project!, {
            mainMenu: {
                images: {
                    $set: newArray
                }
            }
        });

        this.setState(state => ({
            ...state,
            selectedImageIndex: 0
        }));
    };

    handleSendToFront = () =>
    {
        if (this.state.selectedImageIndex === this.state.mainMenu.images.length - 1) return;

        const newArray = array_copy(this.state.mainMenu.images);
        const image = newArray[this.state.selectedImageIndex];

        for (let i = this.state.selectedImageIndex + 1; i < newArray.length; i++)
        {
            newArray[i - 1] = newArray[i];
        }

        newArray[newArray.length - 1] = image;
        
        ObjectHelper.project = update(ObjectHelper.project!, {
            mainMenu: {
                images: {
                    $set: newArray
                }
            }
        });

        this.setState(state => ({
            ...state,
            selectedImageIndex: newArray.length - 1
        }));
    }

    handleBack = () =>
    {
        this.props.onBack();
    }

    handleRemoveImage = () =>
    {
        if (this.state.selectedImageIndex !== -1)
        {
            ObjectHelper.project = update(ObjectHelper.project!, {
                mainMenu: {
                    images: {
                        $splice: [[ this.state.selectedImageIndex, 1 ]]
                    }
                }
            });

            this.setState(state => ({
                ...state,
                selectedImageIndex: -1
            }));
        }
    }

    handleDeselectImages = () =>
    {
        this.setState(state => ({
            ...state,
            selectedImageIndex: -1
        }));
    }
    
    render = () =>
    {
        return (this.state.loading ? <div className="mainMenuEdit col">Loading...</div> : (
            <div className="mainMenuEdit col">
                <div className="row header">
                    <button onClick={this.handleBack}>&lt; Back</button>
                    <h1>Main Menu</h1>
                    <button
                        className="refreshImages"
                        onClick={this.refreshImages}
                    >
                        Refresh Images
                    </button>
                </div>
                <div className="edit row">
                    <div className="col leftCol">
                        <button onClick={this.handleAddImage}>+ Add Image</button>
                        <div className="imageList">
                            {this.state.mainMenu.images.map((image, i) =>
                            (
                                <div
                                    className="imageItem"
                                    onClick={this.handleClickImageItem}
                                    data-index={i.toString()}
                                    key={i}
                                >
                                    <img src={PathHelper.resolveObjectFileName(image.path)}></img>
                                </div>
                            ))}
                        </div>
                        {this.state.selectedImageIndex !== -1 && (<React.Fragment>
                            <button onClick={this.handleMoveBackOne}>Move Back</button>
                            <button onClick={this.handleMoveForwardOne}>Move Forward</button>
                            <button onClick={this.handleSendToBack}>Send to Back</button>
                            <button onClick={this.handleSendToFront}>Send to Front</button>
                            <button className="remove" onClick={this.handleRemoveImage}>- Remove</button>
                        </React.Fragment>)}
                    </div>
                    <div className="preview">
                        <div className="canvasContainer" onClick={this.handleDeselectImages} ref={this.containerRef}>
                            <PureCanvas
                                canvasGrabber={this.grabCanvas}
                                canvasOptions={{
                                    opaque: true,
                                    pixelated: true
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        ));
    }
}
