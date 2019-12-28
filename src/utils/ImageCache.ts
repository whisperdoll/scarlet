import { ProjectModel, SpriteModel } from "./datatypes";
import * as fs from "fs";
import PathHelper from "./PathHelper";

export default class ImageCache
{
    private static imageMap: Map<string, HTMLImageElement> = new Map();

    public static invalidateImage(filename: string)
    {
        this.imageMap.delete(filename);
    }

    public static invalidateAll(): void
    {
        this.imageMap.clear();
    }

    public static fetchImage(filename: string)
    {
        this.getImage(filename, () => {});
    }

    public static getImage(filename: string, callback: (image: HTMLImageElement, wasCached: boolean) => any)
    {
        if (this.imageMap.has(filename))
        {
            callback(this.imageMap.get(filename) as HTMLImageElement, true);
        }
        else
        {
            const img = new Image();
            img.onload = () =>
            {
                this.imageMap.set(filename, img);
                img.onload = null;
                callback(img, false);
            };
            img.src = PathHelper.resolveObjectFileName(filename);
        }
    }

    public static getCachedImage(filename: string): HTMLImageElement
    {
        const ret = this.imageMap.get(filename);
        
        if (ret)
        {
            return ret;
        }
        else
        {
            throw new Error("image wasn't cached: " + filename);
        }
    }

    public static updateCache(project: ProjectModel, callback: () => any)
    {
        this.invalidateAll();

        let totalToFetch = 0;
        let fetchedSoFar = 0;

        project.objects.forEach((obj) =>
        {
            if (obj.type === "sprite" || obj.type === "background")
            {
                totalToFetch++;
                this.getImage((obj as any).path, () =>
                {
                    fetchedSoFar++;
                    if (fetchedSoFar === totalToFetch)
                    {
                        callback();
                    }
                });
            }
        });
    }
}