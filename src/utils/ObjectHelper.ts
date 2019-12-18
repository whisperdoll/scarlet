import { ObjectType, ProjectModel, ObjectModel, SpriteModel, PlayerModel, ErrorTypes, ScriptModel, EnemyModel, BulletModel, BossModel, StageModel, BackgroundModel } from "./datatypes";
import { array_copy, obj_copy, array_remove } from "./utils";

export default class ObjectHelper
{
    public static init(project: ProjectModel): ProjectModel
    {
        // do other stuff here eventually (caching ids, error checking, etc)
        return project;
    }

    public static createAndAddObject<T extends ObjectModel>(type: ObjectType, project: ProjectModel): { obj: T, project: ProjectModel }
    {
        const id = this.genId(project);
        let ret: ObjectModel;
        const p = obj_copy(project) as ProjectModel;

        // ADDTYPE
        switch (type)
        {
            case "sprite":
                ret = {
                    id: id,
                    name: "New Sprite " + this.getObjectsWithType(type, project).length,
                    type: "sprite",
                    path: "",
                    hitboxes: []
                } as SpriteModel;
                break;
            case "player":
                ret = {
                    id: id,
                    name: "New Player " + this.getObjectsWithType(type, project).length,
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
                    forms: [],
                    type: "boss"
                } as BossModel;
                break;
            case "stage":
                ret = {
                    id: id,
                    name: "New Stage " + this.getObjectsWithType(type, project).length,
                    type: "stage",
                    backgroundId: -1,
                    bossId: -1,
                    playerId: -1,
                    lengthSeconds: 60,
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
        p.objects = p.objects.concat([ ret ]);
        return { obj: ret as T, project: p };
    }

    public static updateObject(obj: ObjectModel, project: ProjectModel, _errors: ErrorTypes[]): { errors: ErrorTypes[], project: ProjectModel }
    {
        const errors = array_copy(_errors);

        array_remove(errors, "Duplicate name");
        array_remove(errors, "Empty name");

        const p = obj_copy(project) as ProjectModel;
        p.objects = array_copy(p.objects);
        p.objects[p.objects.findIndex(o => o.id === obj.id)] = obj;

        if (obj.name === "")
        {
            errors.push("Empty name")
        }
        if (p.objects.filter(o => o.name === obj.name).length > 1)
        {
            errors.push("Duplicate name");
        }

        return { errors: errors, project: p };
    }

    /**
     * Do not mutate the return value of this; Make a copy
     * @param type Type of objects to get
     */
    public static getObjectsWithType<T extends ObjectModel>(type: ObjectType, project: ProjectModel): T[]
    {
        return project.objects.filter(o => o.type === type) as T[];
    }

    /**
     * @param id Id of the object to get
     * @param project Project
     * @returns Object with id. If the id is invalid, returns null.
     */
    public static getObjectWithId<T extends ObjectModel>(id: number, project: ProjectModel): T | null
    {
        if (id < 0) return null;
        return (project.objects.find(o => o.id === id) as T) || null;
    }

    public static getObjectWithName<T extends ObjectModel>(name: string, project: ProjectModel): T | null
    {
        if (!name) return null;
        return (project.objects.find(o => o.name === name) as T) || null;
    }

    private static genId(project: ProjectModel): number
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
}