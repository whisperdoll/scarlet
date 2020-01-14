import * as npath from "path";
import * as fs from "fs";
import ObjectHelper from "./ObjectHelper";

export default class PathHelper
{
    private static get projectFilename(): string
    {
        return ObjectHelper.projectFilename;
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
        let destFilename = npath.join(destFolderPath, npath.basename(objectFilename));

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

            while (fs.existsSync(destFilename))
            {
                const newBase = npath.basename(objectFilename, npath.extname(objectFilename)) + "_copy" + npath.extname(objectFilename);
                destFilename = npath.join(destFolderPath, newBase);
            }

            fs.copyFileSync(objectFilename, destFilename);
            alert("The resource was copied to the " + destFolderName + " folder of your project!");
        }
        
        return this.relativeObjectFileName(destFilename);
    }
}