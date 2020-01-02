import { ObjectType, ProjectModel, ObjectModel, SpriteModel, PlayerModel, ErrorTypes, ScriptModel, EnemyModel, BulletModel, BossModel, StageModel, BackgroundModel, BossFormModel } from "./datatypes";
import { array_copy, array_remove } from "./utils";
import update from "immutability-helper";
import Point, { PointLike } from "./point";
import ImageCache from "./ImageCache";

export default class ObjectHelper
{
    private static currentProject: ProjectModel;

    public static setCurrentProject(project: ProjectModel)
    {
        this.currentProject = project;
    }

    public static createAndAddObject<T extends ObjectModel>(type: ObjectType, project: ProjectModel = this.currentProject): { obj: T, project: ProjectModel }
    {
        const id = this.genId(project);
        let ret: ObjectModel;

        // ADDTYPE
        switch (type)
        {
            case "sprite":
                ret = {
                    id: id,
                    name: "New Sprite " + this.getObjectsWithType(type, project).length,
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
                    name: "New Player " + this.getObjectsWithType(type, project).length,
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
                    name: "New Script " + this.getObjectsWithType(type, project).length,
                    path: "",
                    type: "script"
                } as ScriptModel;
                break;
            case "enemy":
                ret = {
                    id: id,
                    name: "New Enemy " + this.getObjectsWithType(type, project).length,
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
                    name: "New Bullet " + this.getObjectsWithType(type, project).length,
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
                    name: "New Boss " + this.getObjectsWithType(type, project).length,
                    formIds: [],
                    type: "boss"
                } as BossModel;
                break;
            case "bossForm":
                ret = {
                    id: id,
                    name: "New Form " + this.getObjectsWithType(type, project).length,
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
                    name: "New Stage " + this.getObjectsWithType(type, project).length,
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
                    name: "New Background " + this.getObjectsWithType(type, project).length,
                    type: "background",
                    path: ""
                } as BackgroundModel;
                break;
            default:
                throw new Error("fuck u");
        }

        // add to project //
        const p = update(project, {
            objects: {
                $push: [ ret ]
            }
        });
        return { obj: ret as T, project: p };
    }

    public static updateObject<T extends ObjectModel>(id: number, newObj: T, project: ProjectModel = this.currentProject): ProjectModel
    {
        const index = project.objects.findIndex(o => o.id === id);
        if (index === -1) 
        {
            return project;
        }

        return update(project, {
            objects: {
                [index]: {
                    $set: newObj
                }
            }
        });
    }

    public static removeObject(id: number, project: ProjectModel = this.currentProject): ProjectModel
    {
        const index = project.objects.findIndex(o => o.id === id);
        if (index === -1) return project;

        return update(project, {
            objects: {
                $splice: [[ index ]]
            }
        });
    }

    /**
     * @param parentObject The parent object.
     * @param subIdentifier An identifier for the child object. e.g. "sprite" for object returned by spriteId, or "form[0].sprite" for sprite of first form
     * @param project The project.
     */
    public static getSubObject<T extends ObjectModel>(parentObject: ObjectModel | number | null, subIdentifier: string, project: ProjectModel = this.currentProject): T | null
    {
        if (typeof(parentObject) === "number")
        {
            parentObject = this.getObjectWithId(parentObject, project);
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
                obj = this.getObjectWithId((obj as any)[parts[i][0]][parts[i][1]], project);
            }
            else
            {
                obj = this.getObjectWithId((obj as any)[parts[i][0]], project);
            }

            if (!obj) return null;
        }

        return obj as T | null;
    }

    /**
     * @param type Type of objects to get
     */
    public static getObjectsWithType<T extends ObjectModel>(type: ObjectType, project: ProjectModel = this.currentProject): T[]
    {
        return project.objects.filter(o => o.type === type) as T[];
    }

    /**
     * @param id Id of the object to get
     * @param project Project
     * @returns Object with id. If the id is invalid, returns null.
     */
    public static getObjectWithId<T extends ObjectModel>(id: number, project: ProjectModel = this.currentProject): T | null
    {
        if (id < 0) return null;
        return (project.objects.find(o => o.id === id) as T) || null;
    }

    public static getObjectWithName<T extends ObjectModel>(name: string, project: ProjectModel = this.currentProject): T | null
    {
        if (!name) return null;
        return (project.objects.find(o => o.name === name) as T) || null;
    }

    private static genId(project: ProjectModel = this.currentProject): number
    {
        // TODO: optimize this w/ a cache ?
        for (let i = 0; i < 1000000; i++)
        {
            if (!project.objects.find(o => o.id === i))
            {
                return i;
            }
        }

        throw new Error("max game objects");
    }

    public static getSpriteSize(sprite: SpriteModel | number, project: ProjectModel = this.currentProject): Point
    {
        if (typeof(sprite) === "number")
        {
            sprite = this.getObjectWithId<SpriteModel>(sprite, project)!;
            if (!sprite) throw new Error("bad sprite id"); 
        }

        const img = ImageCache.getCachedImage(sprite.path);
        const cellWidth = Math.floor(img.width / sprite.numCells);
        return new Point(cellWidth, img.height);
    }
}