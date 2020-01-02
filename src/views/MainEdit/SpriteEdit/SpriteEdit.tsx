import React, { ChangeEvent } from 'react';
import './SpriteEdit.scss';
import { SpriteModel, Hitbox, ProjectModel } from '../../../utils/datatypes';
import HitboxEdit from './HitboxEdit/HitboxEdit';
import { array_copy, array_remove_at } from '../../../utils/utils';
import ImageCache from '../../../utils/ImageCache';
import PureCanvas from '../../../components/PureCanvas/PureCanvas';
import Point from '../../../utils/point';
import { Canvas } from '../../../utils/canvas';
import * as npath from "path";
import * as fs from "fs";
import PathHelper from '../../../utils/PathHelper';
import update from "immutability-helper";
import Rectangle from '../../../utils/rectangle';
import ObjectHelper from '../../../utils/ObjectHelper';
const { dialog } = require("electron").remote;

interface Props
{
    id: number;
    project: ProjectModel;
    onUpdate: (project: ProjectModel) => any;
}

interface State
{
}

export default class SpriteEdit extends React.PureComponent<Props, State>
{
    private canvas: Canvas | null = null;

    constructor(props: Props)
    {
        super(props);
    }

    get sprite(): SpriteModel
    {
        return ObjectHelper.getObjectWithId<SpriteModel>(this.props.id, this.props.project)!;
    }

    update(obj: Partial<SpriteModel>)
    {
        this.props.onUpdate(ObjectHelper.updateObject(this.props.id, {
            ...this.sprite,
            ...obj
        }, this.props.project));
    }

    handleBrowse = () =>
    {
        let paths = dialog.showOpenDialogSync({
            title: "Set Sprite...",
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
            ImageCache.invalidateImage(this.sprite.path); // clear old
            const destFilename = PathHelper.importObjectFileName(paths[0], "sprites");
            this.update({
                path: destFilename
            });
        }
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.update({
            name: e.currentTarget.value
        });
    }

    handleHitboxUpdate = (hitbox: Hitbox, index: number) =>
    {
        this.update({
            hitboxes: update(this.sprite.hitboxes, {
                [index]: {
                    $set: hitbox
                }
            })
        });
    }

    handleAddHitbox = () =>
    {
        ImageCache.getImage(this.sprite.path, (img) =>
        {
            this.update({
                hitboxes: [...this.sprite.hitboxes, {
                    position: {
                        x: img.width / 2,
                        y: img.height / 2
                    },
                    radius: 4
                }]
            });
        });
    }

    handleRemoveHitbox = (index: number) =>
    {
        this.update({
            hitboxes: update(this.sprite.hitboxes, {
                $splice: [[index, 1]]
            })
        });
    }

    canvasGrabber = (canvas: Canvas) =>
    {
        this.canvas = canvas;
        this.renderSprite();
    }

    componentDidUpdate = () =>
    {
        this.renderSprite();
    }

    renderSprite = () =>
    {
        this.canvas?.clear();
        
        if (this.sprite.path)
        {
            ImageCache.getImage(this.sprite.path, (img) =>
            {
                this.canvas?.resize(Point.fromSizeLike(img), false);
                this.canvas?.drawImage(img, new Point(0));

                const cellSize = new Point(Math.floor(img.width / this.sprite.numCells), img.height);

                for (let i = 0; i < this.sprite.numCells; i++)
                {
                    this.canvas?.drawRect(new Rectangle(cellSize.times(new Point(i, 0)), cellSize.minus(new Point(1))), "red", 1);

                    this.sprite.hitboxes.forEach((hitbox) =>
                    {
                        this.canvas?.fillCircle(Point.fromPointLike(hitbox.position).plus(cellSize.times(new Point(i, 0))), hitbox.radius, "rgba(255,0,0,0.5)");
                    });
                }
            });
        }
    }

    handleNumCellsChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.sprite.numCells;
        }

        this.update({
            numCells: Math.max(val, 1)
        });
    }

    handleFramesPerCellChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        let val = parseInt(e.currentTarget.value);
        if (isNaN(val))
        {
            val = this.sprite.framesPerCell;
        }

        this.update({
            framesPerCell: val
        });
    }

    render = () =>
    {
        return (
            <div className="spriteEdit col-8">
                <div className="row">
                    <span className="label">Name:</span>
                    <input
                        type="text"
                        onChange={this.handleNameChange}
                        value={this.sprite.name}
                    />
                </div>
                <PureCanvas
                    canvasGrabber={this.canvasGrabber}
                    canvasOptions={{
                        pixelated: true,
                        opaque: false
                    }}
                />
                <button onClick={this.handleBrowse}>Browse...</button>
                <div className="row">
                    <span className="label">Number of Cells:</span>
                    <input
                        type="number"
                        value={this.sprite.numCells}
                        onChange={this.handleNumCellsChange}
                    />
                </div>
                <div className="row">
                    <span className="label">Frames per Cell:</span>
                    <input
                        type="number"
                        value={this.sprite.framesPerCell}
                        onChange={this.handleFramesPerCellChange}
                    />
                </div>
                {this.sprite.hitboxes.map((hitbox, i) =>
                {
                    return (
                        <HitboxEdit
                            hitbox={hitbox}
                            onUpdate={this.handleHitboxUpdate}
                            onRequestRemove={this.handleRemoveHitbox}
                            key={i}
                            index={i}
                        />
                    );
                })}
                <button onClick={this.handleAddHitbox}>+ Add Hitbox</button>
            </div>
        );
    }
}
