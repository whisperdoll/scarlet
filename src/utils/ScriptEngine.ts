import * as fs from "fs";
import * as vm from "vm";
import ObjectHelper from "./ObjectHelper";
import { ProjectModel, ScriptModel, KeyBindings } from "./datatypes";
import { PointLike } from "./point";
import PathHelper from "../utils/PathHelper";
import { obj_copy } from "../utils/utils";

export interface StageScriptData
{
    size: PointLike;
    age: number;
};

export interface PlayerScriptData
{
    position: PointLike;
};

export interface ScriptMethodCollection
{
    init: (context: ScriptContext) => ScriptResult;
    update: (context: ScriptContext) => ScriptResult;
    die: (context: ScriptContext) => ScriptResult;
};

export interface KeyContext extends Record<string, boolean>
{
    fire: boolean;
    bomb: boolean;
    focus: boolean;
    left: boolean;
    right: boolean;
    down: boolean;
    up: boolean;
};

export interface ScriptContext
{
    stage: StageScriptData;
    entity: ScriptEntityData;
    keys: KeyContext;
};

export interface ScriptEntityData
{
    age: number;
    spawnPosition: PointLike;
    position: PointLike;
    index: number;
    hp: number;
    store: Record<string, any>;
};

export interface ScriptResult
{
    position?: PointLike;
    store?: Record<string, any>;
    fire?: number;
    fireStores?: Record<string, any>[];
    alive?: boolean;
    opacity?: number;
    scaleX?: number;
    scaleY?: number;
};

// engine //

export default class ScriptEngine
{
    private static scriptMap: Map<number, vm.Script> = new Map();
    private static resultCache: Map<string, any> = new Map();
    private static contextCache: Map<number, vm.Context> = new Map();
    private static contextNameCache: Map<string, vm.Context> = new Map();
    private static waitingImports: Map<string, string[][]> = new Map(); // scriptName, (scriptName, asName)[]

    public static updateCache(project: ProjectModel)
    {
        this.contextCache.clear();
        this.resultCache.clear();
        const scripts = ObjectHelper.getObjectsWithType<ScriptModel>("script", project);
        scripts.forEach(script => this.fetchScriptFor(script, project));
        this.resolveImports();
    }

    private static resolveImports()
    {
        const importlessContexts: Map<string, vm.Context> = new Map();

        this.contextNameCache.forEach((context, name) =>
        {
            importlessContexts.set(name, obj_copy(context));
        });

        this.waitingImports.forEach((scriptImportNames, scriptName) =>
        {
            const scriptContext = this.contextNameCache.get(scriptName);
            if (scriptContext)
            {
                scriptImportNames.forEach((scriptImportName) =>
                {
                    const scriptImportContext = importlessContexts.get(scriptImportName[0]);
                    if (scriptImportContext)
                    {
                        scriptContext[scriptImportName[1]] = scriptImportContext;
                    }
                    else
                    {
                        // TODO: error
                    }
                });
            }
        });
    }

    private static fetchScriptFor(scriptObject: ScriptModel, project: ProjectModel): boolean
    {
        let code: string;

        try
        {
            code = fs.readFileSync(PathHelper.resolveObjectFileName(scriptObject.path), "utf8");
            const script = new vm.Script(code);
            this.scriptMap.set(scriptObject.id, script);
            const context = vm.createContext();
            script.runInContext(context);
            this.contextCache.set(scriptObject.id, context);
            this.contextNameCache.set(scriptObject.name, context);

            // imports //
            const lines = code.replace(/\r/, "").split("\n");
            const prefix = "// import ";
            for (let i = 0; i < lines.length; i++)
            {
                if (lines[i].startsWith(prefix) && lines[i].length > prefix.length)
                {
                    const asIndex = lines[i].indexOf(" as ");
                    const importName = lines[i].substr(prefix.length, asIndex - prefix.length);
                    const contextName = lines[i].substr(asIndex + " as ".length);
                    if (!this.waitingImports.has(scriptObject.name))
                    {
                        this.waitingImports.set(scriptObject.name, []);
                    }

                    this.waitingImports.get(scriptObject.name)?.push([ importName, contextName ]);
                }
                else
                {
                    break;
                }
            }
        }
        catch (e)
        {
            console.error(e);
            return false;
        }

        return true;
    }

    public static parseScript(scriptId: number, project: ProjectModel): ScriptMethodCollection
    {
        if (scriptId === -1)
        {
            throw new Error("tried to parse script for scriptless object ");
        }
        if (!this.contextCache.has(scriptId))
        {
            throw new Error("fetch script first");
        }
        
        return this.contextCache.get(scriptId) as ScriptMethodCollection;
    }
}