import * as fs from "fs";
import * as path from "path";
import { getUserDataPath } from "./utils";

export default class UserSettings
{
    private static appName: string;
    private static settings: { [key: string]: any } = {};
    private static writeOnSet: boolean;

    private static get dataPath()
    {
        if (!this.appName) throw new Error("pls init w/ appname");
        return path.join(getUserDataPath(), this.appName);
    }

    private static get filePath()
    {
        if (!this.appName) throw new Error("pls init w/ appname");
        return path.join(this.dataPath, this.appName + ".json");
    }

    public static init(appName: string, writeOnSet: boolean)
    {
        this.appName = appName;
        this.writeOnSet = writeOnSet;

        try
        {
            fs.mkdirSync(this.dataPath);
        }
        catch (e)
        {
            console.log("err: ", e);
        }

        fs.appendFileSync(this.filePath, "", { flag: "a" });

        try
        {
            this.settings = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
        }
        catch (e)
        {
            console.log("err reading user settings: ", e);
            this.settings = {};
            this.write();
        }
    }

    public static set(key: string, val: any)
    {
        this.settings[key] = val;
        this.writeOnSet && this.write();
    }

    public static get<T>(key: string, _default: T): T
    {
        if (this.settings.hasOwnProperty(key))
        {
            return this.settings[key] as T;
        }
        else
        {
            this.settings[key] = _default;
            this.writeOnSet && this.write();
            return _default;
        }
    }

    public static write()
    {
        fs.writeFileSync(this.filePath, JSON.stringify(this.settings));
    }
}