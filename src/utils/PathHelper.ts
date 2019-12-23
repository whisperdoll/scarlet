import * as npath from "path";
import * as fs from "fs";

export default class PathHelper
{
    private static projectFilename: string = "";

    public static setProjectFilename(projectFilename: string)
    {
        this.projectFilename = projectFilename;
    }

    /**
     * @returns An absolute path to the object
     * @param path Relative path to the object
     */
    public static resolveObjectFileName(objectFilename: string): string
    {
        return npath.resolve(npath.dirname(this.projectFilename), objectFilename);
    }

    public static relativeObjectFileName(objectFilename: string): string
    {
        return npath.relative(npath.dirname(this.projectFilename), objectFilename);
    }

    public static importObjectFileName(objectFilename: string, destFolderName: string): string
    {
        const folderPath = npath.dirname(objectFilename);
        const destFolderPath = npath.join(npath.dirname(this.projectFilename), destFolderName);
        const destFilename = npath.join(destFolderPath, npath.basename(objectFilename));

        if (folderPath !== destFolderPath)
        {
            try
            {
                fs.mkdirSync(destFolderPath);
            }
            catch (e)
            {
                if (e.code !== "EEXIST")
                {
                    throw e;
                }
            }

            fs.copyFileSync(objectFilename, destFilename);
            alert("The resource was copied to the " + destFolderName + " folder of your project!");
        }
        
        return this.relativeObjectFileName(destFilename);
    }
}