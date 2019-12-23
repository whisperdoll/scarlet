import React, { ChangeEvent } from 'react';
import './SpriteEdit.scss';
import { SpriteModel, Hitbox } from '../../../utils/datatypes';
import HitboxEdit from './HitboxEdit/HitboxEdit';
import { array_copy, array_remove_at } from '../../../utils/utils';
import ImageCache from '../../../utils/ImageCache';
import PureCanvas from '../../../components/PureCanvas/PureCanvas';
import Point from '../../../utils/point';
import { Canvas } from '../../../utils/canvas';
import * as npath from "path";
import * as fs from "fs";
import PathHelper from '../../../utils/PathHelper';
const { dialog } = require("electron").remote;

interface Props
{
    sprite: SpriteModel;
    onUpdate: (sprite: SpriteModel) => any;
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
            const destFilename = PathHelper.importObjectFileName(paths[0], "sprites");

            ImageCache.invalidateImage(this.props.sprite.path); // clear old
            this.props.onUpdate({
                ...this.props.sprite,
                path: destFilename
            });
        }
    }

    handleNameChange = (e: ChangeEvent<HTMLInputElement>) =>
    {
        this.props.onUpdate({
            ...this.props.sprite,
            name: e.currentTarget.value
        });
    }

    handleHitboxUpdate = (hitbox: Hitbox, index: number) =>
    {
        const newHitboxes = array_copy(this.props.sprite.hitboxes);
        newHitboxes[index] = hitbox;

        this.props.onUpdate({
            ...this.props.sprite,
            hitboxes: newHitboxes
        });
    }

    handleAddHitbox = () =>
    {
        ImageCache.getImage(this.props.sprite.path, (img) =>
        {
            this.props.onUpdate({
                ...this.props.sprite,
                hitboxes: this.props.sprite.hitboxes.concat([{
                    position: {
                        x: img.width / 2,
                        y: img.height / 2
                    },
                    radius: 4
                }])
            });
        });
    }

    handleRemoveHitbox = (index: number) =>
    {
        const newHitboxes = array_copy(this.props.sprite.hitboxes);
        array_remove_at(newHitboxes, index);

        this.props.onUpdate({
            ...this.props.sprite,
            hitboxes: newHitboxes
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
        
        if (this.props.sprite.path)
        {
            ImageCache.getImage(this.props.sprite.path, (img) =>
            {
                this.canvas?.resize(Point.fromSizeLike(img), false);
                this.canvas?.drawImage(img, new Point(0));

                this.props.sprite.hitboxes.forEach((hitbox) =>
                {
                    this.canvas?.fillCircle(Point.fromPointLike(hitbox.position), hitbox.radius, "rgba(255,0,0,0.5)");
                });
            });
        }
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
                        value={this.props.sprite.name}
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
                {this.props.sprite.hitboxes.map((hitbox, i) =>
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
