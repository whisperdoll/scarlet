import { ObjectType, ProjectModel, ObjectModel, SpriteModel, PlayerModel, ErrorTypes } from "./datatypes";
import { array_copy, obj_copy, array_ensureOne, array_remove } from "./utils";

export default class ObjectCache
{
    private static idCounter: number;
    private static idMap: Map<number, ObjectModel>;
    private static typeMap: Map<ObjectType, ObjectModel[]>;
    private static _nameMap: Map<string, ObjectModel>;

    public static init(project: ProjectModel): ProjectModel
    {
        const p = obj_copy(project);

        this.idCounter = 0;
        this.idMap = new Map<number, ObjectModel>();
        this.typeMap = new Map<ObjectType, ObjectModel[]>();
        this._nameMap = new Map<string, ObjectModel>();
        
        const f = (type: ObjectType) =>
        {
            let { key, collection } = this.collectionFromType(type, p);
            if (!collection)
            {
                (p as any)[key] = [];
                collection = [];
            }

            this.typeMap.set(type, array_copy(collection)); // we will be mutating this array

            collection.forEach((obj) =>
            {
                this.idMap.set(obj.id, obj);
                this._nameMap.set(obj.name, obj);
            });

            this.idCounter += collection.length;
        };

        f("sprite");
        f("player");

        return p;
    }

    private static setName(name: string, obj: ObjectModel): { err: ErrorTypes | null }
    {
        if (!name)
        {
            return { err: "Empty name" };
        }

        if (this._nameMap.has(name) && this._nameMap.get(name)?.id !== obj.id)
        {
            return { err: "Duplicate name" };
        }

        this._nameMap.set(name, obj);
        return { err: null };
    }

    private static typeArray(type: ObjectType): ObjectModel[]
    {
        return this.typeMap.get(type) as ObjectModel[];
    }

    public static generate<T extends ObjectModel>(type: ObjectType, project: ProjectModel): { obj: T, project: ProjectModel }
    {
        const id = this.genId();
        let ret: ObjectModel;
        const p = obj_copy(project) as ProjectModel;

        switch (type)
        {
            case "sprite":
                ret = {
                    id: id,
                    name: "New Sprite " + this.typeArray(type).length,
                    type: "sprite",
                    path: ""
                } as SpriteModel;
                break;
            case "player":
                ret = {
                    id: id,
                    name: "New Player " + this.typeArray(type).length,
                    script: "",
                    spriteId: -1,
                    type: "player"
                } as PlayerModel;
                break;
            default:
                this.idCounter--;
                throw "fuck u";
        }

        const { key, collection } = this.collectionFromType(type, project);
        (p as any)[key] = collection.concat([ ret ]);

        this.typeArray(type).push(ret);
        this.idMap.set(id, ret);
        return { obj: ret as T, project: p };
    }

    public static updateObject(obj: ObjectModel, project: ProjectModel, _errors: ErrorTypes[]): { errors: ErrorTypes[], project: ProjectModel }
    {
        const errors = array_copy(_errors);
        const nameErr = this.setName(obj.name, obj).err;

        array_remove(errors, "Duplicate name");
        array_remove(errors, "Empty name");

        if (nameErr)
        {
            array_ensureOne(errors, nameErr);
        }

        this.idMap.set(obj.id, obj);
        
        const tarr = this.typeArray(obj.type);
        tarr[tarr.findIndex(o => o.id === obj.id)] = obj;

        const p = obj_copy(project);
        const { key } = this.collectionFromType(obj.type, project);
        p[key] = array_copy(tarr);
        return { errors: errors, project: p };
    }

    public static collectionFromType(type: ObjectType, project: ProjectModel): { key: string, collection: ObjectModel[] }
    {
        // key should be the name of the array so we can do like project[key] //
        switch (type)
        {
            case "sprite":
                return { key: "sprites", collection: project.sprites };
            case "player":
                return { key: "players", collection: project.players }
            default:
                throw "bad type";
        }
    }

    private static genId(): number
    {
        return this.idCounter++;
    }

    public static getObjectWithId<T extends ObjectModel>(id: number): T | null
    {
        if (id < 0) return null;

        const obj = this.idMap.get(id);
        if (obj) return obj as T;
        return null;
    }

    public static getObjectWithName<T extends ObjectModel>(name: string): T | null
    {
        if (!name) return null;

        const obj = this._nameMap.get(name);
        if (obj) return obj as T;
        return null;
    }
}