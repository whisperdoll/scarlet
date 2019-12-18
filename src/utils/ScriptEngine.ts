import * as fs from "fs";
import * as vm from "vm";
import ObjectHelper from "./ObjectHelper";
import { ProjectModel, ScriptModel } from "./datatypes";
import { PointLike } from "./point";

export interface StageScriptData
{
    size: PointLike;
    age: number;
};

export interface PlayerScriptData
{
    position: PointLike;
};

export interface ScriptResult {};
export type ScriptMethodCollection<C extends ScriptContext, R extends ScriptResult> = {[key: string]: (context: C) => R};
export interface ScriptContext
{
};

export interface EnemyScriptData
{
    age: number;
    spawnPosition: PointLike;
    position: PointLike;
};

export interface EnemyScriptContext extends ScriptContext
{
    index: number;
    enemy: EnemyScriptData;
    stage: StageScriptData;
    delta: number;
};

export interface EnemyScriptResult extends ScriptResult
{
    position?: PointLike;
    store?: any;
    fire?: boolean;
    alive?: boolean;
};

export interface EnemyScriptMethodCollection extends ScriptMethodCollection<EnemyScriptContext, EnemyScriptResult>
{
    update: (context: EnemyScriptContext) => EnemyScriptResult;
};

export interface BossScriptData
{
    totalAge: number;
    formAge: number;
    formIndex: number;
    spawnPosition: PointLike;
    position: PointLike;
};

export interface BossScriptContext extends ScriptContext
{
    boss: BossScriptData;
    stage: StageScriptData;
    delta: number;
};

export interface BossScriptResult extends ScriptResult
{
    position?: PointLike;
    store?: any;
    fire?: boolean;
    alive?: boolean;
};

export interface BossScriptMethodCollection extends ScriptMethodCollection<BossScriptContext, BossScriptResult>
{
    update: (context: BossScriptContext) => BossScriptResult;
};

export interface BulletScriptData
{
    age: number;
    position: PointLike;
    spawnPosition: PointLike;
};

export interface BulletScriptContext extends ScriptContext
{
    index: number;
    bullet: BulletScriptData;
    stage: StageScriptData;
    delta: number;
};

export interface BulletScriptResult extends ScriptResult
{
    position?: PointLike;
    alive?: boolean;
}

export interface BulletScriptMethodCollection extends ScriptMethodCollection<BulletScriptContext, BulletScriptResult>
{
    update: (context: BulletScriptContext) => BulletScriptResult;
}

export default class ScriptEngine
{
    private static scriptMap: Map<number, vm.Script> = new Map();
    private static resultCache: Map<string, any> = new Map();
    private static contextCache: Map<number, vm.Context> = new Map();

    public static updateCache(project: ProjectModel)
    {
        this.contextCache.clear();
        this.resultCache.clear();
        const scripts = ObjectHelper.getObjectsWithType<ScriptModel>("script", project);
        scripts.forEach(script => this.fetchScriptFor(script, project));
    }

    private static fetchScriptFor(scriptObject: ScriptModel, project: ProjectModel): boolean
    {
        let code: string;

        try
        {
            code = fs.readFileSync(scriptObject.path, "utf8");
            const script = new vm.Script(code);
            this.scriptMap.set(scriptObject.id, script);
            const context = vm.createContext();
            script.runInContext(context);
            this.contextCache.set(scriptObject.id, context);
        }
        catch (e)
        {
            console.error(e);
            return false;
        }

        return true;
    }

    public static parseScript<C extends ScriptContext, R extends ScriptResult>(scriptId: number, project: ProjectModel): ScriptMethodCollection<C, R>
    {
        if (scriptId === -1)
        {
            throw new Error("tried to parse script for scriptless object ");
        }
        if (!this.contextCache.has(scriptId))
        {
            throw new Error("fetch script first");
        }
        
        return this.contextCache.get(scriptId) as ScriptMethodCollection<C, R>;
    }

    public static executeScript<C extends ScriptContext, R extends ScriptResult>(methodCollection: ScriptMethodCollection<C, R>, method: string, context: C): R
    {
        return methodCollection[method](context);
        /*const cacheKey = context._uniq;
        const cached = this.resultCache.get(cacheKey);
        if (cached)
        {
            return cached;
        }
        else
        {
            const results = methodCollection[method](context);
            this.resultCache.set(cacheKey, results);
            return results;
        }*/
    }
}