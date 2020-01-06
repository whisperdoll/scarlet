import { ObjectType, ProjectModel, ObjectModel, SpriteModel, PlayerModel, ScriptModel, EnemyModel, BulletModel, BossModel, StageModel, BackgroundModel, BossFormModel, KeyBindings } from "./datatypes";
import { array_copy, array_remove, array_ensureOne } from "./utils";
import update from "immutability-helper";
import Point, { PointLike } from "./point";
import ImageCache from "./ImageCache";
import React from "react";

export type ObjectEventHandler = (id: number, obj: ObjectModel | null, prevObj: ObjectModel | null, action: "update" | "create" | "delete") => any;

export default class ObjectHelper
{
    private static _project: ProjectModel | null;
    public static projectFilename: string;
    public static errors: string[] = [];

    private static objectSubscriptions = new Map<number, ObjectEventHandler[]>();
    private static errorSubscriptions: ((errors: string[]) => any)[] = [];
    private static keyBindingSubscriptions: ((keyBindings: KeyBindings) => any)[] = [];

    public static set project(project: ProjectModel | null)
    {
        this._project = project;
        this.checkForErrors();
    }

    public static get project(): ProjectModel | null
    {
        return this._project;
    }

    public static subscribeToErrors(handler: (errors: string[]) => any)
    {
        this.errorSubscriptions.push(handler);
    }

    public static unsubscribeFromErrors(handler: (errors: string[]) => any)
    {
        const removal = array_remove(this.errorSubscriptions, handler);
        if (!removal.existed)
        {
            throw new Error("not subscribed to that object");
        }
    }

    public static subscribeToKeyBindings(handler: (keyBindings: KeyBindings) => any)
    {
        this.keyBindingSubscriptions.push(handler);
    }

    public static unsubscribeFromKeyBindings(handler: (keyBindings: KeyBindings) => any)
    {
        const removal = array_remove(this.keyBindingSubscriptions, handler);
        if (!removal.existed)
        {
            throw new Error("not subscribed to that object");
        }
    }

    public static subscribeToObject(id: number, handler: ObjectEventHandler)
    {
        let arr = this.objectSubscriptions.get(id);
        if (!arr)
        {
            arr = [];
            this.objectSubscriptions.set(id, arr);
        }

        arr.push(handler);
    }

    public static unsubscribeFromObject(id: number, handler: ObjectEventHandler)
    {
        let arr = this.objectSubscriptions.get(id);
        if (!arr)
        {
            arr = [];
            this.objectSubscriptions.set(id, arr);
            throw new Error("not subscribed to that object");
        }

        const removal = array_remove(arr, handler);
        if (!removal.existed)
        {
            throw new Error("not subscribed to that object");
        }
    }

    private static broadcastErrors()
    {
        this.errorSubscriptions.forEach(handler => handler(this.errors));
    }

    private static broadcastKeyBindings()
    {
        this.keyBindingSubscriptions.forEach(handler => handler(this.project!.keyBindings));
    }

    private static broadcastObjectUpdate(id: number, newObj: ObjectModel | null, prevObj: ObjectModel | null)
    {
        const arr = this.objectSubscriptions.get(id);
        if (arr)
        {
            arr.forEach(handler => handler(id, newObj, prevObj, "update"));
        }
    }

    private static broadcastObjectCreate(id: number, obj: ObjectModel)
    {
        const arr = this.objectSubscriptions.get(id);
        if (arr)
        {
            arr.forEach(handler => handler(id, obj, null, "create"));
        }
    }

    private static broadcastObjectDelete(id: number, prevObj: ObjectModel | null)
    {
        const arr = this.objectSubscriptions.get(id);
        if (arr)
        {
            arr.forEach(handler => handler(id, null, prevObj, "delete"));
        }
    }

    private static checkForErrors()
    {
        this.errors = [];
        if (!this.project) return;

        const objects = this.project.objects;

        const namesSeen: Set<string> = new Set();

        for (let i = 0; i < objects.length; i++) {
            // dup names //
            const obj = objects[i];
            if (namesSeen.has(obj.name))
            {
                array_ensureOne(this.errors, "duplicate name: `" + obj.name + "`");
            }
            namesSeen.add(obj.name);

            // empty names //
            if (!obj.name.trim())
            {
                array_ensureOne(this.errors, "empty name on " + obj.type + " object");
            }
        }

        this.broadcastErrors();
    }

    public static updateKeyBindings(keyBindings: KeyBindings)
    {
        this.project = {
            ...this.project!,
            keyBindings: keyBindings
        };

        this.broadcastKeyBindings();
    }

    public static createAndAddObject<T extends ObjectModel>(type: ObjectType): number
    {
        const id = this.genId();
        let ret: ObjectModel;
        const objectNumber = this.getObjectsWithType(type).length.toString();

        // ADDTYPE
        switch (type)
        {
            case "sprite":
                ret = {
                    id: id,
                    name: "New Sprite " + objectNumber,
                    type: "sprite",
                    path: "",
                    hitboxes: [],
                    numCells: 1,
                    framesPerCell: 0
                } as SpriteModel;
                break;
            case "player":
                ret = {
                    id: id,
                    name: "New Player " + objectNumber,
                    moveSpeed: 400,
                    focusedMoveSpeed: 200,
                    lives: 3,
                    scriptId: -1,
                    spriteId: -1,
                    bulletId: -1,
                    type: "player"
                } as PlayerModel;
                break;
            case "script":
                ret = {
                    id: id,
                    name: "New Script " + objectNumber,
                    path: "",
                    type: "script"
                } as ScriptModel;
                break;
            case "enemy":
                ret = {
                    id: id,
                    name: "New Enemy " + objectNumber,
                    bulletId: -1,
                    scriptId: -1,
                    spriteId: -1,
                    type: "enemy",
                    hp: 5
                } as EnemyModel;
                break;
            case "bullet":
                ret = {
                    id: id,
                    name: "New Bullet " + objectNumber,
                    scriptId: -1,
                    spriteId: -1,
                    type: "bullet",
                    damage: 1,
                    fireRate: 1
                } as BulletModel;
                break;
            case "boss":
                ret = {
                    id: id,
                    name: "New Boss " + objectNumber,
                    formIds: [],
                    type: "boss"
                } as BossModel;
                break;
            case "bossForm":
                ret = {
                    id: id,
                    name: "New Form " + objectNumber,
                    bulletId: -1,
                    hp: 100,
                    lifetime: 60 * 30,
                    scriptId: -1,
                    spriteId: -1,
                    type: "bossForm"
                } as BossFormModel;
                break;
            case "stage":
                ret = {
                    id: id,
                    name: "New Stage " + objectNumber,
                    type: "stage",
                    backgroundId: -1,
                    bossId: -1,
                    playerId: -1,
                    length: 60 * 60,
                    enemies: [],
                    size: {
                        x: 384,
                        y: 448
                    },
                    playerSpawnPosition: {
                        x: 384 / 2,
                        y: 400
                    },
                    bossSpawnPosition: {
                        x: 384 / 2,
                        y: 100
                    }
                } as StageModel;
                break;
            case "background":
                ret = {
                    id: id,
                    name: "New Background " + objectNumber,
                    type: "background",
                    path: ""
                } as BackgroundModel;
                break;
            default:
                throw new Error("fuck u");
        }

        // add to project //
        this.project = update(this.project, {
            objects: {
                $push: [ ret ]
            }
        });

        this.broadcastObjectCreate(id, ret);
        return id;
    }

    public static updateObject<T extends ObjectModel>(id: number, newObj: T)
    {
        const oldObj = this.getObjectWithId(id);
        const index = this.project!.objects.findIndex(o => o.id === id);
        if (index === -1) 
        {
            throw new Error("object with id " + id + " doesn't exist :c");
        }

        this.project = update(this.project!, {
            objects: {
                [index]: {
                    $set: newObj
                }
            }
        });

        this.broadcastObjectUpdate(id, newObj, oldObj);
    }

    public static removeObject(id: number)
    {
        const oldObj = this.getObjectWithId(id);
        const index = this.project!.objects.findIndex(o => o.id === id);
        if (index === -1)
        {
            throw new Error("object with id " + id + " does not exist :c");
        }

        this.project = update(this.project!, {
            objects: {
                $splice: [[ index ]]
            }
        });

        this.broadcastObjectDelete(id, oldObj);
    }

    /**
     * @param parentObject The parent object.
     * @param subIdentifier An identifier for the child object. e.g. "sprite" for object returned by spriteId, or "form[0].sprite" for sprite of first form
     * @param project The project.
     */
    public static getSubObject<T extends ObjectModel>(parentObject: ObjectModel | number | null, subIdentifier: string): T | null
    {
        if (typeof(parentObject) === "number")
        {
            parentObject = this.getObjectWithId(parentObject);
        }

        if (!parentObject) return null;

        const parts = subIdentifier.split(".").map((part) =>
        {
            if (part.endsWith("]"))
            {
                const braceIndex = part.indexOf("[");
                const index = parseInt(part.substr(braceIndex + 1));
                if (isNaN(index))
                {
                    console.error("bad index in id", index, part)
                    throw new Error("bad index in indentifier, see console for more details");
                }

                return [part.substr(0, braceIndex) + "Ids", index];
            }
            else
            {
                return [part + "Id", -1];
            }
        });

        let obj: ObjectModel | null = parentObject;
        for (let i = 0; i < parts.length; i++)
        {
            if (parts[i][1] >= 0)
            {
                obj = this.getObjectWithId((obj as any)[parts[i][0]][parts[i][1]]);
            }
            else
            {
                obj = this.getObjectWithId((obj as any)[parts[i][0]]);
            }

            if (!obj) return null;
        }

        return obj as T | null;
    }

    /**
     * @param type Type of objects to get
     */
    public static getObjectsWithType<T extends ObjectModel>(type: ObjectType): T[]
    {
        return this.project!.objects.filter(o => o.type === type) as T[];
    }

    /**
     * @param id Id of the object to get
     * @param project Project
     * @returns Object with id. If the id is invalid, returns null.
     */
    public static getObjectWithId<T extends ObjectModel>(id: number): T | null
    {
        if (id < 0) return null;
        return (this.project!.objects.find(o => o.id === id) as T) || null;
    }

    public static getObjectWithName<T extends ObjectModel>(name: string): T | null
    {
        if (!name) return null;
        return (this.project!.objects.find(o => o.name === name) as T) || null;
    }

    private static genId(): number
    {
        // TODO: optimize this w/ a cache ?
        for (let i = 0; i < 1000000; i++)
        {
            if (!this.project!.objects.find(o => o.id === i))
            {
                return i;
            }
        }

        throw new Error("max game objects");
    }

    public static getSpriteSize(sprite: SpriteModel | number): Point
    {
        if (typeof(sprite) === "number")
        {
            sprite = this.getObjectWithId<SpriteModel>(sprite)!;
            if (!sprite) throw new Error("bad sprite id"); 
        }

        const img = ImageCache.getCachedImage(sprite.path);
        const cellWidth = Math.floor(img.width / sprite.numCells);
        return new Point(cellWidth, img.height);
    }
}