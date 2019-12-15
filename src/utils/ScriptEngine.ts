import * as fs from "fs";
import * as vm from "vm";
import ObjectHelper from "./ObjectHelper";
import { ProjectModel, ScriptModel, ObjectModel, EnemyModel, PlayerModel } from "./datatypes";

interface FunctionData
{
    name: string;
    body: string;
};

export interface GameScriptData
{
    size: {
        x: number,
        y: number
    }
};

export interface ScriptResult {};
export interface ScriptMethodCollection {};

export interface EnemyScriptContext
{
    index: number;
    spawnPosition: {
        x: number,
        y: number
    };
    game: GameScriptData;
    age: number;
    stageAge: number;
};

export interface EnemyScriptResult extends ScriptResult
{
    position?: {
        x: number,
        y: number
    };
    store?: any;
};

export interface EnemyScriptMethodCollection extends ScriptMethodCollection
{
    update: (context: EnemyScriptContext) => EnemyScriptResult;
};

export default class ScriptEngine
{
    private static scriptMap: Map<number, vm.Script> = new Map();

    public static updateCache(project: ProjectModel)
    {
        const scripts = ObjectHelper.getObjectsWithType<ScriptModel>("script", project);
        scripts.forEach(script => this.fetchScriptFor(script, project));
        console.log(this.scriptMap);
    }

    private static fetchScriptFor(scriptObject: ScriptModel, project: ProjectModel): boolean
    {
        let code: string;

        try
        {
            code = fs.readFileSync(scriptObject.path, "utf8");
            this.scriptMap.set(scriptObject.id, new vm.Script(code));
        }
        catch (e)
        {
            console.error(e);
            return false;
        }

        return true;
    }

    public static parseScriptFor<T extends ScriptMethodCollection>(obj: ObjectModel & { scriptId: number }, project: ProjectModel): T
    {
        if (obj.scriptId === -1)
        {
            throw "tried to parse script for scriptless object " + obj.name;
        }
        if (!this.scriptMap.has(obj.scriptId))
        {
            throw "fetch script first";
        }

        const script = this.scriptMap.get(obj.scriptId) as vm.Script;
        const context = vm.createContext();
        script.runInContext(context);
        return context as T;
    }
}